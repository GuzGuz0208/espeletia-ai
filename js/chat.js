// Motor del chat "Pregúntale a Fray": búsqueda semántica sin internet sobre fichas oficiales.
// No genera texto: elige la ficha oficial más parecida a la pregunta, o dice "no lo sé".
// Modelo: multilingual-e5-small (MIT), cuantizado int8 y podado a vocabulario latino (~66 MB).
// La lógica es copia fiel de tools/indice_chat.py (donde se calibró). Si cambias una, cambia la otra.

import { sesion, anotar } from './motor.js';

let ort = null, ses = null, tok = null;
let base = null;      // chat.json
let idx = null;       // índice: items, vectores normalizados, idf, docs
let cargando = null;
let soloLexico = false;

const RAIZ = (u) => new URL(u, import.meta.url).href;

function decodificar(b64) {
  const bin = atob(b64); const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function cargar(onEstado = () => {}) {
  if (cargando) return cargando;
  cargando = (async () => {
    onEstado('fichas');
    const [b, i] = await Promise.all([fetch(RAIZ('../chat.json')).then((r) => r.json()), fetch(RAIZ('../models/chat_indice.json')).then((r) => r.json())]);
    base = b;
    const dim = i.dim, n = i.items.length;
    const q8 = new Int8Array(decodificar(i.vectores).buffer);
    const esc = new Float32Array(decodificar(i.escalas).buffer);
    const vec = new Float32Array(n * dim);
    for (let k = 0; k < n; k++) {
      let s = 0;
      for (let d = 0; d < dim; d++) { const v = q8[k * dim + d] * esc[k]; vec[k * dim + d] = v; s += v * v; }
      s = Math.sqrt(s) || 1;
      for (let d = 0; d < dim; d++) vec[k * dim + d] /= s;
    }
    idx = { dim, n, items: i.items, vec, idf: i.idf, docs: i.docs.map((d) => new Set(d)), stop: new Set(i.stop), P: i.params };
    onEstado('modelo');
    try {
      const { Tokenizer } = await import('../lib/tokenizers.min.js');
      const [tj, tc] = await Promise.all([fetch(RAIZ('../models/e5_tokenizer.json')).then((r) => r.json()), fetch(RAIZ('../models/e5_tokenizer_config.json')).then((r) => r.json())]);
      tok = new Tokenizer(tj, tc);
      ({ ort, s: ses } = await sesion('models/e5_small_latino.onnx'));
    } catch (e) {
      // Sin memoria suficiente o sin WASM: el chat sigue funcionando solo con palabras clave.
      anotar('Chat (modelo de lenguaje)', e);
      soloLexico = true;
    }
    onEstado('listo');
  })();
  return cargando;
}

export const listo = () => !!idx;
// Vuelve a intentar cargar el modelo de lenguaje (p. ej. desde Ajustes, si falló por red)
export async function reintentar() {
  if (cargando) await cargando.catch(() => {});
  if (idx && !soloLexico) return;
  cargando = null; soloLexico = false;
  return cargar();
}
export const modoLexico = () => soloLexico;
export const fichas = () => base?.fichas || [];
export const fuentes = () => base?.fuentes || {};

// ---------- Embedding de la pregunta ----------
export async function embed(texto) {
  const enc = tok.encode('query: ' + texto);
  let ids = enc.ids.slice(0, 128);
  const L = ids.length;
  const t = (arr) => new ort.Tensor('int64', BigInt64Array.from(arr.map((x) => BigInt(x))), [1, L]);
  const out = await ses.run({ input_ids: t(ids), attention_mask: t(new Array(L).fill(1)), token_type_ids: t(new Array(L).fill(0)) });
  const h = out.last_hidden_state.data; // [1, L, 384]
  const dim = 384, v = new Float32Array(dim);
  for (let p = 0; p < L; p++) for (let d = 0; d < dim; d++) v[d] += h[p * dim + d];
  let s = 0; for (let d = 0; d < dim; d++) { v[d] /= L; s += v[d] * v[d]; }
  s = Math.sqrt(s); for (let d = 0; d < dim; d++) v[d] /= s;
  return v;
}

// ---------- Léxico (igual que en Python) ----------
function normalizar(s) {
  return s.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '').match(/[a-z0-9]+/g) || [];
}
const SUF = ['aciones', 'acion', 'mente', 'ando', 'iendo', 'es', 's'];
function raiz(w) { for (const s of SUF) if (w.length > s.length + 3 && w.endsWith(s)) return w.slice(0, -s.length); return w; }
function lexTokens(s) { return normalizar(s).filter((w) => !idx.stop.has(w) && w.length > 2).map(raiz); }

