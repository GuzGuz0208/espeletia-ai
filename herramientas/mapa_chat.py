"""Mide las preguntas sobre el recorrido propio (fichas dinámicas del chat) y que no se crucen con las de lugares.
Uso: python3 herramientas/mapa_chat.py   (banco: pruebas/preguntas_mapa.json, escrito antes de redactar las fichas)"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tema_chat as tc

banco = json.load(open(tc.APP + 'pruebas/preguntas_mapa.json'))['preguntas']
ok = {'propias': 0, 'confusas': 0}; n = {'propias': 0, 'confusas': 0}
for q in banco:
    r = tc.responder(q['p'], None, 'sin')
    k = 'confusas' if q.get('confusa') else 'propias'
    n[k] += 1
    bien = tc.ok(r, q['esperado'])
    ok[k] += bien
    if not bien: print(f"  FALLA [{k}] {q['p']!r}: esperado {q['esperado']} -> {r}")
print(f"sobre mi recorrido: {ok['propias']}/{n['propias']} | parecidas pero sobre un lugar: {ok['confusas']}/{n['confusas']}")
