"""Mide la búsqueda con tema activo (la unión Lente → chat) y compara estrategias.

Uso, desde la raíz de la app:  python3 herramientas/tema_chat.py
- Banco de seguimiento: pruebas/preguntas_tema.json (preguntas cortas con un tema activo).
- Control: los bancos 1 y 2 de siempre, cada pregunta con un tema activo AJENO elegido al azar,
  para medir si el tema «arrastra» preguntas que no tienen que ver.
La lógica de la estrategia elegida está copiada en js/chat.js (preguntar con { tema }).
"""
import json, os, random, re, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import indice_chat as ic

APP = ic.APP
paq = json.load(open(APP + 'paquete.json'))
TEMA = {c['id']: c['tema'] for c in paq['cromos'] if c.get('tema')}
F = ic.F
ids = [f['id'] for f in F]
COMER = re.compile(r'\b(comestible|se come|se puede comer|comer(me|se|lo|la)?|venenos[oa]|t[oó]xic[oa]|probar|edible|poison|toxic|eat)\b', re.I)
URG = re.compile(r'\b(auxilio|socorro|emergencia|accidente|herid[oa]|desmay|me perd|perdid[oa]|no respira|ayuda urgente|help|emergency|injur|faint|unconscious|lost)\b', re.I)

ind = json.load(open(APP + 'models/chat_indice.json'))
P = ind['params']
items, V, Vq, Q, esc, docs, idf = ic.construir()
cache = {}
def emb(t):
    if t not in cache: cache[t] = ic.emb(['query: ' + t])[0]
    return cache[t]

ULT = {}
BETA = 0.02
def buscar(texto):
    """(ficha o None, responde, puntaje) con la misma lógica que js/chat.js, sin reglas de seguridad."""
    b, resp, score, sem, neg, orden = ic.puntuar(emb(texto), texto, items, Vq, docs, idf, P)
    ULT['sem'] = sem; ULT['abst'] = bool(resp and F[b].get('abstencion'))
    if resp and F[b].get('abstencion'): return None, False, float(score[b])
    return (ids[b] if resp else None), resp, float(score[b])

def seguridad(texto, fid):
    if URG.search(texto) and fid not in ('emergencia', 'mal_altura'): return 'emergencia'
    if COMER.search(texto) and fid != 'comer_plantas': return 'comer_plantas'
    return fid

EN = set('the is are do does can what where when how which who there this that with you i my it to of in on for at'.split())
ES = set('el la los las es son puedo puede que donde cuando como cual quien hay esto eso con usted yo mi de en para por un una se'.split())
def idioma(t):
    # Copia de idiomaDe() en js/chat.js
    w = re.findall(r'[a-záéíóúñü]+', t.lower())
    en = sum(x in EN for x in w); es = sum(x in ES for x in w)
    if re.search(r'[ñáéíóú¿¡]', t, re.I): es += 2
    return 'en' if en > es else 'es'

def responder(texto, tema, estrategia, delta=0.0, margen=0.05):
    f0, r0, s0 = buscar(texto)
    sem0 = ULT['sem']; abst0 = ULT['abst']
    if not tema or estrategia == 'sin':
        return seguridad(texto, f0)
    nombre = TEMA[tema][idioma(texto)]
    if estrategia == 'siempre':
        f1, r1, s1 = buscar(f'{texto} ({nombre})')
        return seguridad(texto, f1)
    if estrategia in ('mejor', 'mejor_pre'):
        q1 = f'{nombre}: {texto}' if estrategia == 'mejor_pre' else f'{texto} ({nombre})'
        f1, r1, s1 = buscar(q1)
        usa = r1 and (not r0 or s1 >= s0 + delta)
        return seguridad(texto, f1 if usa else f0)
    if estrategia == 'condicionada':
        # El tema solo ayuda a elegir entre fichas a las que la pregunta SOLA ya se parece:
        # si la pregunta sola está lejos de esa ficha (otro tema, o fuera del parque), se ignora el tema.
        f1, r1, s1 = buscar(f'{texto} ({nombre})')
        # margen = distancia máxima entre lo que la pregunta sola le da a esa ficha y a su mejor ficha
        if r1 and f1 and sem0[ids.index(f1)] >= sem0.max() - margen and (not r0 or s1 >= s0 + delta):
            return seguridad(texto, f1)
        return seguridad(texto, f0)
    if estrategia == 'ganancia':
        # 1) Si la pregunta sola ya cae en una ficha de «no sé» (servicios), se respeta.
        # 2) El tema se usa solo si la pregunta APORTA: la ficha elegida con tema debe parecerse más
        #    a «pregunta + tema» que al tema solo. Así «raíz cuadrada (la danta)» no responde «danta».
        if abst0: return seguridad(texto, None)
        f1, r1, s1 = buscar(f'{texto} ({nombre})')
        if not (r1 and f1): return seguridad(texto, f0)
        sem1 = ULT['sem']
        buscar(nombre); semT = ULT['sem']
        k = ids.index(f1)
        if sem1[k] - semT[k] >= margen and (not r0 or s1 >= s0 + delta):
            return seguridad(texto, f1)
        return seguridad(texto, f0)
    if estrategia == 'conocidas':
        # El tema solo se aplica a preguntas hechas con palabras que existen en las fichas: las de
        # seguimiento («¿cuánto vive?», «¿lo puedo tocar?») las usan; las de fuera del parque
        # («raíz cuadrada», «wifi», «película») traen palabras desconocidas. Y se respeta el «no sé» de servicios.
        if abst0: return seguridad(texto, None)
        toks = ic.lex_tokens(texto)
        desconocidas = [w for w in toks if w not in idf]
        if len(desconocidas) > margen: return seguridad(texto, f0)
        f1, r1, s1 = buscar(f'{texto} ({nombre})')
        if r1 and f1 and (not r0 or s1 >= s0 + delta): return seguridad(texto, f1)
        return seguridad(texto, f0)
    if estrategia == 'empuje':
        # Como «conocidas», pero además la ficha propia del tema recibe un pequeño empujón (beta):
        # «¿por qué está amenazado?» con el periquito activo debe ir a la ficha del periquito,
        # no a la del siete cueros, que tiene esa misma frase entre sus formas de preguntar.
        if abst0: return seguridad(texto, None)
        if any(w not in idf for w in ic.lex_tokens(texto)): return seguridad(texto, f0)
        q1 = f'{texto} ({nombre})'
        b, resp, score, sem, neg, orden = ic.puntuar(emb(q1), q1, items, Vq, docs, idf, P)
        k = ids.index(paq_ficha(tema)); sc = score.copy(); sc[k] += BETA
        b = int(np.argmax(sc))
        r1 = sem[b] >= P['T'] and score[b] - neg >= P['M'] and not F[b].get('abstencion')
        if r1 and (not r0 or score[b] >= s0 + delta): return seguridad(texto, ids[b])
        return seguridad(texto, f0)
    if estrategia == 'final':
        # La que va en la app (js/chat.js). Ver la explicación en el LEEME.
        if abst0: return seguridad(texto, None)
        q1 = f'{texto} ({nombre})'
        b, resp, score, sem, neg, orden = ic.puntuar(emb(q1), q1, items, Vq, docs, idf, P)
        r1 = bool(resp) and not F[b].get('abstencion')
        f1, s1 = ids[b], float(score[b])
        conocidas = all(w in idf for w in ic.lex_tokens(texto))
        if conocidas:
            if r1 and (not r0 or s1 >= s0 + delta): return seguridad(texto, f1)
            return seguridad(texto, f0)
        # Con palabras que no están en las fichas no se puede saber si es un seguimiento («¿de qué color es?»)
        # o algo de fuera («¿raíz cuadrada?»): si con el tema sale la ficha del tema, se PREGUNTA en vez de afirmar.
        tf = paq_ficha(tema)
        if r1 and f1 == tf and f0 != tf:
            seg = seguridad(texto, None)
            if seg: return seg
            # Si la pregunta sola tenía respuesta, se da esa y se ofrece el tema como «relacionado»;
            # si no tenía, se pregunta «¿te refieres a…?»
            return ('relacionado', [f0, tf]) if f0 else ('duda', [tf])
        return seguridad(texto, f0)
    raise ValueError(estrategia)

