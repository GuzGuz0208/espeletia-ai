"""Construye el modelo base de la Lente a partir de carpetas de fotos y lo guarda en models/parque.json.

Así la Lente reconoce desde el primer uso en cualquier teléfono, sin que nadie la entrene en campo.

Estructura esperada (una carpeta por clase, nombres como en paquete.json → clases):
    fotos/frailejon/*.jpg   fotos/pajonal/*.jpg   fotos/laguna/*.jpg   fotos/roca/*.jpg
    fotos/nevado/*.jpg      fotos/musgo/*.jpg     fotos/sietecueros/*.jpg   fotos/otro/*.jpg
Recomendado: 20 a 40 fotos por clase, de días, lugares y ángulos distintos. «otro» con personas,
carros, piso, cielo, letreros: lo que NO es ninguna clase.

Uso, desde la raíz de la app:
    pip install onnxruntime pillow numpy
    python3 herramientas/lente_base.py ruta/a/fotos

Además de escribir models/parque.json, mide qué tan bien distingue las clases dejando fuera cada
foto (validación «deja uno fuera») e imprime la matriz de confusión. Las estaciones que ya estén en
models/parque.json se conservan.
"""
import base64, hashlib, json, os, sys, datetime
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
EXT = ('.jpg', '.jpeg', '.png', '.webp', '.heic')


def modelo():
    man = json.load(open(os.path.join(RAIZ, 'models', 'partes.json')))['models/mnv2_embed.onnx']
    datos = b''.join(open(os.path.join(RAIZ, p), 'rb').read() for p in man['partes'])
    assert hashlib.sha256(datos).hexdigest() == man['sha256'], 'partes del modelo dañadas'
    return ort.InferenceSession(datos)


def tensor(ruta):
    # Igual que js/ml.js: recorte central del 80 % del lado menor → 224×224 → normalización ImageNet
    im = ImageOps.exif_transpose(Image.open(ruta)).convert('RGB')
    w, h = im.size
    lado = min(w, h) * 0.8
    x0, y0 = (w - lado) / 2, (h - lado) / 2
    im = im.resize((224, 224), Image.BILINEAR, box=(x0, y0, x0 + lado, y0 + lado))
    a = (np.asarray(im, dtype=np.float32) / 255 - MEAN) / STD
    return a.transpose(2, 0, 1)[None]


def codificar(vs, clases):
    vs = np.asarray(vs, dtype=np.float32)
    esc = np.abs(vs).max(1) / 127
    esc[esc == 0] = 1
    q = np.round(vs / esc[:, None]).astype(np.int8)
    return {'dim': int(vs.shape[1]), 'clases': clases,
            'vectores': base64.b64encode(q.tobytes()).decode(), 'escalas': base64.b64encode(esc.astype(np.float32).tobytes()).decode()}


def main(carpeta):
    paq = json.load(open(os.path.join(RAIZ, 'paquete.json')))
    validas = [k['id'] for k in paq['clases']]
    ses = modelo()
    nombre_in = ses.get_inputs()[0].name
    vs, cl = [], []
    for c in sorted(os.listdir(carpeta)):
        d = os.path.join(carpeta, c)
        if not os.path.isdir(d):
            continue
        if c not in validas:
            print(f'  aviso: la carpeta «{c}» no es una clase de paquete.json ({", ".join(validas)}); se omite')
            continue
        fotos = [f for f in sorted(os.listdir(d)) if f.lower().endswith(EXT)]
        for f in fotos:
            try:
                v = ses.run(None, {nombre_in: tensor(os.path.join(d, f))})[0][0]
            except Exception as e:  # foto dañada o formato no soportado
                print(f'  no pude leer {c}/{f}: {e}')
                continue
            vs.append(v / (np.linalg.norm(v) or 1)); cl.append(c)
        print(f'{c:12s} {sum(1 for x in cl if x == c):3d} fotos')
    if not vs:
        sys.exit('No encontré fotos. Revisa la estructura de carpetas (ver la ayuda arriba).')

    # Validación «deja uno fuera» con el mismo k-NN de la app (k=7, votos exp(10·similitud))
    V = np.stack(vs); S = V @ V.T; np.fill_diagonal(S, -9)
    nombres = sorted(set(cl)); idx = {c: i for i, c in enumerate(nombres)}
    conf = np.zeros((len(nombres), len(nombres)), int)
    for i in range(len(cl)):
        top = np.argsort(-S[i])[:7]
        votos = {}
        for j in top: votos[cl[j]] = votos.get(cl[j], 0) + np.exp(10 * S[i, j])
        conf[idx[cl[i]], idx[max(votos, key=votos.get)]] += 1
    print('\nValidación deja-uno-fuera (filas: real, columnas: lo que dijo la Lente)')
    print(' ' * 12 + ''.join(f'{n[:6]:>7s}' for n in nombres))
    for n in nombres:
        print(f'{n:12s}' + ''.join(f'{x:7d}' for x in conf[idx[n]]) + f'   acierto {conf[idx[n], idx[n]] / max(1, conf[idx[n]].sum()):.0%}')
    print(f'Total: {np.trace(conf) / conf.sum():.0%}')

    ruta = os.path.join(RAIZ, 'models', 'parque.json')
    previo = json.load(open(ruta)) if os.path.exists(ruta) else {}
    salida = {'tipo': 'paramo-parque', 'version': 1, 'fecha': datetime.date.today().isoformat(),
              'lente': codificar(vs, cl), 'estaciones': previo.get('estaciones', {})}
    json.dump(salida, open(ruta, 'w'), ensure_ascii=False)
    print(f'\nEscrito models/parque.json ({os.path.getsize(ruta) / 1e3:.0f} KB). Publica el sitio para que llegue a todos los teléfonos.')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
    else:
        main(sys.argv[1])
