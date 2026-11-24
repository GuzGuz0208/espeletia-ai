"""Comprueba que el chat en el navegador (JS) da lo mismo que Python: embeddings y respuestas en los dos bancos de prueba."""
import json, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, '/home/claude/tools')
import numpy as np
import indice_chat as ic

ev1 = json.load(open('/home/claude/app/pruebas/preguntas_eval.json'))['preguntas']
ev2 = json.load(open('/home/claude/app/pruebas/preguntas_eval2.json'))['preguntas']

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True)
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
    print('\n'.join(set(logs)) or 'sin errores en consola')
    b.close()
