"""Verifica los modelos congelados: cada archivo grande de models/partes.json contra sus partes en disco.

Uso:  python herramientas/verificar_modelos.py [--raiz CARPETA]

Para cada entrada (modelo de la Lente, modelo del chat, motor WASM) comprueba que:
- todas las partes existan, en orden (.00, .01, …), y ninguna pase de 8 MB;
- el nombre de cada parte lleve los 8 primeros caracteres de la huella;
- el tamaño total y el SHA-256 de las partes unidas coincidan con lo anotado;
- no haya partes huérfanas en models/partes/.
Sale con código 1 si algo no cuadra. No modifica nada.
"""
import argparse, hashlib, json, os, re, sys

AQUI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAM = 8 * 1024 * 1024  # el mismo límite que herramientas/partir.py


def verificar(raiz):
    errores = []
    try:
        with open(os.path.join(raiz, 'models', 'partes.json'), encoding='utf-8') as f:
            man = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        return [f'models/partes.json: {e}'], 0
    referidas = set()
    for ruta, m in man.items():
        h, total, ok = hashlib.sha256(), 0, True
        for i, p in enumerate(m.get('partes', [])):
            referidas.add(os.path.normpath(p))
            nombre = os.path.basename(p)
            esperado = f"{os.path.basename(ruta)}.{m['sha256'][:8]}.{i:02d}.bin"
            if nombre != esperado:
                errores.append(f'{ruta}: la parte {i} se llama {nombre}, se esperaba {esperado}')
            archivo = os.path.join(raiz, p)
            if not os.path.exists(archivo):
                errores.append(f'{ruta}: falta {p}')
                ok = False
                continue
            tam = os.path.getsize(archivo)
            if tam > TAM:
                errores.append(f'{ruta}: {p} pesa {tam} bytes (máximo {TAM})')
            with open(archivo, 'rb') as f:
                for bloque in iter(lambda: f.read(1 << 20), b''):
                    h.update(bloque)
                    total += len(bloque)
        if not ok:
            continue
        if total != m['bytes']:
            errores.append(f"{ruta}: las partes suman {total} bytes y se esperaban {m['bytes']}")
        elif h.hexdigest() != m['sha256']:
            errores.append(f'{ruta}: la huella SHA-256 no coincide (partes dañadas o cambiadas)')
        else:
            print(f"  ok  {ruta}: {len(m['partes'])} partes, {total / 1e6:.1f} MB, sha256 {m['sha256'][:12]}…")
    carpeta = os.path.join(raiz, 'models', 'partes')
    if os.path.isdir(carpeta):
        for n in sorted(os.listdir(carpeta)):
            if os.path.normpath(f'models/partes/{n}') not in referidas:
                errores.append(f'models/partes/{n}: parte huérfana (no está en models/partes.json)')
    return errores, len(man)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--raiz', default=AQUI, help='carpeta del repositorio (por defecto, la de este script)')
    errores, n = verificar(ap.parse_args().raiz)
    for e in errores:
        print(f'  ERROR  {e}')
    if errores:
        print(f'\nModelos: {len(errores)} error(es).')
        sys.exit(1)
    print(f'\nModelos: OK ({n} archivos verificados).')


if __name__ == '__main__':
    main()
