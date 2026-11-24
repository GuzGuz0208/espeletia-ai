"""Corre los bancos de prueba del chat con la misma lógica que la app y aplica la puerta de seguridad.

Uso:  python herramientas/evaluar.py [--json]   (con --json guarda los resultados en evals.json, en la raíz del repo)

Usa herramientas/tema_chat.py (copia fiel de js/chat.js: búsqueda, tema activo y reglas de seguridad) con el modelo podado
y el índice de models/chat_indice.json. No escribe nada en el repositorio.

Bancos (pruebas/):
- preguntas_eval.json (banco 1) y preguntas_eval2.json (banco 2, prueba ciega): sin tema.
- preguntas_mapa.json: preguntas sobre el recorrido propio (fichas dinámicas).
- preguntas_tema*.json: seguimiento con tema activo (estrategia final de la app).
- preguntas_seguridad.json (si existe; lo escribe R1): banco adversarial del carril crítico.

PUERTA DE SEGURIDAD: toda pregunta cuyo esperado sea UNA ficha del carril crítico (emergencia, mal_altura,
comer_plantas, volcan_estado), de cualquier banco, debe acertarse. Si no, sale con código 1. Las preguntas cuyo esperado
es una lista que incluye una ficha crítica se informan como aviso.
"""
import os, subprocess, sys

# Los scripts de herramientas/ abren archivos sin encoding: en Windows hay que forzar UTF-8.
if not sys.flags.utf8_mode:
    # Solo se reenvían opciones conocidas, nunca texto libre de la línea de comandos.
    sys.exit(subprocess.call([sys.executable, '-X', 'utf8', os.path.abspath(__file__)] + (['--json'] if '--json' in sys.argv[1:] else [])))

import argparse, glob, json, time

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
CRITICAS = {'emergencia', 'mal_altura', 'comer_plantas', 'volcan_estado'}
DELTA_TEMA, MARGEN_TEMA = -0.04, 0  # los de js/chat.js (estrategia «final»)


def cargar(ruta):
    with open(ruta, encoding='utf-8') as f:
        return json.load(f)['preguntas']


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--json', action='store_true', help='guardar los resultados en evals.json (raíz del repo)')
    a = ap.parse_args()

    t0 = time.time()
    import tema_chat as tc  # carga el modelo y construye el índice en memoria (unos segundos)
    print(f'Modelo e índice cargados en {time.time() - t0:.1f} s\n')
    P = os.path.join(tc.APP, 'pruebas')

    def responder(q):
        if q.get('tema'):
            return tc.responder(q['p'], q['tema'], 'final', DELTA_TEMA, MARGEN_TEMA)
        return tc.responder(q['p'], None, 'sin')

    res = {'bancos': {}, 'seguridad': {}}
    filas = []

    # Bancos sin tema: dentro (tiene ficha) y fuera (debe decir «no sé»)
    for nombre, archivo in (('banco 1', 'preguntas_eval.json'), ('banco 2 (ciego)', 'preguntas_eval2.json')):
        qs = cargar(os.path.join(P, archivo))
        dentro = [q for q in qs if q['esperado'] is not None]
        fuera = [q for q in qs if q['esperado'] is None]
        ok_d = sum(tc.ok(responder(q), q['esperado']) for q in dentro)
        ok_f = sum(responder(q) is None for q in fuera)
        res['bancos'][nombre] = {'con_respuesta': [ok_d, len(dentro)], 'no_se_correcto': [ok_f, len(fuera)]}
        filas.append((nombre, f'{ok_d}/{len(dentro)} correctas', f'{ok_f}/{len(fuera)} «no sé» correctos'))

    # Recorrido propio
    qs = cargar(os.path.join(P, 'preguntas_mapa.json'))
    prop = [q for q in qs if not q.get('confusa')]
    conf = [q for q in qs if q.get('confusa')]
    a1 = sum(tc.ok(responder(q), q['esperado']) for q in prop)
    a2 = sum(tc.ok(responder(q), q['esperado']) for q in conf)
    res['bancos']['mapa'] = {'recorrido': [a1, len(prop)], 'parecidas_sobre_lugar': [a2, len(conf)]}
    filas.append(('mapa', f'{a1}/{len(prop)} sobre mi recorrido', f'{a2}/{len(conf)} parecidas sobre un lugar'))

    # Seguimiento con tema
    for archivo in sorted(glob.glob(os.path.join(P, 'preguntas_tema*.json'))):
        nombre = os.path.basename(archivo)[len('preguntas_'):-5]
        qs = cargar(archivo)
        seg = [q for q in qs if not q.get('propia')]
        pro = [q for q in qs if q.get('propia')]
        rs = [responder(q) for q in seg]
        b1 = sum(tc.ok(r, q['esperado']) for r, q in zip(rs, seg))
        b2 = sum(tc.un_toque(r, q['esperado']) for r, q in zip(rs, seg))
        b3 = sum(tc.ok(responder(q), q['esperado']) for q in pro)
        res['bancos'][nombre] = {'seguimiento': [b1, len(seg)], 'a_un_toque': b2, 'con_tema_propio': [b3, len(pro)]}
        filas.append((nombre, f'{b1}/{len(seg)} seguimiento (+{b2} a un toque)', f'{b3}/{len(pro)} con tema propio'))

    # Puerta de seguridad
    gate, avisos, fallos = [], [], []
    for archivo in sorted(glob.glob(os.path.join(P, 'preguntas_*.json'))):
        for q in cargar(archivo):
            e = q['esperado']
            if isinstance(e, str) and e in CRITICAS:
                gate.append(q)
                r = responder(q)
                if not tc.ok(r, e):
                    fallos.append((os.path.basename(archivo), q['p'], q.get('tema'), e, r))
            elif isinstance(e, list) and CRITICAS & set(e):
                r = responder(q)
                if not tc.ok(r, e):
                    avisos.append((os.path.basename(archivo), q['p'], q.get('tema'), e, r))
    adv = os.path.exists(os.path.join(P, 'preguntas_seguridad.json'))
    res['seguridad'] = {'aciertos': len(gate) - len(fallos), 'total': len(gate), 'banco_adversarial': adv,
                        'fallos': fallos, 'avisos': avisos}

    ancho = max(len(f[0]) for f in filas)
    for n, x, y in filas:
        print(f'  {n:<{ancho}}  {x:<36} {y}')
    print(f"\nPUERTA DE SEGURIDAD: {len(gate) - len(fallos)}/{len(gate)} preguntas del carril crítico"
          f"{'' if adv else '  (falta pruebas/preguntas_seguridad.json, el banco adversarial de R1)'}")
    for b, p, t, e, r in fallos:
        print(f'  FALLA  [{b}] {p!r}{f" (tema {t})" if t else ""}: esperado {e} → {r}')
    for b, p, t, e, r in avisos:
        print(f'  aviso  [{b}] {p!r}{f" (tema {t})" if t else ""}: esperado uno de {e} → {r}')

    if a.json:
        salida = os.path.join(tc.APP, 'evals.json')
        with open(salida, 'w', encoding='utf-8') as f:
            json.dump(res, f, ensure_ascii=False, indent=1)
        print(f'\nResultados en {salida}')
    if fallos:
        print('\nLa puerta de seguridad NO pasa: arregla la causa (formas de preguntar o reglas), no el banco ni los umbrales.')
        sys.exit(1)
    print('\nPuerta de seguridad: OK')


if __name__ == '__main__':
    main()
