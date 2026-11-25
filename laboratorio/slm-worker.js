// Worker del laboratorio: el modelo corre aquí, fuera del hilo de la pantalla, para que el teléfono no se congele.
// Mensajes: {tipo:'cargar', modelo, device, dtype} → 'progreso' | 'listo' | 'error'
//           {tipo:'generar', id, mensajes, max} → 'trozo' (cada palabra) | 'respuesta' | 'error'
import { pipeline, TextStreamer, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2';
env.allowLocalModels = false;

let gen = null;

self.onmessage = async ({ data: d }) => {
  if (d.tipo === 'cargar') {
    try {
      const t0 = performance.now();
      gen = await pipeline('text-generation', d.modelo, {
        device: d.device, dtype: d.dtype,
        progress_callback: (p) => { if (p.status === 'progress' && p.total) self.postMessage({ tipo: 'progreso', archivo: p.file, cargado: p.loaded, total: p.total }); },
      });
      self.postMessage({ tipo: 'listo', segundos: (performance.now() - t0) / 1000 });
    } catch (e) { self.postMessage({ tipo: 'error', fase: 'carga', detalle: e.message }); }
  }
  if (d.tipo === 'generar') {
    try {
      const t0 = performance.now();
      let primera = null, n = 0;
      const streamer = new TextStreamer(gen.tokenizer, {
        skip_prompt: true, skip_special_tokens: true,
        callback_function: (txt) => { n++; if (primera === null) primera = performance.now() - t0; self.postMessage({ tipo: 'trozo', id: d.id, txt }); },
      });
      const out = await gen(d.mensajes, { max_new_tokens: d.max || 60, do_sample: false, streamer });
      self.postMessage({ tipo: 'respuesta', id: d.id, texto: out[0].generated_text.at(-1).content.trim(), primera: primera === null ? null : primera / 1000, total: (performance.now() - t0) / 1000, trozos: n });
    } catch (e) { self.postMessage({ tipo: 'error', fase: 'generar', id: d.id, detalle: e.message }); }
  }
};
