// Estado de la colección y reglas del álbum. Todo se guarda en el celular (IndexedDB).
import * as db from './db.js';
import { distancia } from './util.js';

export const bus = new EventTarget();
const emitir = (tipo, detalle) => bus.dispatchEvent(new CustomEvent(tipo, { detail: detalle }));

export const E = {
  paquete: null,
  lang: 'es',
  nombre: '',
  album: {},      // id -> { fecha, estacion, altura, foto, abierto }
  visitadas: {},  // estacionId -> fecha
  fijadas: {},    // estacionId -> { lat, lon, altura } fijadas en campo por el equipo
  ajustes: { tema: 'auto', voz: true, vibrar: true, demo: false },
  posicion: null, // { lat, lon, precision, altitud }
  portadaVista: false,
};

export async function cargar() {
  const res = await fetch('paquete.json');
  E.paquete = await res.json();
  const [album, visitadas, fijadas, ajustes, nombre, lang, portada] = await Promise.all(
    ['album', 'visitadas', 'fijadas', 'ajustes', 'nombre', 'lang', 'portada'].map((k) => db.get('kv', k))
  );
  E.album = album || {};
  // Limpia registros de cromos que ya no existen en el paquete
  for (const id of Object.keys(E.album)) if (!cromo(id)) delete E.album[id];
  E.visitadas = visitadas || {};
  E.fijadas = fijadas || {};
  E.ajustes = { ...E.ajustes, ...(ajustes || {}) };
  if (new URLSearchParams(location.search).has('demo')) E.ajustes.demo = true;
  E.nombre = nombre || '';
  E.lang = lang || ((navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es');
  E.portadaVista = !!portada;
  localStorage.setItem('voz', E.ajustes.voz ? '1' : '0');
  localStorage.setItem('vibrar', E.ajustes.vibrar ? '1' : '0');
}

export async function guardar() {
  await Promise.all([
    db.put('kv', 'album', E.album), db.put('kv', 'visitadas', E.visitadas), db.put('kv', 'fijadas', E.fijadas),
    db.put('kv', 'ajustes', E.ajustes), db.put('kv', 'nombre', E.nombre), db.put('kv', 'lang', E.lang),
    db.put('kv', 'portada', E.portadaVista),
  ]);
  localStorage.setItem('voz', E.ajustes.voz ? '1' : '0');
  localStorage.setItem('vibrar', E.ajustes.vibrar ? '1' : '0');
}

// ---------- Consultas ----------
export const cromos = () => E.paquete.cromos;
export const cromo = (id) => E.paquete.cromos.find((c) => c.id === id);
export const capitulos = () => E.paquete.capitulos;
export const cromosDe = (cap) => E.paquete.cromos.filter((c) => c.capitulo === cap);
export const texto = (c) => c[E.lang] || c.es;
export const nombreClase = (id) => { const k = E.paquete.clases.find((c) => c.id === id); return k ? (k[E.lang] || k.es) : id; };
export const tiene = (id) => !!E.album[id];
export const abierto = (id) => !!E.album[id]?.abierto;
export const total = () => E.paquete.cromos.length;
export const pegados = () => E.paquete.cromos.filter((c) => abierto(c.id)).length;
export const pendientes = () => Object.entries(E.album).filter(([, r]) => !r.abierto).sort((a, b) => a[1].fecha - b[1].fecha).map(([id]) => id);
export const capituloCompleto = (cap) => cromosDe(cap).every((c) => abierto(c.id));

export function estaciones() {
  return E.paquete.estaciones.map((e) => ({ ...e, ...(E.fijadas[e.id] || {}), fijada: !!E.fijadas[e.id] }));
}
export const estacion = (id) => estaciones().find((e) => e.id === id);

export function estacionCercana(max = 400) {
  if (!E.posicion) return null;
  let mejor = null, dmin = Infinity;
  for (const e of estaciones()) { const d = distancia(E.posicion, e); if (d < dmin) { dmin = d; mejor = e; } }
  return dmin <= max ? mejor : null;
}

// ¿Se puede conseguir ya este cromo? Devuelve null si sí, o el motivo si no.
export function bloqueo(c) {
  if (c.requiere && Object.keys(E.album).length < c.requiere) return { tipo: 'requiere', faltan: c.requiere - Object.keys(E.album).length };
  if (c.despuesDe && !tiene(c.despuesDe)) return { tipo: 'despuesDe', de: c.despuesDe };
  return null;
}

// El siguiente cromo de cámara pendiente para una clase (respeta "después de").
export function pendienteDeClase(clase) {
  return E.paquete.cromos.find((c) => c.tipo === 'camara' && c.clase === clase && !tiene(c.id) && !bloqueo(c));
}

// ---------- Acciones ----------
export async function ganar(id, { foto = null, estacionId = null } = {}) {
  if (tiene(id)) return false;
  const c = cromo(id);
  const est = estacionId ? estacion(estacionId) : (c.estacion ? estacion(c.estacion) : estacionCercana());
  E.album[id] = {
    fecha: Date.now(),
    estacion: est?.id || null,
    altura: E.posicion?.altitud ?? est?.altura ?? null,
    foto: !!foto,
    abierto: false,
  };
  if (foto) await guardarFoto(id, foto);
  await guardar();
  emitir('ganado', { id });
  emitir('cambio', { id });
  return true;
}

export async function abrir(id) {
  if (!E.album[id] || E.album[id].abierto) return;
  E.album[id].abierto = true;
  await guardar();
  emitir('cambio', { id });
  if (capituloCompleto(cromo(id).capitulo)) emitir('capitulo', { cap: cromo(id).capitulo });
  if (pegados() === total()) emitir('completo', {});
}

// Miniatura para el álbum: 24 fotos grandes decodificadas pesarían ~90 MB en memoria; las miniaturas, ~5 MB.
async function miniatura(blob, lado = 360) {
  try {
    const bmp = await createImageBitmap(blob);
    const s = Math.min(1, lado / Math.min(bmp.width, bmp.height));
    const cv = document.createElement('canvas');
    cv.width = Math.round(bmp.width * s); cv.height = Math.round(bmp.height * s);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    bmp.close?.();
    return await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.8));
  } catch (e) { return blob; }
}
async function guardarFoto(id, blob) {
  await db.put('fotos', id, blob);
  await db.put('fotos', `${id}:mini`, await miniatura(blob));
}

