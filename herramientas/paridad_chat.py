"""Comprueba que el chat en el navegador (JS) da lo mismo que Python: embeddings y respuestas en los dos bancos de prueba."""
import json, sys, os
from playwright.sync_api import sync_playwright
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(APP, 'herramientas'))
import numpy as np
import indice_chat as ic

ev1 = json.load(open(os.path.join(APP, 'pruebas', 'preguntas_eval.json')))['preguntas']
ev2 = json.load(open(os.path.join(APP, 'pruebas', 'preguntas_eval2.json')))['preguntas']

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page()
    logs = []
    pg.on('console', lambda m: logs.append(m.text) if m.type in ('error', 'warning') else None)
    pg.goto('http://localhost:8765/_vacio.html')
    pg.evaluate("async () => { window.chat = await import('/js/chat.js'); await window.chat.cargar(); }")
    print('modo solo léxico:', pg.evaluate('window.chat.modoLexico()'))
    # 1) Embeddings idénticos a Python
    textos = ['me duele la cabeza', 'can I bring my dog', 'qué es un frailejón peludo', 'hay wifi']
    js = pg.evaluate("async (ts) => { const out=[]; for (const t of ts) out.push(Array.from(await window.chat.embed(t))); return out; }", textos)
    py = ic.emb(['query: ' + t for t in textos])
    print('diferencia máxima de embeddings JS vs Python:', float(np.abs(np.array(js) - py).max()))
    # 2) Tiempo por pregunta
    t = pg.evaluate("async () => { const t0=performance.now(); for (let i=0;i<10;i++) await window.chat.preguntar('qué debo llevar para la caminata'); return (performance.now()-t0)/10; }")
    print(f'tiempo por pregunta en el navegador: {t:.0f} ms')
    # 3) Bancos de evaluación
    for nombre, ev in (('banco 1 (calibración + prueba)', ev1), ('banco 2 (nuevo, nunca usado para ajustar)', ev2)):
        res = pg.evaluate("async (qs) => { const out=[]; for (const q of qs) { const r = await window.chat.preguntar(q.p); out.push({tipo:r.tipo, id:r.ficha?r.ficha.id:null, alt:r.alternativas.map(a=>a.id)}); } return out; }", ev)
        ok = mal = nose_in = duda_ok = duda_mal = 0; out_ok = out_mal = 0; n_in = n_out = 0; errores = []
        for q, r in zip(ev, res):
            if q['esperado'] is None:
                n_out += 1
                if r['tipo'] == 'respuesta': out_mal += 1; errores.append(('RESPONDIÓ', q['p'], r['id']))
                else: out_ok += 1
            else:
                n_in += 1
                if r['tipo'] == 'respuesta' and r['id'] == q['esperado']: ok += 1
                elif r['tipo'] == 'respuesta': mal += 1; errores.append(('EQUIVOCADA', q['p'], q['esperado'], '->', r['id'], 'alt', r['alt']))
                elif r['tipo'] == 'duda':
                    if q['esperado'] in r['alt']: duda_ok += 1
                    else: duda_mal += 1; errores.append(('DUDA SIN LA CORRECTA', q['p'], q['esperado'], r['alt']))
                else: nose_in += 1; errores.append(('NO SÉ', q['p'], q['esperado']))
        print(f"\n{nombre}\n  con respuesta oficial ({n_in}): correctas {ok}, equivocadas {mal}, '¿te refieres a…?' con la correcta {duda_ok}, duda sin la correcta {duda_mal}, 'no sé' {nose_in}")
        print(f"  sin respuesta oficial ({n_out}): dijo 'no sé' {out_ok}, respondió algo {out_mal}")
        for e in errores: print('   ', e)
    # 4) Con tema activo: el navegador debe elegir igual que la estrategia medida en Python (tema_chat.py)
    sys.path.insert(0, os.path.join(APP, 'herramientas'))
    import tema_chat as tc
    temas = {c['id']: {'ficha': c['ficha'], **c['tema']} for c in json.load(open(os.path.join(APP, 'paquete.json')))['cromos'] if c.get('tema')}
    for banco in ('preguntas_tema.json', 'preguntas_tema2.json', 'preguntas_tema3.json'):
        qs = json.load(open(os.path.join(APP, 'pruebas', banco)))['preguntas']
        res = pg.evaluate("async ([qs, temas]) => { const out=[]; for (const q of qs) { const r = await window.chat.preguntar(q.p, { tema: temas[q.tema] }); out.push({tipo:r.tipo, id:r.ficha?r.ficha.id:null, alt:r.alternativas.map(a=>a.id), sug:r.sugiereTema?r.sugiereTema.id:null}); } return out; }", [qs, temas])
        dif = 0; directas = toque = 0
        for q, r in zip(qs, res):
            py = tc.responder(q['p'], q['tema'], 'final', -0.04, 0)
            if isinstance(py, tuple) and py[0] == 'duda': jsr = ('duda', r['alt']) if r['tipo'] == 'duda' else r['id']
            elif isinstance(py, tuple): jsr = ('relacionado', [r['id'], r['sug']]) if r['sug'] else r['id']
            else: jsr = r['id'] if r['tipo'] == 'respuesta' else None
            if jsr != py: dif += 1; print('   distinto:', q['p'], 'py', py, 'js', r)
            if q.get('propia'): continue
            e = q['esperado'] if isinstance(q['esperado'], list) else [q['esperado']]
            if r['tipo'] == 'respuesta' and r['id'] in e: directas += 1
            elif any(x in r['alt'] for x in e): toque += 1
        n = sum(1 for q in qs if not q.get('propia'))
        print(f"\ntema {banco}: navegador = Python en {len(qs) - dif}/{len(qs)}; seguimiento: {directas}/{n} directas, {toque} más a un toque")
    # 5) Preguntas sobre el recorrido (fichas dinámicas) y parecidas sobre un lugar
    qs = json.load(open(os.path.join(APP, 'pruebas', 'preguntas_mapa.json')))['preguntas']
    res = pg.evaluate("async (qs) => { const out=[]; for (const q of qs) { const r = await window.chat.preguntar(q.p); out.push(r.tipo === 'respuesta' ? r.ficha.id : null); } return out; }", qs)
    dif = sum(1 for q, r in zip(qs, res) if (lambda py: (py if isinstance(py, str) else None))(tc.responder(q['p'], None, 'sin')) != r)
    bien = sum(1 for q, r in zip(qs, res) if r in (q['esperado'] if isinstance(q['esperado'], list) else [q['esperado']]))
    print(f"\nmapa preguntas_mapa.json: navegador = Python en {len(qs) - dif}/{len(qs)}; correctas en el navegador {bien}/{len(qs)}")
    print('\n'.join(set(logs)) or 'sin errores en consola')
    b.close()
