"""Versión del service worker (const VERSION en sw.js): comprobarla o subirla.

Uso:
  python herramientas/version_sw.py --check [--base origin/main]   falla si cambió la app y VERSION no
  python herramientas/version_sw.py --subir                       VERSION = v<N+1>-<fecha de hoy>
  python herramientas/version_sw.py --sellar                      (solo en el despliegue) VERSION += -<huella del contenido>

--sellar lo corre Netlify al publicar (netlify.toml): agrega a VERSION los 8 primeros caracteres del SHA-256 de todos los
archivos de la lista APP, de models/partes.json y de sw.js. Si cualquier archivo cambió, la versión publicada cambia y los
teléfonos se actualizan aunque nadie haya corrido --subir. No se usa en el repo: el sw.js del repo no lleva huella.

Por qué: los teléfonos solo descargan los archivos nuevos cuando cambia VERSION. Si se olvida subirla, se quedan con la
versión vieja aunque Netlify ya tenga la nueva.

--check compara contra --base (por defecto origin/main): si algún archivo de la lista APP de sw.js, de models/ o el propio
sw.js cambió y VERSION es la misma, falla. Siempre revisa el formato v<número>-AAAA-MM-DD. Si la base no existe (por
ejemplo, un clon superficial), solo revisa el formato y lo avisa.
"""
import argparse, datetime, os, re, subprocess, sys

AQUI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Una base válida es un nombre de rama o un commit; nunca algo que empiece por «-» (git lo leería como opción).
BASE_VALIDA = re.compile(r'^[A-Za-z0-9][A-Za-z0-9._/~^@{}-]*$')
PATRON = re.compile(r"const VERSION = '(v(\d+)-(\d{4}-\d{2}-\d{2}))';")


def git(raiz, *args):
    r = subprocess.run(['git', *args], cwd=raiz, capture_output=True, text=True, encoding='utf-8')
    return r.returncode, r.stdout


def version_de(texto):
    m = PATRON.search(texto or '')
    return m.group(1) if m else None


def lista_app(texto):
    m = re.search(r'const APP = \[(.*?)\];', texto, re.S)
    return {u.replace('./', '') for u in re.findall(r"'([^']+)'", m.group(1))} - {''} if m else set()


def check(raiz, base):
    with open(os.path.join(raiz, 'sw.js'), encoding='utf-8') as f:
        sw = f.read()
    v = version_de(sw)
    if not v:
        print("  ERROR  sw.js: VERSION no tiene el formato v<número>-AAAA-MM-DD (const VERSION = 'v17-2026-11-25';)")
        return 1
    print(f'  VERSION actual: {v}')
    if not BASE_VALIDA.match(base or ''):
        print(f'  aviso  base {base!r} no es un nombre de rama o commit válido: solo se revisó el formato')
        return 0
    codigo, _ = git(raiz, 'rev-parse', '--verify', '--quiet', base)
    if codigo != 0:
        print(f'  aviso  no existe la base {base!r}: solo se revisó el formato')
        return 0
    _, mb = git(raiz, 'merge-base', base, 'HEAD')
    mb = mb.strip() or base
    _, sw_base = git(raiz, 'show', f'{mb}:sw.js')
    v_base = version_de(sw_base)
    _, salida = git(raiz, 'diff', '--name-only', mb, '--')
    _, sin_commit = git(raiz, 'diff', '--name-only', 'HEAD', '--')
    cambiados = {x for x in (salida + sin_commit).splitlines() if x}
    app = lista_app(sw) | {'sw.js'}
    tocan = sorted(x for x in cambiados if x in app or x.startswith('models/'))
    if not tocan:
        print(f'  ok  ningún archivo de la app cambió frente a {base}')
        return 0
    if v == v_base:
        print(f'  ERROR  cambiaron archivos de la app y VERSION sigue en {v}:')
        for x in tocan:
            print(f'           {x}')
        print('         Corre: python herramientas/version_sw.py --subir')
        return 1
    print(f'  ok  VERSION subió de {v_base} a {v} ({len(tocan)} archivo(s) de la app cambiaron)')
    return 0


def subir(raiz):
    ruta = os.path.join(raiz, 'sw.js')
    with open(ruta, encoding='utf-8', newline='') as f:
        sw = f.read()
    m = PATRON.search(sw)
    if not m:
        print('  ERROR  no encuentro VERSION en sw.js')
        return 1
    nueva = f'v{int(m.group(2)) + 1}-{datetime.date.today().isoformat()}'
    sw = sw[:m.start(1)] + nueva + sw[m.end(1):]
    with open(ruta, 'w', encoding='utf-8', newline='') as f:
        f.write(sw)
    print(f'  VERSION: {m.group(1)} → {nueva}')
    return 0


def sellar(raiz):
    """Solo en el despliegue: VERSION += -<huella de 8 caracteres del contenido de la app>."""
    import hashlib
    ruta = os.path.join(raiz, 'sw.js')
    with open(ruta, encoding='utf-8', newline='') as f:
        sw = f.read()
    if re.search(r"const VERSION = 'v\d+-\d{4}-\d{2}-\d{2}-[0-9a-f]{8}';", sw):
        print('  ok  sw.js ya está sellado')
        return 0
    m = PATRON.search(sw)
    if not m:
        print('  ERROR  no encuentro VERSION en sw.js')
        return 1
    h = hashlib.sha256(sw.encode('utf-8'))
    for u in sorted(lista_app(sw) | {'models/partes.json'}):
        archivo = os.path.join(raiz, u) if u else None
        if not archivo or not os.path.isfile(archivo):
            continue  # './' (la raíz) o un archivo faltante: validar_contratos.py ya avisa de los faltantes
        h.update(u.encode('utf-8'))
        with open(archivo, 'rb') as f:
            h.update(f.read())
    nueva = f'{m.group(1)}-{h.hexdigest()[:8]}'
    with open(ruta, 'w', encoding='utf-8', newline='') as f:
        f.write(sw[:m.start(1)] + nueva + sw[m.end(1):])
    print(f'  VERSION publicada: {nueva}')
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--check', action='store_true', help='comprobar formato y que VERSION suba si cambió la app')
    g.add_argument('--subir', action='store_true', help='subir VERSION a v<N+1>-<hoy>')
    g.add_argument('--sellar', action='store_true', help='solo en el despliegue: agregar la huella del contenido a VERSION')
    ap.add_argument('--base', default='origin/main', help='rama o commit con que comparar (por defecto origin/main)')
    a = ap.parse_args()
    if a.sellar:
        sys.exit(sellar(AQUI))
    sys.exit(check(AQUI, a.base) if a.check else subir(AQUI))


if __name__ == '__main__':
    main()
