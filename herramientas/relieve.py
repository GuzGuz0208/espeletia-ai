"""Prepara el relieve REAL del mapa a partir del modelo de elevación Copernicus GLO-30.

Entrada: un recorte de alturas (uint16, metros) con su cabecera JSON en la primera línea, como el que
genera la app de prueba al descargarlo (dem_ruiz_60m.bin): zona de Brisas, el Valle de las Tumbas y el
cráter Arenas, lon -75.42 a -75.27, lat 4.97 a 4.85, celdas de ~60 m (promedio 2×2 de las de 30 m).

Salidas (en models/):
- relieve.bin  : la misma malla de alturas, para la vista 3D (117 KB).
- relieve.json : su georreferencia (esquina noroeste, paso, ancho, alto, alturas mín./máx.) y atribución.
- relieve.webp : el pliego dibujado: tinte por altura + sombreado + curvas de nivel reales cada 100 m
                 (cada 500 m más gruesas). Lo usan el mapa plano y, como textura, la vista 3D.

Uso, desde la raíz de la app:
    python3 herramientas/relieve.py herramientas/datos/dem_ruiz_60m.bin
    python3 herramientas/relieve.py --solo-atribucion    (actualiza solo la atribución de models/relieve.json)

Fuente y licencia: Copernicus DEM GLO-30 © DLR e.V. 2010-2014 y © Airbus Defence and Space GmbH
2014-2018, provisto bajo COPERNICUS por la Unión Europea y la ESA. Es un modelo de superficie (incluye
hielo y vegetación) con error típico de unos metros; sirve para ver el terreno, no para medir.
La licencia (art. 6) exige el texto exacto de ATRIBUCION y la frase DESCARGO: ver licencias/README.md.
"""
import json, os, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Texto exigido por la licencia de Copernicus DEM (art. 6 b y c). No acortar.
ATRIBUCION = ('produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 '
              'provided under COPERNICUS by the European Union and ESA; all rights reserved')
DESCARGO = ('The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability '
            'for any use of the Copernicus WorldDEM-30.')


def solo_atribucion():
    """Corrige la atribución de models/relieve.json sin volver a generar la malla (no necesita los datos del DEM)."""
    ruta = os.path.join(RAIZ, 'models', 'relieve.json')
    with open(ruta, encoding='utf-8') as f:
        meta = json.load(f)
    meta['atribucion'], meta['descargo'] = ATRIBUCION, DESCARGO
    with open(ruta, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    print('atribución actualizada en models/relieve.json (sube la versión del SW: python herramientas/version_sw.py --subir)')


if __name__ == '__main__' and sys.argv[1:] == ['--solo-atribucion']:
    solo_atribucion()
    sys.exit(0)

import numpy as np
from scipy import ndimage
from PIL import Image
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
ESCALA = 4  # la imagen sale a 4× la malla (1080×864) para que las curvas se vean suaves

# Tinte por altura, en la paleta del álbum: bosque → páramo → superpáramo → roca y hielo
PARADAS = [
    (2700, (93, 130, 98)), (3300, (122, 156, 112)), (3800, (163, 184, 132)), (4200, (196, 199, 152)),
    (4500, (204, 196, 170)), (4800, (190, 188, 182)), (5000, (214, 218, 216)), (5300, (240, 243, 241)),
]


def leer(ruta):
    raw = open(ruta, 'rb').read()
    i = raw.index(b'\n')
    meta = json.loads(raw[:i])
    z = np.frombuffer(raw[i + 1:], dtype='<u2').reshape(meta['h'], meta['w']).astype(np.float32)
    return meta, z, raw[i + 1:]


def tinte(z):
    alts = np.array([p[0] for p in PARADAS], np.float32)
    cols = np.array([p[1] for p in PARADAS], np.float32)
    out = np.zeros(z.shape + (3,), np.float32)
    for c in range(3):
        out[..., c] = np.interp(z, alts, cols[:, c])
    return out


def sombreado(z, paso_m, az=315, alt=40, exagerar=1.6):
    gy, gx = np.gradient(z * exagerar, paso_m)
    pend = np.arctan(np.hypot(gx, gy))
    asp = np.arctan2(-gx, gy)
    a, b = np.radians(az), np.radians(alt)
    s = np.sin(b) * np.cos(pend) + np.cos(b) * np.sin(pend) * np.cos(a - asp)
    return np.clip(s, 0, 1)


def main(entrada):
    meta, z, crudo = leer(entrada)
    h, w = z.shape
    lat_c = meta['lat1'] - meta['paso'] * h / 2
    paso_m = meta['paso'] * 111320  # ~61 m (en esta latitud el coseno es 0,996)
    zz = ndimage.zoom(z, ESCALA, order=3)
    color = tinte(zz) * (0.50 + 0.55 * sombreado(zz, paso_m / ESCALA))[..., None]
    color = np.clip(color, 0, 255).astype(np.uint8)

    H, W = zz.shape
    fig = plt.figure(figsize=(W / 100, H / 100), dpi=100)
    ax = fig.add_axes([0, 0, 1, 1]); ax.axis('off')
    ax.imshow(color, interpolation='bilinear')
    niveles = np.arange(2800, 5300, 100)
    ax.contour(zz, levels=[n for n in niveles if n % 500], colors=[(0.12, 0.25, 0.20, 0.30)], linewidths=0.6)
    ax.contour(zz, levels=[n for n in niveles if n % 500 == 0], colors=[(0.12, 0.25, 0.20, 0.55)], linewidths=1.3)
    ax.set_xlim(-0.5, W - 0.5); ax.set_ylim(H - 0.5, -0.5)
    tmp = os.path.join(RAIZ, 'models', '_relieve.png')
    fig.savefig(tmp, dpi=100); plt.close(fig)
    Image.open(tmp).convert('RGB').save(os.path.join(RAIZ, 'models', 'relieve.webp'), 'WEBP', quality=78, method=6)
    os.remove(tmp)

    open(os.path.join(RAIZ, 'models', 'relieve.bin'), 'wb').write(crudo)
    json.dump({
        'lon0': meta['lon0'], 'lat1': meta['lat1'], 'paso': meta['paso'], 'w': w, 'h': h,
        'min': int(z.min()), 'max': int(z.max()), 'formato': 'uint16 little-endian, metros, filas de norte a sur',
        'atribucion': ATRIBUCION, 'descargo': DESCARGO,
    }, open(os.path.join(RAIZ, 'models', 'relieve.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    t = os.path.getsize(os.path.join(RAIZ, 'models', 'relieve.webp')) / 1e3
    print(f'malla {w}×{h} ({z.min():.0f}–{z.max():.0f} m), imagen {W}×{H} ({t:.0f} KB)')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
