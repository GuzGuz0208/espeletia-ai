"""Versión del service worker (const VERSION en sw.js): comprobarla o subirla.

Uso:
  python herramientas/version_sw.py --check [--base origin/main]   falla si cambió la app y VERSION no
  python herramientas/version_sw.py --subir                       VERSION = v<N+1>-<fecha de hoy>

Por qué: los teléfonos solo descargan los archivos nuevos cuando cambia VERSION. Si se olvida subirla, se quedan con la
versión vieja aunque Netlify ya tenga la nueva.

--check compara contra --base (por defecto origin/main): si algún archivo de la lista APP de sw.js, de models/ o el propio
sw.js cambió y VERSION es la misma, falla. Siempre revisa el formato v<número>-AAAA-MM-DD. Si la base no existe (por
ejemplo, un clon superficial), solo revisa el formato y lo avisa.
"""
import argparse, datetime, os, re, subprocess, sys

AQUI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
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


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--check', action='store_true', help='comprobar formato y que VERSION suba si cambió la app')
    g.add_argument('--subir', action='store_true', help='subir VERSION a v<N+1>-<hoy>')
    ap.add_argument('--base', default='origin/main', help='rama o commit con que comparar (por defecto origin/main)')
    ap.add_argument('--raiz', default=AQUI, help='carpeta del repositorio')
    a = ap.parse_args()
    sys.exit(check(a.raiz, a.base) if a.check else subir(a.raiz))


if __name__ == '__main__':
    main()