const urls = {};
export async function fotoURL(id, { mini = false } = {}) {
  if (!E.album[id]?.foto) return null;
  const k = mini ? `${id}:mini` : id;
  if (urls[k]) return urls[k];
  const b = (await db.get('fotos', k)) || (mini ? await db.get('fotos', id) : null);
  if (!b) return null;
  urls[k] = URL.createObjectURL(b);
  return urls[k];
}
export const fotoBlob = (id) => db.get('fotos', id);

export async function ponerFoto(id, blob) {
  if (!E.album[id]) return;
  await guardarFoto(id, blob);
  E.album[id].foto = true;
  for (const k of [id, `${id}:mini`]) if (urls[k]) { URL.revokeObjectURL(urls[k]); delete urls[k]; }
  await guardar();
  emitir('cambio', { id });
}

export async function visitar(estId) {
  if (E.visitadas[estId]) return false;
  E.visitadas[estId] = Date.now();
  await guardar();
  return true;
}

export async function fijarEstacion(id, pos) {
  E.fijadas[id] = { lat: pos.lat, lon: pos.lon, ...(pos.altitud ? { altura: Math.round(pos.altitud) } : {}) };
  await guardar();
}

export async function vaciar() {
  E.album = {}; E.visitadas = {};
  for (const k of Object.keys(urls)) { URL.revokeObjectURL(urls[k]); delete urls[k]; }
  await db.clear('fotos');
  await guardar();
  emitir('cambio', {});
}

export function ponerPosicion(p) {
  E.posicion = p;
  emitir('posicion', p);
}