def ok(res, esp):
    if isinstance(res, tuple):
        if res[0] != 'relacionado': return False
        res = res[1][0]
    return res in esp if isinstance(esp, list) else res == esp
def un_toque(res, esp):
    if not isinstance(res, tuple): return False
    e = esp if isinstance(esp, list) else [esp]
    return any(x in res[1] for x in e)

def medir(estrategia, delta=0.0, ver=False, margen=0.05, banco='preguntas_tema.json'):
    tb = json.load(open(APP + 'pruebas/' + banco))['preguntas']
    seg = [p for p in tb if not p.get('propia')]; pro = [p for p in tb if p.get('propia')]
    rs = [responder(p['p'], p['tema'], estrategia, delta, margen) for p in seg]
    a = sum(ok(r, p['esperado']) for r, p in zip(rs, seg))
    a1 = sum(un_toque(r, p['esperado']) for r, p in zip(rs, seg))
    b = sum(ok(responder(p['p'], p['tema'], estrategia, delta, margen), p['esperado']) for p in pro)
    if ver:
        for p in tb:
            r = responder(p['p'], p['tema'], estrategia, delta, margen)
            if not ok(r, p['esperado']): print(f"   FALLA [{p['tema']}] {p['p']!r}: esperado {p['esperado']} -> {r}")
    # Control: bancos 1 y 2 con un tema ajeno al azar
    rnd = random.Random(7)
    ctrl = json.load(open(APP + 'pruebas/preguntas_eval.json'))['preguntas'] + json.load(open(APP + 'pruebas/preguntas_eval2.json'))['preguntas']
    temas = sorted(TEMA)
    c_sin = c_con = c_duda = c_chip = 0
    for p in ctrl:
        esp = p['esperado']
        t = rnd.choice([x for x in temas if paq_ficha(x) != esp])
        c_sin += ok(responder(p['p'], None, 'sin'), esp)
        r = responder(p['p'], t, estrategia, delta, margen)
        c_con += ok(r, esp); c_duda += isinstance(r, tuple) and r[0] == 'duda'; c_chip += isinstance(r, tuple) and r[0] == 'relacionado'
    return dict(seguimiento=f'{a}/{len(seg)}', seguimiento_un_toque=a1, propias=f'{b}/{len(pro)}', control_sin_tema=f'{c_sin}/{len(ctrl)}', control_con_tema_ajeno=f'{c_con}/{len(ctrl)}', control_pregunta_de_vuelta=c_duda, control_chip_extra=c_chip)

def paq_ficha(cid):
    return next(c['ficha'] for c in paq['cromos'] if c['id'] == cid)

if __name__ == '__main__':
    print('ESTRATEGIA FINAL (la de js/chat.js): delta = -0.04')
    for b in ('preguntas_tema.json', 'preguntas_tema2.json', 'preguntas_tema3.json'):
        print(b, 'sin tema:', medir('sin', banco=b))
        print(b, 'con tema:', medir('final', -0.04, margen=0, banco=b, ver=True), flush=True)
