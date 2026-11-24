// Modo guía: el guía (obligatorio en el parque) entrega cromos y confirmaciones sin internet.
// Su teléfono muestra un QR y un código de 4 dígitos que cambian cada pocos minutos. Ambos son una
// firma HMAC-SHA256 de "qué se entrega" + "franja de tiempo", con una clave que conoce la app.
// El visitante escanea el QR (Lente → Leer QR) o escribe el código; su teléfono verifica la firma
// con el reloj local, sin conexión. Cada código sirve una sola vez por teléfono.
//
// Acciones:  h:<cromo>   historia contada por el guía
//            e:<estación> «llegamos a esta estación» (cuando el GPS falla) y «estamos en el parque»
//            aqui        «estamos en el parque»: habilita la pausa y la foto de grupo
//            c:<clase>   «confirmo lo que ve la Lente» (cuando la Lente duda o no está entrenada)
import { E, cromos, cromo, texto, estaciones, nombreClase, tiene, ganar, visitar, pendienteDeClase, marcarAqui, guardar } from './estado.js';
import { t } from './i18n.js';
import { $, $$, h, esc, aviso, vibrar, animar } from './util.js';

const enc = new TextEncoder();
const VENTANA = [-2, -1, 0, 1]; // franjas aceptadas: ~10 min hacia atrás y 1 adelante (relojes desfasados)
let llave = null;

const cfg = () => E.paquete.guia;
const franjaMs = () => (cfg().franjaMin || 5) * 60000;
export const franja = (ms = Date.now()) => Math.floor(ms / franjaMs());

