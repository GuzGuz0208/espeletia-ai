// Motor de IA compartido por la Lente (visión) y el chat (lenguaje).
// - Carga ONNX Runtime Web una sola vez.
// - Los archivos grandes vienen partidos en trozos de 8 MB (models/partes.json) para que cualquier
//   hosting los acepte (Netlify Drop, GitHub, GitHub Pages) y se vuelven a unir aquí, verificando el tamaño.
// - Las librerías usan extensión .js (no .mjs) porque algunos servidores sirven .mjs con un tipo MIME
//   que el navegador rechaza para módulos.
// - Cada fallo queda anotado con su causa en `errores` y se muestra en Ajustes → Diagnóstico.
const R = (u) => new URL(u, import.meta.url).href;
export const errores = [];
let ortP = null, manP = null;
const binarios = new Map();

export function anotar(donde, e) {
  const m = `${donde}: ${e?.message || e}`;
  errores.push(m);
  console.error('[motor]', m, e);
  return m;
}

const manifiesto = () => (manP ??= fetch(R('../models/partes.json')).then((r) => (r.ok ? r.json() : {})).catch(() => ({})));

async function traer(ruta) {
  let r;
  try { r = await fetch(R('../' + ruta)); } catch (e) { throw new Error(`no se pudo descargar ${ruta} (${e.message})`); }
  if (!r.ok) throw new Error(`${ruta} respondió ${r.status}: falta en el servidor`);
  return new Uint8Array(await r.arrayBuffer());
}

// Devuelve el archivo completo como Uint8Array (unido desde sus partes si está partido)
export function binario(ruta, onP = () => {}) {
  if (binarios.has(ruta)) return binarios.get(ruta);
  const p = (async () => {
    const m = (await manifiesto())[ruta];
    if (!m) return traer(ruta);
    const out = new Uint8Array(m.bytes);
    let o = 0;
    for (let i = 0; i < m.partes.length; i++) {
      const b = await traer(m.partes[i]);
      if (o + b.length > m.bytes) throw new Error(`${m.partes[i]} no coincide con el original`);
      out.set(b, o); o += b.length;
      onP((i + 1) / m.partes.length);
    }
    if (o !== m.bytes) throw new Error(`${ruta} quedó incompleto (${o} de ${m.bytes} bytes)`);
    if (m.sha256 && crypto.subtle) {
      const h = [...new Uint8Array(await crypto.subtle.digest('SHA-256', out))].map((x) => x.toString(16).padStart(2, '0')).join('');
      if (h !== m.sha256) throw new Error(`${ruta} llegó dañado (la huella SHA-256 no coincide)`);
    }
    return out;
  })();
  binarios.set(ruta, p);
  p.catch(() => binarios.delete(ruta));
  return p;
}

export function cargarOrt() {
  ortP ??= (async () => {
    if (typeof WebAssembly !== 'object') throw new Error('este navegador no soporta WebAssembly');
    const ort = await import('../lib/ort.wasm.min.js');
    ort.env.wasm.numThreads = 1; // sin aislamiento entre orígenes
    ort.env.wasm.wasmPaths = { mjs: R('../lib/ort-wasm-simd-threaded.js') };
    ort.env.wasm.wasmBinary = await binario('lib/ort-wasm-simd-threaded.wasm');
    return ort;
  })();
  ortP.catch(() => (ortP = null));
  return ortP;
}

// Crea una sesión de inferencia a partir de un modelo (ruta relativa a la raíz de la app)
export async function sesion(ruta, onP) {
  const ort = await cargarOrt();
  const bytes = await binario(ruta, onP);
  const s = await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
  binarios.delete(ruta); // liberar la copia: la sesión ya tiene el modelo
  return { ort, s };
}
