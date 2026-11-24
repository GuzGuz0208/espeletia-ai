// Pantalla "Pregúntale a Fray": conversación con fichas oficiales, sin internet.
import * as chat from './chat.js';
import * as ml from './ml.js';
import { E, cromo as getCromo, cromos, nombreClase } from './estado.js';
import { t } from './i18n.js';
import { $, h, esc, animar, hablar, vibrar } from './util.js';
import { personajes } from './art.js';
import * as rec from './recorrido.js';

let iniciado = false;
let tema = null; // { id, ficha, es, en }: de qué se está hablando (Lente, cromo o foto)
let verEnMapa = null;  // (lugar) => abre el mapa en ese lugar (lo conecta app.js)
let pendiente = null;  // { tema, intro }: al llegar a una estación, se ofrece hablar de ella la próxima vez que se abra el chat
const ofrecidos = new Set();

// Fichas sobre lugares que están en el mapa
const LUGAR = { brisas: 'e1', tumbas: 'e4', volcanes: 'volcan', glaciares: 'volcan', volcan_estado: 'volcan', cima: 'volcan' };
const ES_EMERGENCIA = (f) => f.id === 'emergencia';

export function conectarMapa(fn) { verEnMapa = fn; }
export function ofrecerLugar(nuevo, intro) {
  if (!nuevo || ofrecidos.has(nuevo.id)) return;
  pendiente = { tema: nuevo, intro };
}

export function iniciarChatUI() {
  $('#chat-form').onsubmit = (e) => { e.preventDefault(); const v = $('#chat-in').value.trim(); if (v) { $('#chat-in').value = ''; enviar(v); } };
  $('#chat-pj').innerHTML = personajes.fray(56);
  $('#chat-tema-x').onclick = () => { ponerTema(null); $('#chat-in').focus(); };
  $('#chat-foto-in').onchange = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) queEsEsto(f); };
}

// El tema sale de un cromo: su ficha del chat y cómo nombrarlo ("el frailejón")
export function temaDeCromo(id) {
  const c = getCromo(id);
  return c?.ficha ? { id: c.id, ficha: c.ficha, es: c.tema.es, en: c.tema.en } : null;
}

function ponerTema(nuevo) {
  tema = nuevo;
  const box = $('#chat-tema');
  box.hidden = !tema;
  if (tema) $('.chat-tema-txt', box).innerHTML = t('chat.hablandoDe', { tema: `<b>${esc(tema[E.lang] || tema.es)}</b>` });
}

// Abrir el chat hablando de algo (desde la Lente, un sobre, un cromo o una foto)
export async function abrirConTema(nuevo, { intro = null } = {}) {
  if (!nuevo) return;
  if (!iniciado) { iniciado = true; bienvenida(); }
  if (!chat.listo()) { try { await chat.cargar(); } catch (e) { console.error(e); } }
  ponerTema(nuevo);
  const f = chat.fichaPorId(nuevo.ficha);
  if (!f) return;
  agregar(h(`<article class="msg fray tema-intro"><p>${esc(intro || t('chat.temaHola', { tema: nuevo[E.lang] || nuevo.es }))}</p></article>`));
  agregar(tarjetaFicha(f, E.lang));
  pintarSugerenciasTema(f);
}

// Sugerencias del tema: llevan directo a una ficha (no pasan por la búsqueda), así nunca fallan.
function pintarSugerenciasTema(f) {
  const box = $('#chat-sug');
  box.innerHTML = '';
  const lang = E.lang;
  const sug = [];
  const otras = (lang === 'en' ? f.qen : f.q) || [];
  for (const q of otras.slice(1, 3)) sug.push({ texto: q, ficha: f });
  const por = (id, clave) => { const x = chat.fichaPorId(id); if (x && x !== f) sug.push({ texto: t(clave), ficha: x }); };
  if (f.tema === 'flora') { por('recoger', 'chat.sug.llevar'); por('comer_plantas', 'chat.sug.comer'); }
  else if (f.tema === 'fauna') { por('fauna_trato', 'chat.sug.animal'); }
  else if (f.tema === 'naturaleza' || f.tema === 'parque') { por('recoger', 'chat.sug.llevarAlgo'); }
  for (const s of sug) {
    const txt = /[?¿]/.test(s.texto) ? s.texto : (lang === 'en' ? `${s.texto[0].toUpperCase()}${s.texto.slice(1)}?` : `¿${s.texto[0].toUpperCase()}${s.texto.slice(1)}?`);
    const b = h(`<button class="chip">${esc(txt)}</button>`);
    b.onclick = () => { box.hidden = true; mostrarFicha(s.ficha, lang, b.textContent); };
    box.appendChild(b);
  }
  box.hidden = !sug.length;
}

