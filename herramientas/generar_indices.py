"""Genera docs/decisiones/README.md (índice de decisiones) y CHANGELOG.md (desde docs/cambios/).

Uso:  python herramientas/generar_indices.py [--check]

Así nadie edita a mano un archivo que los tres tocarían a la vez: cada decisión y cada cambio es su propio archivo con
encabezado (frontmatter) y estos dos se regeneran. Con --check no escribe: falla si están desactualizados (CI).
"""
import argparse, os, re, sys

AQUI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AVISO = '<!-- Generado por herramientas/generar_indices.py: no lo edites a mano. -->'
ORDEN_ESTADOS = ['aceptada', 'propuesta', 'rechazada']


def frontmatter(ruta):
    with open(ruta, encoding='utf-8') as f:
        txt = f.read()
    m = re.match(r'^---\n(.*?)\n---\n(.*)$', txt, re.S)
    if not m:
        return None, txt
    meta = {}
    for linea in m.group(1).splitlines():
        if ':' in linea:
            k, v = linea.split(':', 1)
            meta[k.strip()] = v.split('#')[0].strip().strip('"')
    return meta, m.group(2)


def indice_decisiones(raiz):
    d = os.path.join(raiz, 'docs', 'decisiones')
    filas = []
    for n in sorted(os.listdir(d)):
        if not re.match(r'^\d{4}-\d{2}-\d{2}-.+\.md$', n):
            continue
        meta, cuerpo = frontmatter(os.path.join(d, n))
        if meta is None:
            raise SystemExit(f'docs/decisiones/{n}: falta el encabezado --- estado/fecha ---')
        t = re.search(r'^# (.+)$', cuerpo, re.M)
        filas.append((meta.get('estado', '?'), meta.get('fecha', n[:10]), t.group(1).strip() if t else n, n))
    rango = lambda e: ORDEN_ESTADOS.index(e) if e in ORDEN_ESTADOS else len(ORDEN_ESTADOS)
    filas.sort(key=lambda x: (rango(x[0]), x[1], x[3]))
    out = [AVISO, '# Registro de decisiones', '',
           'Una decisión por archivo, con nombre `AAAA-MM-DD-slug.md` (sin números, para que dos personas no choquen).',
           'Para proponer una: copia [plantilla.md](plantilla.md), ponle `estado: propuesta` y abre un PR. Después regenera',
           'este índice con `python herramientas/generar_indices.py`.', '']
    for estado in sorted({f[0] for f in filas}, key=rango):
        grupo = [f for f in filas if f[0] == estado]
        out += [f'## {estado.capitalize()}s ({len(grupo)})', '', '| Fecha | Decisión |', '|---|---|']
        out += [f'| {fe} | [{ti}]({n}) |' for _, fe, ti, n in grupo]
        out.append('')
    return '\n'.join(out)


def changelog(raiz):
    d = os.path.join(raiz, 'docs', 'cambios')
    entradas = []
    for n in sorted(os.listdir(d)):
        if n == 'plantilla.md' or not n.endswith('.md'):
            continue
        meta, cuerpo = frontmatter(os.path.join(d, n))
        if meta is None:
            raise SystemExit(f'docs/cambios/{n}: falta el encabezado --- fecha/rol/tipo/pr ---')
        texto = ' '.join(cuerpo.split())
        entradas.append((meta.get('fecha', n[:10]), meta.get('rol', '?'), meta.get('tipo', '?'), meta.get('pr', ''), texto, n))
    out = [AVISO, '# Cambios', '', 'Se genera desde `docs/cambios/` (un archivo por cambio). Para agregar uno, copia',
           '`docs/cambios/plantilla.md`.', '']
    for fecha in sorted({e[0] for e in entradas}, reverse=True):
        out += [f'## {fecha}', '']
        for _, rol, tipo, pr, texto, n in sorted(x for x in entradas if x[0] == fecha):
            out.append(f'- **{rol}** · {tipo}{f" ({pr})" if pr else ""}: {texto}')
        out.append('')
    return '\n'.join(out)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--check', action='store_true', help='no escribir; fallar si están desactualizados')
    a = ap.parse_args()
    objetivos = {os.path.join(AQUI, 'docs', 'decisiones', 'README.md'): indice_decisiones(AQUI),
                 os.path.join(AQUI, 'CHANGELOG.md'): changelog(AQUI)}
    viejos = []
    for ruta, nuevo in objetivos.items():
        actual = open(ruta, encoding='utf-8').read() if os.path.exists(ruta) else None
        rel = os.path.relpath(ruta, AQUI)
        if actual == nuevo:
            print(f'  ok  {rel} al día')
        elif a.check:
            viejos.append(rel)
            print(f'  ERROR  {rel} desactualizado: corre python herramientas/generar_indices.py')
        else:
            with open(ruta, 'w', encoding='utf-8', newline='\n') as f:
                f.write(nuevo)
            print(f'  escrito  {rel}')
    sys.exit(1 if viejos else 0)


if __name__ == '__main__':
    main()
