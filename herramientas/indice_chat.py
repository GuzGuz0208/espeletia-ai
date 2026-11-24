"""Construye el índice del chat (vectores precalculados) y calibra los umbrales.
Usa el MISMO modelo podado que va en la app. La lógica de búsqueda está duplicada en js/chat.js: si cambias una, cambia la otra."""
import json, re, unicodedata, base64, itertools, sys, math
import numpy as np, onnxruntime as ort
from tokenizers import Tokenizer

import os, hashlib
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
M = APP + 'models/'
tok = Tokenizer.from_file(M + 'e5_tokenizer.json'); tok.enable_truncation(128)

def modelo_bytes(ruta='models/e5_small_latino.onnx'):
    # El modelo va partido en trozos de 8 MB (ver herramientas/partir.py): se une en memoria
    m = json.load(open(M + 'partes.json'))[ruta]
    datos = b''.join(open(APP + p, 'rb').read() for p in m['partes'])
    assert hashlib.sha256(datos).hexdigest() == m['sha256'], 'partes dañadas'
    return datos

ses = ort.InferenceSession(modelo_bytes())

def emb(texts):
    out = []
    for t in texts:
        e = tok.encode(t); ids = np.array([e.ids], dtype=np.int64)
        h = ses.run(None, {'input_ids': ids, 'attention_mask': np.ones_like(ids), 'token_type_ids': np.zeros_like(ids)})[0][0]
        v = h.mean(0); out.append(v / np.linalg.norm(v))
    return np.array(out, dtype=np.float32)

# ---------- léxico (idéntico en JS) ----------
STOP = set("""a al algo algun alguna como con cual cuales cuando de del desde donde el ella ellas en entre era es esa ese eso esta este esto estoy hay la las le les lo los me mi mis muy no o para pero por porque puede puedo que se si sin sobre su sus te tengo tiene un una uno unos y ya yo tu usted ustedes nos hace hacer ser estar va voy vamos the a an is are do does i to of in on for at can my me it be how what which where when who there this that with from you we any""".split())
def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.findall(r'[a-z0-9]+', s)
def raiz(w):
    for suf in ('aciones', 'acion', 'mente', 'ando', 'iendo', 'es', 's'):
        if len(w) > len(suf) + 3 and w.endswith(suf): return w[:-len(suf)]
    return w
def lex_tokens(s): return [raiz(w) for w in norm(s) if w not in STOP and len(w) > 2]

chat = json.load(open(APP + 'chat.json'))
F = chat['fichas']

def construir():
    items, textos = [], []
    for i, f in enumerate(F):
        for q in f['q'] + f.get('qen', []): items.append((i, 'q')); textos.append('query: ' + q)
        for k in ('es', 'en'): items.append((i, 'a')); textos.append('passage: ' + f[k])
    for q in chat['fuera']: items.append((-1, 'n')); textos.append('query: ' + q)
    V = emb(textos)
    # cuantización int8 por vector (lo que se guarda para la app)
    esc = np.abs(V).max(1, keepdims=True) / 127.0
    Q = np.round(V / esc).astype(np.int8)
    Vq = Q.astype(np.float32) * esc
    Vq /= np.linalg.norm(Vq, axis=1, keepdims=True)
    # léxico: documento por ficha
    docs = [lex_tokens(' '.join(f['q'] + f.get('qen', []) + [f['es'], f['en']])) for f in F]
    df = {}
    for d in docs:
        for w in set(d): df[w] = df.get(w, 0) + 1
    idf = {w: math.log(1 + len(F) / c) for w, c in df.items()}
    return items, V, Vq, Q, esc, docs, idf

def puntuar(qv, qtext, items, V, docs, idf, P):
    sims = V @ qv
    sem = np.full(len(F), -1.0)
    neg = -1.0
    for (fi, t), s in zip(items, sims):
        if t == 'n': neg = max(neg, s); continue
        s2 = s if t == 'q' else s - P['da']
        if s2 > sem[fi]: sem[fi] = s2
    qt = set(lex_tokens(qtext))
    lex = np.zeros(len(F))
    if qt:
        tot = sum(idf.get(w, math.log(1 + len(F))) for w in qt)
        for i, d in enumerate(docs):
            ds = set(d); lex[i] = sum(idf.get(w, 0) for w in qt if w in ds) / tot
    score = sem + P['w'] * lex
    orden = np.argsort(-score)
    b = orden[0]
    responde = sem[b] >= P['T'] and (score[b] - neg) >= P['M']
    return b, responde, score, sem, neg, orden

