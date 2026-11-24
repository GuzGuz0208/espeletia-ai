// Motor de IA compartido por la Lente (visión) y el chat (lenguaje).
// El trabajo pesado corre en un Web Worker (js/motor-worker.js) para que la pantalla no se congele:
// cargar los modelos tarda segundos en un celular y reconocer con la cámara se repite cada ~0,7 s.
// Aquí solo se mandan pedidos y se reciben respuestas.
// - Los archivos grandes vienen partidos en trozos de 8 MB (models/partes.json) para que cualquier
//   hosting los acepte; el service worker los guarda unidos (ver sw.js).
// - Las librerías usan extensión .js (no .mjs) porque algunos servidores sirven .mjs con un tipo MIME
//   que el navegador rechaza para módulos.
// - Cada fallo queda anotado con su causa en `errores`, y los tiempos de carga en `tiempos`;
//   ambos se ven en Ajustes.
export const errores = [];
export const tiempos = {}; // { vision: { total, sesion, leer, origen, … }, texto: { … } }
let w = null, n = 0;
const pend = new Map();
const cargas = {};

export function anotar(donde, e) {
  const m = `${donde}: ${e?.message || e}`;
  errores.push(m);
  console.error('[motor]', m, e);
  return m;
}

function worker() {
  if (w) return w;
  w = new Worker(new URL('./motor-worker.js', import.meta.url), { type: 'module', name: 'motor-ia' });
  w.onmessage = (e) => {
    const { id, res, error } = e.data;
    const p = pend.get(id); if (!p) return;
    pend.delete(id);
    if (error) p.no(new Error(error)); else p.si(res);
  };
  w.onerror = (e) => {
    // El worker no arrancó (navegador muy viejo o archivo que falta): se avisa a todos los pedidos
    const err = new Error(`el motor de IA no pudo arrancar (${e.message || 'worker'})`);
    for (const p of pend.values()) p.no(err);
    pend.clear(); w = null;
    for (const k of Object.keys(cargas)) delete cargas[k];
  };
  return w;
}

function pedir(msg, transfer = []) {
  return new Promise((si, no) => {
    const id = ++n;
    pend.set(id, { si, no });
    try { worker().postMessage({ ...msg, id }, transfer); } catch (e) { pend.delete(id); no(e); }
  });
}

// Carga un modelo ('vision' o 'texto') en el worker. Se puede llamar varias veces: carga una sola.
export function cargarModelo(modelo) {
  cargas[modelo] ??= (async () => {
    const t0 = performance.now();
    const t = await pedir({ tipo: 'cargar', modelo, sw: !!navigator.serviceWorker?.controller });
    tiempos[modelo] = { ...(t?.ya ? {} : t), espera: Math.round(performance.now() - t0) };
  })();
  cargas[modelo].catch(() => delete cargas[modelo]);
  return cargas[modelo];
}

// Huella de una imagen ya preparada (Float32Array 3×224×224). El arreglo se transfiere al worker.
export const embedImagen = (datos) => pedir({ tipo: 'vision', datos }, [datos.buffer]);
// Huella de un texto para el chat (con el prefijo «query: » de e5).
export const embedTexto = (texto) => pedir({ tipo: 'texto', texto });
