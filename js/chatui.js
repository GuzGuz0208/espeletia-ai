// Pantalla "Pregúntale a Fray": conversación con fichas oficiales, sin internet.
import * as chat from './chat.js';
import { E } from './estado.js';
import { t } from './i18n.js';
import { $, h, esc, animar, hablar, vibrar } from './util.js';
import { personajes } from './art.js';

let iniciado = false;

export function iniciarChatUI() {
  $('#chat-form').onsubmit = (e) => { e.preventDefault(); const v = $('#chat-in').value.trim(); if (v) { $('#chat-in').value = ''; enviar(v); } };
  $('#chat-pj').innerHTML = personajes.fray(56);
}

export async function entrarChat() {
  if (!iniciado) {
    iniciado = true;
    bienvenida();
  }
  if (!chat.listo()) {
    const estado = $('#chat-estado');
    estado.hidden = false;
    estado.textContent = t('chat.despertando');
    try { await chat.cargar(); } catch (e) { console.error(e); }
    estado.hidden = true;
    pintarSugerencias();
  }
  setTimeout(() => $('#chat-in').focus({ preventScroll: true }), 50);
}

export function retraducirChat() {
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
  const card = h(`<article class="msg fray ficha${urgente || f.urgente ? ' urgente' : ''}" lang="${lang}">
      <p class="ficha-txt">${esc(textoFicha(f, lang))}</p>
      ${fuente && f.fuente !== 'app' ? `<p class="ficha-fuente">${esc(t('det.fuente', { f: fuente.titulo }))}</p>` : ''}
      <div class="ficha-acc">
        <button class="btn-cuadro btn-linea btn-mini-cuadro" aria-label="${esc(t('det.escuchar'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path class="onda" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/></svg></button>
      </div>
    </article>`);
  card.querySelector('.ficha-acc button').onclick = () => hablar(textoFicha(f, lang), lang);
  if (alternativas.length) {
    const acc = card.querySelector('.ficha-acc');
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
  try { r = await chat.preguntar(texto); } catch (e) { console.error(e); r = { tipo: 'nose', alternativas: [] }; }
  // Pausa mínima para que el "pensando" no parpadee
  await new Promise((ok) => setTimeout(ok, 250));
  pensando.remove();
  if (r.tipo === 'respuesta') {
    if (r.urgente || r.ficha.urgente) vibrar([60, 40, 60]);
    agregar(tarjetaFicha(r.ficha, lang, { alternativas: r.alternativas, urgente: r.urgente }));
  } else if (r.tipo === 'duda') {
    const card = agregar(h(`<article class="msg fray duda"><p>${esc(t('chat.teRefieres'))}</p><div class="chips"></div></article>`));
    for (const a of r.alternativas) {
      const b = h(`<button class="chip">${esc(preguntaCorta(a, lang))}</button>`);
      b.onclick = () => mostrarFicha(a, lang, preguntaCorta(a, lang));
      card.querySelector('.chips').appendChild(b);
    }
  } else {
    const msg = r.ficha ? textoFicha(r.ficha, lang) : t('chat.nose', {}, lang);
    agregar(h(`<article class="msg fray nose"><p>${esc(msg)}</p></article>`));
  }
  window.__ultimoChat = { texto, tipo: r.tipo, id: r.ficha?.id || null, alternativas: (r.alternativas || []).map((a) => a.id) };
}