// ¿La pregunta viene en inglés? (para responder en ese idioma aunque la app esté en español)
const EN = new Set('the is are do does can what where when how which who there this that with you i my it to of in on for at'.split(' '));
const ES = new Set('el la los las es son puedo puede que donde cuando como cual quien hay esto eso con usted yo mi de en para por un una se'.split(' '));
export function idiomaDe(texto) {
  const w = texto.toLowerCase().match(/[a-záéíóúñü]+/g) || [];
  let en = 0, es = 0;
  for (const x of w) { if (EN.has(x)) en++; if (ES.has(x)) es++; }
  if (/[ñáéíóú¿¡]/i.test(texto)) es += 2;
  return en > es ? 'en' : (es > en ? 'es' : null);
}

const COMER = /\b(comestible|se come|se puede comer|comer(me|se|lo|la)?|venenos[oa]|t[oó]xic[oa]|probar|edible|poison|toxic|eat)\b/i;
const URGENTE = /\b(auxilio|socorro|emergencia|accidente|herid[oa]|desmay|me perd|perdid[oa]|no respira|ayuda urgente|help|emergency|injur|faint|unconscious|lost)\b/i;

// ---------- Búsqueda ----------
// Devuelve { tipo: 'respuesta'|'duda'|'nose', ficha, alternativas[], urgente, puntajes }
export async function preguntar(texto) {
  await cargar();
  const F = base.fichas, P = idx.P, nF = F.length;
  const sem = new Float64Array(nF).fill(-1);
  let neg = -1;
  if (!soloLexico) {
    const q = await embed(texto);
    const { vec, dim, items } = idx;
    for (let k = 0; k < items.length; k++) {
      let s = 0; const o = k * dim;
      for (let d = 0; d < dim; d++) s += q[d] * vec[o + d];
      const [fi, t] = items[k];
      if (t === 'n') { if (s > neg) neg = s; continue; }
      const s2 = t === 'q' ? s : s - P.da;
      if (s2 > sem[fi]) sem[fi] = s2;
    }
  }
  const qt = [...new Set(lexTokens(texto))];
  const lex = new Float64Array(nF);
  if (qt.length) {
    const def = Math.log(1 + nF);
    const tot = qt.reduce((a, w) => a + (idx.idf[w] ?? def), 0);
    for (let i = 0; i < nF; i++) { let s = 0; for (const w of qt) if (idx.docs[i].has(w)) s += idx.idf[w] ?? 0; lex[i] = s / tot; }
  }
  const score = new Float64Array(nF);
  for (let i = 0; i < nF; i++) score[i] = soloLexico ? lex[i] : sem[i] + P.w * lex[i];
  const orden = [...score.keys()].sort((a, b) => score[b] - score[a]);
  const b = orden[0], b2 = orden[1];
  let responde = soloLexico ? lex[b] >= 0.5 : (sem[b] >= P.T && score[b] - neg >= P.M);
  const urgente = URGENTE.test(texto);
  const res = { urgente, puntajes: { sem: sem[b], neg, lex: lex[b], score: score[b] }, alternativas: [] };
  const fUrg = F.findIndex((f) => f.id === 'emergencia');
  if (urgente && F[b].id !== 'emergencia' && F[b].id !== 'mal_altura') {
    // Seguridad primero: ante palabras de emergencia, la ficha de emergencia siempre aparece.
    return { ...res, tipo: 'respuesta', ficha: F[fUrg], alternativas: [F[b]].filter((f) => f.id !== 'emergencia') };
  }
  if (COMER.test(texto) && F[b].id !== 'comer_plantas') {
    // Regla de la app: nunca decir si algo se come o es tóxico. Esa ficha va primero.
    const fc = F.find((f) => f.id === 'comer_plantas');
    return { ...res, tipo: 'respuesta', ficha: fc, alternativas: [F[b]] };
  }
  if (responde && F[b].abstencion) return { ...res, tipo: 'nose', ficha: F[b], alternativas: [] };
  if (responde) {
    const cerca = !soloLexico && score[b] - score[b2] < 0.012 && !F[b2].abstencion;
    return { ...res, tipo: 'respuesta', ficha: F[b], alternativas: cerca ? [F[b2]] : [] };
  }
  // No llega al umbral: si hay candidatas razonables, ofrecerlas como "¿Te refieres a…?"
  const candidatas = soloLexico ? orden.filter((i) => lex[i] >= 0.25).slice(0, 2) : orden.filter((i) => sem[i] >= P.T - 0.03 && score[i] - neg >= -0.01 && !F[i].abstencion).slice(0, 2);
  if (candidatas.length) return { ...res, tipo: 'duda', ficha: null, alternativas: candidatas.map((i) => F[i]) };
  return { ...res, tipo: 'nose', ficha: null, alternativas: [] };
}

export function sugerencias(lang) {
  const ids = ['que_llevar', 'mal_altura', 'cima', 'frailejon', 'volcan_estado', 'mascotas'];
  return ids.map((id) => base?.fichas.find((f) => f.id === id)).filter(Boolean).map((f) => ({ id: f.id, texto: lang === 'en' ? f.qen?.[0] : f.q[0] }));
}
export const fichaPorId = (id) => base?.fichas.find((f) => f.id === id);
