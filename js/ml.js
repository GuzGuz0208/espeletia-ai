// Reconocimiento por cámara, 100 % en el celular.
// MobileNetV2 (ONNX, ~9 MB) convierte cada imagen en una "huella" de 1280 números.
// El equipo enseña cada clase con fotos reales del páramo y se clasifica por vecinos más cercanos (k-NN).
import * as db from './db.js';

const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
const SIZE = 224;
const K = 7;

let ort, session;
let samples = []; // { clase, v: Float32Array }
const canvas = document.createElement('canvas');
canvas.width = canvas.height = SIZE;
const ctx = canvas.getContext('2d', { willReadFrequently: true });

export async function load(onStatus = () => {}) {
  if (session) return;
  onStatus('Cargando el modelo de la cámara…');
  ort = await import('../lib/ort.wasm.min.mjs');
  ort.env.wasm.wasmPaths = new URL('../lib/', import.meta.url).href;
  ort.env.wasm.numThreads = 1; // sin aislamiento entre orígenes; un hilo es suficiente para MobileNet
  session = await ort.InferenceSession.create(new URL('../models/mnv2_embed.onnx', import.meta.url).href, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  });
  await loadSamples();
  onStatus('');
}

export const ready = () => !!session;

async function loadSamples() {
  const rows = await db.all('muestras');
  samples = rows.map((r) => ({ clase: r.clase, v: new Float32Array(r.v) }));
}

// Recorta el centro de la imagen (como lo que ve el visitante en el visor) y la pasa a 224×224.
function toTensor(source) {
  const w = source.videoWidth || source.naturalWidth || source.width;
  const h = source.videoHeight || source.naturalHeight || source.height;
  const side = Math.min(w, h) * 0.8;
  ctx.drawImage(source, (w - side) / 2, (h - side) / 2, side, side, 0, 0, SIZE, SIZE);
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
  const plane = SIZE * SIZE;
  const f = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    f[i] = (data[i * 4] / 255 - MEAN[0]) / STD[0];
    f[plane + i] = (data[i * 4 + 1] / 255 - MEAN[1]) / STD[1];
    f[2 * plane + i] = (data[i * 4 + 2] / 255 - MEAN[2]) / STD[2];
  }
  return new ort.Tensor('float32', f, [1, 3, SIZE, SIZE]);
}

export async function embed(source) {
  const out = await session.run({ input: toTensor(source) });
  const v = out[session.outputNames[0]].data;
  let n = 0;
  for (let i = 0; i < v.length; i++) n += v[i] * v[i];
  n = Math.sqrt(n) || 1;
  const u = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) u[i] = v[i] / n;
  return u;
}

export async function addSample(clase, source) {
  const v = await embed(source);
  await db.put('muestras', undefined, { clase, v: Array.from(v) });
  samples.push({ clase, v });
  return counts();
}

export function counts() {
  const c = {};
  for (const s of samples) c[s.clase] = (c[s.clase] || 0) + 1;
  return c;
}

export async function clearSamples(clase) {
  if (!clase) { await db.clear('muestras'); samples = []; return counts(); }
  const keep = samples.filter((s) => s.clase !== clase);
  await db.clear('muestras');
  for (const s of keep) await db.put('muestras', undefined, { clase: s.clase, v: Array.from(s.v) });
  samples = keep;
  return counts();
}

// Devuelve { clase, confianza, similitud } o null si no hay entrenamiento.
// La confianza combina tres cosas:
//  1) qué parte de los vecinos más cercanos votan por la clase ganadora,
//  2) si hay suficientes ejemplos,
//  3) qué tan parecida es la imagen al ejemplo más cercano (piso de similitud).
// El punto 3 evita que, con una sola clase entrenada, todo parezca esa clase.
// Calibración con fotos reales: escenas distintas ≈ 0,34–0,56; misma escena ≈ 0,76–0,95.
export async function classify(source, { simMin = 0.5, simOk = 0.68 } = {}) {
  if (!samples.length) return null;
  const q = await embed(source);
  const scored = samples.map((s) => {
    let d = 0;
    for (let i = 0; i < q.length; i++) d += q[i] * s.v[i];
    return { clase: s.clase, sim: d };
  }).sort((a, b) => b.sim - a.sim).slice(0, K);
  const votes = {};
  let total = 0;
  for (const s of scored) {
    const w = Math.exp(s.sim * 10);
    votes[s.clase] = (votes[s.clase] || 0) + w;
    total += w;
  }
  const [clase, peso] = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  const mejor = scored.find((s) => s.clase === clase).sim;
  const cobertura = Math.min(1, scored.length / K);
  const parecido = Math.max(0, Math.min(1, (mejor - simMin) / (simOk - simMin)));
  return { clase, confianza: (peso / total) * cobertura * parecido, similitud: mejor, votos: peso / total };
}

// Exportar / importar el "modelo del parque" para pasarlo a todos los celulares dentro del Paquete Páramo.
export function exportModel() {
  return JSON.stringify({ tipo: 'paramo-knn', version: 1, dim: 1280, muestras: samples.map((s) => ({ c: s.clase, v: Array.from(s.v, (x) => +x.toFixed(4)) })) });
}

export async function importModel(text) {
  const data = JSON.parse(text);
  if (data.tipo !== 'paramo-knn') throw new Error('Este archivo no es un modelo de cromos del páramo.');
  await db.clear('muestras');
  for (const m of data.muestras) await db.put('muestras', undefined, { clase: m.c, v: m.v });
  await loadSamples();
  return counts();
}