async function hmac(txt) {
  llave ??= await crypto.subtle.importKey('raw', enc.encode(cfg().clave), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = await crypto.subtle.sign('HMAC', llave, enc.encode(txt));
  return [...new Uint8Array(s)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const firma = async (accion, f) => (await hmac(`${accion}|${f}`)).slice(0, 12);
export async function codigo(accion, f = franja()) {
  const x = await hmac(`cod|${accion}|${f}`);
  return String(parseInt(x.slice(0, 8), 16) % 10000).padStart(4, '0');
}
export async function contenidoQR(accion, f = franja()) { return `PARAMO-G|${accion}|${f}|${await firma(accion, f)}`; }

export const esDelGuia = (txt) => typeof txt === 'string' && txt.startsWith('PARAMO-G|');

// Devuelve { accion, f } si es válido, { vencido } si es viejo, o null si es falso
export async function leerQR(txt) {
  const p = txt.trim().split('|');
  if (p.length !== 4 || p[0] !== 'PARAMO-G') return null;
  const [, accion, fs, sig] = p;
  const f = Number(fs);
  if (!Number.isInteger(f) || (await firma(accion, f)) !== sig) return null;
  if (!VENTANA.includes(f - franja())) return { vencido: true };
  return { accion, f };
}

async function leerCodigo(accion, cod) {
  const a = franja();
  for (const d of VENTANA) if ((await codigo(accion, a + d)) === cod) return { accion, f: a + d };
  return null;
}

// ---------- Intentos: 5 fallos seguidos bloquean 1 minuto (luego 2, 4…) ----------
const LS = 'paramo-intentos';
const leerInt = () => { try { return JSON.parse(localStorage.getItem(LS)) || { n: 0, hasta: 0, nivel: 0 }; } catch (e) { return { n: 0, hasta: 0, nivel: 0 }; } };
const guardarInt = (x) => { try { localStorage.setItem(LS, JSON.stringify(x)); } catch (e) { /* */ } };
export const esperaSegundos = () => Math.max(0, Math.ceil((leerInt().hasta - Date.now()) / 1000));
function fallo() {
  const x = leerInt();
  x.n++;
  if (x.n >= 5) { x.hasta = Date.now() + 60000 * 2 ** x.nivel; x.nivel = Math.min(x.nivel + 1, 4); x.n = 0; }
  guardarInt(x);
}
const acierto = () => guardarInt({ n: 0, hasta: 0, nivel: 0 });

// ---------- Aplicar lo que entrega el guía (en el teléfono del visitante) ----------
// Devuelve { ganado: id } o { msg: 'clave de i18n', vars }
export async function aplicar({ accion, f }) {
  const marca = `${accion}|${f}`;
  if (E.usados.includes(marca)) return { msg: 'guia.usado' };
  const [tipo, arg] = accion.split(':');
  let r;
  if (tipo === 'h') {
    const c = cromo(arg);
    if (!c || c.tipo !== 'guia') return { msg: 'lente.qrAjeno' };
    r = tiene(c.id) ? { msg: 'lente.qrRepetido', vars: { n: c.n, nombre: texto(c).nombre } } : (await ganar(c.id), { ganado: c.id });
  } else if (tipo === 'e') {
    const est = estaciones().find((e) => e.id === arg);
    if (!est) return { msg: 'lente.qrAjeno' };
    await visitar(est.id);
    await marcarAqui();
    const c = cromos().find((k) => k.tipo === 'gps' && k.estacion === est.id);
    r = c && !tiene(c.id) ? (await ganar(c.id, { estacionId: est.id }), { ganado: c.id }) : { msg: 'guia.aqui' };
  } else if (tipo === 'aqui') {
    await marcarAqui();
    r = { msg: 'guia.aqui' };
  } else if (tipo === 'c') {
    await marcarAqui();
    const c = pendienteDeClase(arg, { guia: true });
    r = c ? (await ganar(c.id), { ganado: c.id }) : { msg: 'guia.yaClase', vars: { cosa: nombreClase(arg).toLowerCase() } };
  } else return { msg: 'lente.qrAjeno' };
  E.usados.push(marca);
  await guardar();
  return r;
}

// ---------- Casilla para escribir el código del guía ----------
// alResultado(r) recibe lo que devolvió aplicar()
export function formCodigo(accion, alResultado, { etiqueta = t('codigo.etiqueta') } = {}) {
  const f = h(`<form class="codigo" autocomplete="off">
      <label class="codigo-et">${esc(etiqueta)}</label>
      <div class="codigo-fila">
        <input inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="• • • •" enterkeyhint="done" aria-label="${esc(etiqueta)}">
        <button class="btn btn-flor">${esc(t('codigo.ok'))}</button>
      </div>
    </form>`);
  const inp = $('input', f);
  f.onsubmit = async (e) => {
    e.preventDefault();
    const espera = esperaSegundos();
    if (espera) { aviso(t('codigo.espera', { s: espera }), 3500); return; }
    const v = inp.value.trim();
    const ok = /^\d{4}$/.test(v) && (await leerCodigo(accion, v));
    if (ok) { acierto(); alResultado(await aplicar(ok)); return; }
    fallo();
    aviso(esperaSegundos() ? t('codigo.espera', { s: esperaSegundos() }) : t('codigo.mal'), 3500);
    vibrar([40, 40, 40]);
    animar(inp, [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(0)' }], { duration: 320 });
    inp.select();
  };
  return f;
}

// ---------- Pantalla del guía ----------
let reloj = null, despierto = null, sel = null, ultimaF = null, ctx = {};
export function iniciarGuia(c) { ctx = c; }

function opciones() {
  return {
    historias: cromos().filter((c) => c.tipo === 'guia').map((c) => ({ accion: `h:${c.id}`, nombre: texto(c).nombre, guion: texto(c).dato, n: c.n })),
    estaciones: estaciones().map((e, i) => ({ accion: `e:${e.id}`, nombre: `${i + 1}. ${e.nombre}`, guion: t('guia.guionEst') })),
    aqui: [{ accion: 'aqui', nombre: t('guia.aquiNombre'), guion: t('guia.guionAqui') }],
    lente: E.paquete.clases.filter((k) => k.id !== 'otro').map((k) => ({ accion: `c:${k.id}`, nombre: k[E.lang] || k.es, guion: t('guia.guionLente') })),
  };
}

export async function entrarGuia() {
  const v = $('#v-guia');
  const op = opciones();
  sel = Object.values(op).flat().find((o) => o.accion === sel?.accion) || op.historias[0];
  v.innerHTML = '';
  const grupo = (clave, lista) => `<fieldset class="guia-grupo"><legend>${esc(t(`guia.g.${clave}`))}</legend><div class="guia-ops">${lista.map((o) => `<button type="button" data-a="${esc(o.accion)}" aria-pressed="${o.accion === sel.accion}">${esc(o.nombre)}</button>`).join('')}</div></fieldset>`;
  v.appendChild(h(`<div class="guia">
      <header class="campo-cab"><h2 id="guia-titulo">${esc(t('guia.titulo'))}</h2><button class="btn btn-linea btn-mini" id="guia-volver">${esc(t('eq.volver'))}</button></header>
      <p class="sub">${esc(t('guia.sub'))}</p>
      <figure class="guia-tarjeta" aria-live="polite">
        <figcaption class="guia-que"></figcaption>
        <div class="guia-qr"></div>
        <p class="guia-cod-et">${esc(t('guia.oCodigo'))}</p>
        <p class="guia-cod"></p>
        <p class="guia-cambia"><span class="guia-barra"><i></i></span><span class="guia-resta"></span></p>
      </figure>
      <div class="guia-guion"></div>
      ${grupo('historias', op.historias)}${grupo('estaciones', op.estaciones)}${grupo('aqui', op.aqui)}${grupo('lente', op.lente)}
      <p class="sub guia-nota">${esc(cfg().nota[E.lang] || cfg().nota.es)}</p>
    </div>`));
  $('#guia-volver').onclick = () => ctx.irA('album');
  const todas = Object.values(op).flat();
  $$('.guia-ops button', v).forEach((b) => (b.onclick = () => {
    sel = todas.find((o) => o.accion === b.dataset.a);
    $$('.guia-ops button', v).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    ultimaF = null; pintar();
    $('.guia-tarjeta', v).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  ultimaF = null;
  await pintar();
  clearInterval(reloj);
  reloj = setInterval(pintar, 1000);
  // Que la pantalla no se apague mientras el grupo escanea
  try { despierto = await navigator.wakeLock?.request('screen'); } catch (e) { /* sin permiso */ }
}

export function salirGuia() { clearInterval(reloj); reloj = null; try { despierto?.release(); } catch (e) { /* */ } despierto = null; }

async function pintar() {
  const v = $('#v-guia');
  if (!v || v.hidden && reloj) return;
  const ahora = Date.now(), f = franja(ahora);
  const resta = Math.ceil(((f + 1) * franjaMs() - ahora) / 1000);
  $('.guia-resta', v).textContent = t('guia.cambia', { t: `${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, '0')}` });
  $('.guia-barra i', v).style.transform = `scaleX(${resta / (franjaMs() / 1000)})`;
  if (f === ultimaF) return;
  ultimaF = f;
  const qrTxt = await contenidoQR(sel.accion, f);
  const q = window.qrcode(0, 'M'); q.addData(qrTxt); q.make();
  $('.guia-qr', v).innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  $('.guia-qr svg', v)?.setAttribute('role', 'img');
  $('.guia-qr svg', v)?.setAttribute('aria-label', t('guia.qrAlt', { que: sel.nombre }));
  $('.guia-que', v).textContent = sel.nombre;
  $('.guia-cod', v).textContent = (await codigo(sel.accion, f)).split('').join(' ');
  $('.guia-guion', v).innerHTML = `<p><b>${esc(t('guia.guion'))}</b> ${esc(sel.guion)}</p>`;
  animar($('.guia-tarjeta', v), [{ opacity: 0.6 }, { opacity: 1 }], { duration: 250 });
}