// «¿Qué es esto?»: una foto pasa por la Lente; si la reconoce con seguridad, se vuelve el tema.
async function queEsEsto(archivo) {
  $('#chat-sug').hidden = true;
  const url = URL.createObjectURL(archivo);
  agregar(h(`<div class="msg yo msg-foto"><img src="${url}" alt="${esc(t('chat.tuFoto'))}"></div>`));
  const pensando = agregar(h(`<div class="msg fray pensando" aria-label="${esc(t('chat.mirando'))}"><span></span><span></span><span></span></div>`));
  let r = null, motivo = 'chat.fotoDuda';
  try {
    await ml.load();
    const cfg = E.paquete.camara;
    const listas = Object.values(ml.counts()).filter((n) => n >= cfg.minPorClase).length;
    if (listas < 2) motivo = 'chat.fotoSinLente';
    else {
      const bmp = await createImageBitmap(archivo);
      try { r = await ml.classify(bmp, cfg); } finally { bmp.close?.(); }
    }
  } catch (e) { console.error(e); motivo = 'lente.sinModelo'; }
  pensando.remove();
  const cfg = E.paquete.camara;
  if (r && r.clase !== 'otro' && r.confianza >= cfg.umbral) {
    const c = cromos().find((k) => k.tipo === 'camara' && k.clase === r.clase);
    const nuevo = c && temaDeCromo(c.id);
    if (nuevo) {
      await abrirConTema(nuevo, { intro: t('chat.fotoEs', { cosa: nombreClase(r.clase).toLowerCase(), p: Math.round(r.confianza * 100) }) });
      window.__ultimoChat = { foto: true, clase: r.clase, tema: nuevo.id };
      return;
    }
  }
  const quiza = r && r.clase !== 'otro' && r.confianza > 0.3 ? ` ${t('lente.quiza', { cosa: nombreClase(r.clase).toLowerCase() })}` : '';
  agregar(h(`<article class="msg fray nose"><p>${esc(t(motivo) + quiza)}</p></article>`));
  window.__ultimoChat = { foto: true, clase: r?.clase || null, tema: null };
}

export async function entrarChat({ enfocar = true, conTema = false } = {}) {
  if (!iniciado) {
    iniciado = true;
    bienvenida();
  }
  if (pendiente && !conTema) {
    const p = pendiente; pendiente = null; ofrecidos.add(p.tema.id);
    await abrirConTema(p.tema, { intro: p.intro });
    enfocar = false;
  }
  if (!chat.listo()) {
    const estado = $('#chat-estado');
    estado.hidden = false;
    estado.textContent = t('chat.despertando');
    try { await chat.cargar(); } catch (e) { console.error(e); }
    estado.hidden = true;
    pintarSugerencias();
  }
  if (enfocar) setTimeout(() => $('#chat-in').focus({ preventScroll: true }), 50);
}

export function retraducirChat() {
  ponerTema(tema);
  const log = $('#chat-log');
  if (log) { log.innerHTML = ''; iniciado = false; if (!$('#v-chat').hidden) { iniciado = true; bienvenida(); pintarSugerencias(); } }
}

function bienvenida() {
  const log = $('#chat-log');
  log.innerHTML = '';
  agregar(h(`<article class="msg fray bienvenida"><p>${esc(t('chat.hola'))}</p><p class="msg-nota">${esc(t('chat.reglas'))}</p></article>`));
  if (chat.listo()) pintarSugerencias();
}

function pintarSugerencias() {
  const box = $('#chat-sug');
  box.innerHTML = '';
  for (const s of chat.sugerencias(E.lang)) {
    const b = h(`<button class="chip">${esc(s.texto)}</button>`);
    b.onclick = () => enviar(s.texto);
    box.appendChild(b);
  }
}