def evaluar(preguntas, idx, P, ver=False):
    items, V, docs, idf, QV = idx
    r = dict(ok=0, mal=0, calla_in=0, calla_ok=0, habla_out=0, n_in=0, n_out=0)
    fallos = []
    for (pq, qv) in zip(preguntas, QV):
        b, resp, score, sem, neg, orden = puntuar(qv, pq['p'], items, V, docs, idf, P)
        if resp and F[b].get('abstencion'): resp = False
        esp = pq['esperado']
        if esp is None:
            r['n_out'] += 1
            if resp: r['habla_out'] += 1; fallos.append(('HABLA', pq['p'], F[b]['id'], round(float(sem[b]), 3), round(float(neg), 3)))
            else: r['calla_ok'] += 1
        else:
            r['n_in'] += 1
            if not resp: r['calla_in'] += 1; fallos.append(('CALLA', pq['p'], esp, F[b]['id'], round(float(sem[b]), 3), round(float(neg), 3)))
            elif F[b]['id'] == esp: r['ok'] += 1
            else: r['mal'] += 1; fallos.append(('MAL', pq['p'], esp, '->', F[b]['id'], round(float(sem[b]), 3)))
    return r, fallos

if __name__ == '__main__':
    items, V, Vq, Q, esc, docs, idf = construir()
    ev = json.load(open(APP + 'pruebas/preguntas_eval.json'))['preguntas']
    QV = emb(['query: ' + p['p'] for p in ev])
    dev = [p for i, p in enumerate(ev) if i % 2 == 1]; test = [p for i, p in enumerate(ev) if i % 2 == 0]
    QVd = np.array([q for i, q in enumerate(QV) if i % 2 == 1]); QVt = np.array([q for i, q in enumerate(QV) if i % 2 == 0])
    mejor = None
    if '--fijos' in sys.argv:
        # Mantener los umbrales ya calibrados (p. ej. al agregar fichas) y solo reconstruir el índice
        P = json.load(open(APP + 'models/chat_indice.json'))['params']
        mejor = (None, P, evaluar(dev, (items, Vq, docs, idf, QVd), P)[0])
    for T, Mg, w, da in ([] if mejor else  itertools.product(np.arange(0.80, 0.905, 0.005), [0.0, 0.01, 0.02, 0.03, 0.04], [0, 0.05, 0.1, 0.15, 0.2], [0.0, 0.02, 0.04])):
        P = dict(T=float(T), M=Mg, w=w, da=da)
        r, _ = evaluar(dev, (items, Vq, docs, idf, QVd), P)
        obj = r['ok'] + r['calla_ok'] - 3 * (r['mal'] + r['habla_out']) - 0.5 * r['calla_in']
        if mejor is None or obj > mejor[0]: mejor = (obj, P, r)
    print('mejor en calibración:', mejor)
    P = mejor[1]
    for nombre, conj, qv in (('PRUEBA (no vista al calibrar)', test, QVt), ('TODAS', ev, QV)):
        r, f = evaluar(conj, (items, Vq, docs, idf, qv), P)
        print(f"\n{nombre}: dentro {r['n_in']}: correctas {r['ok']}, equivocadas {r['mal']}, 'no sé' {r['calla_in']} | fuera {r['n_out']}: 'no sé' correcto {r['calla_ok']}, respondió {r['habla_out']}")
        if nombre == 'TODAS':
            for x in f: print('  ', x)
            # ¿La correcta queda entre las 2 primeras cuando duda o se equivoca? (justifica "¿Te refieres a...?")
            top2 = 0; casos = 0
            for pq, q in zip(conj, qv):
                if pq['esperado'] is None: continue
                b, resp, score, sem, neg, orden = puntuar(q, pq['p'], items, Vq, docs, idf, P)
                if resp and not F[b].get('abstencion') and F[b]['id'] == pq['esperado']: continue
                casos += 1
                if pq['esperado'] in [F[i]['id'] for i in orden[:2]]: top2 += 1
            print(f'   de {casos} dudas o errores, en {top2} la ficha correcta estaba entre las 2 primeras')
    # Guardar índice para la app
    salida = {
        'version': chat['version'], 'dim': int(V.shape[1]), 'params': P,
        'items': [[int(fi), t] for fi, t in items],
        'escalas': base64.b64encode(esc.astype(np.float32).tobytes()).decode(),
        'vectores': base64.b64encode(Q.tobytes()).decode(),
        'idf': idf, 'docs': docs, 'stop': sorted(STOP),
    }
    json.dump(salida, open(APP + 'models/chat_indice.json', 'w'), separators=(',', ':'), ensure_ascii=False)
    print('\níndice:', len(items), 'vectores ->', APP + 'models/chat_indice.json')
