"""Parte los archivos grandes (modelos y motor WASM) en trozos de 8 MB y escribe models/partes.json.

Por qué: algunos hostings rechazan o atascan archivos grandes (Netlify Drop se atasca con archivos
de más de ~10 MB; GitHub advierte desde 50 MB y rechaza desde 100 MB). La app (js/motor.js) une
los trozos al cargar y verifica el tamaño y el SHA-256.

Uso, desde la raíz de la app:
    python3 herramientas/partir.py ruta/al/modelo.onnx [destino_en_la_app]
      -> parte un archivo nuevo o actualizado (p. ej. un modelo reentrenado)
    python3 herramientas/partir.py --unir models/e5_small_latino.onnx salida.onnx
      -> reconstruye el original desde sus partes
"""
import hashlib, json, os, sys

TAM = 8 * 1024 * 1024
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAN = os.path.join(RAIZ, 'models', 'partes.json')


def leer_man():
    return json.load(open(MAN)) if os.path.exists(MAN) else {}


def partir(origen, destino):
    datos = open(origen, 'rb').read()
    nombre = os.path.basename(destino)
    man = leer_man()
    for p in man.get(destino, {}).get('partes', []):
        if os.path.exists(os.path.join(RAIZ, p)):
            os.remove(os.path.join(RAIZ, p))
    partes = []
    os.makedirs(os.path.join(RAIZ, 'models', 'partes'), exist_ok=True)
    huella = hashlib.sha256(datos).hexdigest()
    for i in range(0, len(datos), TAM):
        # la huella en el nombre: si el modelo cambia, cambia el nombre y ninguna caché sirve el viejo
        rel = f'models/partes/{nombre}.{huella[:8]}.{i // TAM:02d}.bin'
        open(os.path.join(RAIZ, rel), 'wb').write(datos[i:i + TAM])
        partes.append(rel)
    man[destino] = {'bytes': len(datos), 'sha256': huella, 'partes': partes}
    json.dump(man, open(MAN, 'w'), indent=1, ensure_ascii=False)
    print(f'{destino}: {len(datos)/1e6:.1f} MB en {len(partes)} partes')


def unir(destino, salida):
    m = leer_man()[destino]
    datos = b''.join(open(os.path.join(RAIZ, p), 'rb').read() for p in m['partes'])
    assert len(datos) == m['bytes'] and hashlib.sha256(datos).hexdigest() == m['sha256'], 'partes dañadas'
    open(salida, 'wb').write(datos)
    print('ok', salida)


if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == '--unir':
        unir(a[1], a[2])
    elif a:
        partir(a[0], a[1] if len(a) > 1 else os.path.relpath(os.path.abspath(a[0]), RAIZ).replace(os.sep, '/'))
    else:
        print(__doc__)