function agregar(el) {
  const log = $('#chat-log');
  log.appendChild(el);
  if (el.classList.contains('bienvenida')) $('#chat-sug').hidden = false;
  animar(el, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' });
  requestAnimationFrame(() => el.scrollIntoView({ block: 'end', behavior: 'smooth' }));
  return el;
}

function textoFicha(f, lang) { return lang === 'en' ? f.en : f.es; }
function preguntaCorta(f, lang) { return (lang === 'en' ? f.qen?.[0] : f.q[0]) || f.q[0]; }

function tarjetaFicha(f, lang, { alternativas = [], urgente = false } = {}) {
  const fuente = chat.fuentes()[f.fuente];
  const din = f.dinamica ? rec.responder(f.dinamica, lang) : null;
  const txt = din ? din.texto : textoFicha(f, lang);
  const card = h(`<article class="msg fray ficha${urgente || f.urgente ? ' urgente' : ''}${din ? ' dinamica' : ''}" lang="${lang}">
      <p class="ficha-txt">${esc(txt)}</p>
      ${din ? `<p class="ficha-fuente">${esc(t('rec.fuente', {}, lang))}</p>` : ''}
      ${fuente && f.fuente !== 'app' ? `<p class="ficha-fuente">${esc(t('det.fuente', { f: fuente.titulo }))}</p>` : ''}
      <div class="ficha-acc">
        <button class="btn-cuadro btn-linea btn-mini-cuadro" aria-label="${esc(t('det.escuchar'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path class="onda" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/></svg></button>
      </div>
    </article>`);
  const acc = card.querySelector('.ficha-acc');
  acc.querySelector('button').onclick = () => hablar(txt, lang);
  // Emergencia: la ubicación y la altura actuales, para dárselas al guía o a quien ayude
  if (urgente || ES_EMERGENCIA(f)) {
    const u = rec.ubicacionTexto(lang);
    if (u && (ES_EMERGENCIA(f) || urgente)) {
      const box = h(`<div class="ficha-ubic"><span>${esc(t('rec.tuUbicacion', {}, lang))}</span><b>${esc(u)}</b></div>`);
      const cp = h(`<button class="chip chip-mini" type="button">${esc(t('rec.copiar', {}, lang))}</button>`);
      cp.onclick = async () => { try { await navigator.clipboard.writeText(u); cp.textContent = t('rec.copiado', {}, lang); } catch (e) { cp.textContent = t('rec.noCopia', {}, lang); } };
      box.appendChild(cp);
      card.insertBefore(box, acc);
    }
  }
  const lugar = din ? din.mapa : LUGAR[f.id];
  if (lugar && verEnMapa) {
    const b = h(`<button class="chip chip-mini chip-mapa" type="button">${esc(t('rec.verMapa', {}, lang))}</button>`);
    b.onclick = () => verEnMapa(lugar);
    acc.appendChild(b);
  }
  if (din?.altura) {
    const x = chat.fichaPorId('mal_altura');
    if (x) { const b = h(`<button class="chip chip-mini" type="button">${esc(preguntaCorta(x, lang))}</button>`); b.onclick = () => mostrarFicha(x, lang, preguntaCorta(x, lang)); acc.appendChild(b); }
  }
  if (alternativas.length) {
    acc.appendChild(h(`<span class="ficha-rel">${esc(t('chat.relacionado'))}</span>`));
    for (const a of alternativas) {
      const b = h(`<button class="chip chip-mini">${esc(preguntaCorta(a, lang))}</button>`);
      b.onclick = () => mostrarFicha(a, lang, preguntaCorta(a, lang));
      acc.appendChild(b);
    }
  }
  return card;
}

function mostrarFicha(f, lang, comoPregunta) {
  agregar(h(`<div class="msg yo"><p>${esc(comoPregunta)}</p></div>`));
  agregar(tarjetaFicha(f, lang));
}

async function enviar(texto) {
  $('#chat-sug').hidden = true; // las sugerencias solo ayudan a empezar
  agregar(h(`<div class="msg yo"><p>${esc(texto)}</p></div>`));
  const pensando = agregar(h(`<div class="msg fray pensando" aria-label="${esc(t('chat.buscando'))}"><span></span><span></span><span></span></div>`));
  const lang = chat.idiomaDe(texto) || E.lang;
  let r;
  try { r = await chat.preguntar(texto, { tema }); } catch (e) { console.error(e); r = { tipo: 'nose', alternativas: [] }; }
  // Pausa mínima para que el "pensando" no parpadee
  await new Promise((ok) => setTimeout(ok, 250));
  pensando.remove();
  const nombreTema = tema ? (tema[lang] || tema.es) : '';
  if (r.tipo === 'respuesta') {
    if (r.urgente || r.ficha.urgente) vibrar([60, 40, 60]);
    const card = agregar(tarjetaFicha(r.ficha, lang, { alternativas: r.alternativas.filter((a) => a !== r.sugiereTema), urgente: r.urgente }));
    if (r.porTema) card.prepend(h(`<p class="ficha-tema">${esc(t('chat.sobre', { tema: nombreTema }, lang))}</p>`));
    if (r.sugiereTema) {
      // La pregunta tenía respuesta por sí sola, pero quizá era sobre el tema: se ofrece con un toque
      const b = h(`<button class="chip chip-tema">${esc(t('chat.oTema', { tema: nombreTema }, lang))}</button>`);
      b.onclick = () => mostrarFicha(r.sugiereTema, lang, b.textContent);
      card.appendChild(b);
    }
  } else if (r.tipo === 'duda') {
    const card = agregar(h(`<article class="msg fray duda"><p>${esc(r.porTema ? t('chat.preguntasPor', { tema: nombreTema }, lang) : t('chat.teRefieres'))}</p><div class="chips"></div></article>`));
    for (const a of r.alternativas) {
      const b = h(`<button class="chip">${esc(preguntaCorta(a, lang))}</button>`);
      b.onclick = () => mostrarFicha(a, lang, preguntaCorta(a, lang));
      card.querySelector('.chips').appendChild(b);
    }
  } else {
    const msg = r.ficha ? (r.ficha.dinamica ? rec.responder(r.ficha.dinamica, lang).texto : textoFicha(r.ficha, lang)) : t('chat.nose', {}, lang);
    agregar(h(`<article class="msg fray nose"><p>${esc(msg)}</p></article>`));
  }
  window.__ultimoChat = { texto, tipo: r.tipo, id: r.ficha?.id || null, dinamico: r.ficha?.dinamica ? rec.responder(r.ficha.dinamica, lang).texto : null, alternativas: (r.alternativas || []).map((a) => a.id), porTema: !!r.porTema, sugiereTema: r.sugiereTema?.id || null, tema: tema?.id || null };
}
