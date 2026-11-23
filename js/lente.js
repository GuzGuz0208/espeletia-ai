// La Lente: reconoce cosas del páramo, lee QR y toma fotos (grupo o "ponerle mi foto").
import * as ml from './ml.js';
import { E, cromo as getCromo, cromos, texto, nombreClase, tiene, ganar, pendienteDeClase, ponerFoto } from './estado.js';
import { t } from './i18n.js';
import { $, $$, animar, vibrar, hablar, aviso } from './util.js';
import { personajes } from './art.js';

const MAX_MS = 3 * 60 * 1000; // la cámara se apaga sola para cuidar la batería en frío
let stream = null, bucle = null, apagado = null, ocupado = false, frente = false;
let modo = 'reconocer', objetivo = null, ultimoId = null, qr = null, activa = false;
let alGanar = async () => {};

export function iniciarLente({ onGanar }) {
  alGanar = onGanar;
  $$('.lente-modo button').forEach((b) => (b.onclick = () => ponerModo(b.dataset.modo)));
  $('#lente-encender').onclick = () => encender();
  $('#disparar').onclick = disparar;
  $('#foto-cancelar').onclick = () => { objetivo = null; ponerModo('reconocer'); };
  $('#foto-girar').onclick = async () => { frente = !frente; apagarStream(); await encender(); };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) apagarStream();
    else if (activa) encender(); // al volver a la app, la Lente se reactiva sola
  });
  if ('BarcodeDetector' in window) {
    BarcodeDetector.getSupportedFormats?.().then((f) => { if (f.includes('qr_code')) qr = new BarcodeDetector({ formats: ['qr_code'] }); }).catch(() => {});
  }
  personaje('fray');
}

export async function entrar(m) {
  activa = true;
  if (m) ponerModo(m);
  else ponerModo(modo);
  await encender();
  if (!ml.ready()) {
    decir(t('lente.cargando'));
    try { await ml.load(); if (modo === 'reconocer') decir(t('lente.apunta')); }
    catch (e) { console.error(e); decir(t('lente.sinModelo')); }
  }
}
export function salir() { activa = false; apagarStream(); }

export function pedirFoto(id, msg) {
  objetivo = { id, msg };
  if (frente) { frente = false; apagarStream(); }
}

function personaje(n) { $('#pj').innerHTML = personajes[n](84); }
function decir(msg) { $('#lente-msg').textContent = msg; }

export function ponerModo(m) {
  if (m !== 'foto' && objetivo && m !== modo) objetivo = null;
  modo = objetivo ? 'foto' : m;
  $$('.lente-modo button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.modo === modo)));
  const enFoto = modo === 'foto';
  $('.lente-modo').hidden = enFoto;
  $('#lente-foto-barra').hidden = !enFoto;
  $('#disparar').hidden = !enFoto;
  $('#v-lente').dataset.modo = modo;
  $('#lente-abrir').hidden = true; $('#lente-escuchar').hidden = true;
  $('#lente-chip').hidden = true;
  fijar(false);
  ultimoId = null;
  if (modo === 'qr') decir(t('lente.qrApunta'));
  else if (enFoto) decir(objetivo?.msg || t('lente.foto'));
  else decir(ml.ready() ? t('lente.apunta') : t('lente.cargando'));
  personaje('fray');
  if (stream) arrancar();
}

async function encender() {
  if (!navigator.mediaDevices?.getUserMedia) { decir(t('lente.https')); return false; }
  const v = $('#video');
  try {
    if (!stream) stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: frente ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
    v.srcObject = stream;
    v.classList.toggle('espejo', frente);
    await v.play().catch(() => {});
    $('#lente-apagada').hidden = true;
    clearTimeout(apagado);
    apagado = setTimeout(() => { apagarStream(); $('#lente-apagada').hidden = false; aviso(t('lente.apagada')); }, MAX_MS);
    arrancar();
    return true;
  } catch (e) {
    console.warn(e);
    decir(t('lente.sinCamara'));
    $('#lente-apagada').hidden = false;
    return false;
  }
}

function apagarStream() {
  clearInterval(bucle); bucle = null; clearTimeout(apagado);
  if (stream) { stream.getTracks().forEach((tr) => tr.stop()); stream = null; }
  $('#video').srcObject = null;
}

function arrancar() {
  clearInterval(bucle);
  if (modo === 'foto') return;
  bucle = setInterval(modo === 'qr' ? pasoQR : pasoReconocer, modo === 'qr' ? 320 : 650);
}

function fijar(on) { $('#v-lente').classList.toggle('fijada', on); }

async function pasoReconocer() {
  const v = $('#video');
  if (ocupado || !v.videoWidth || !ml.ready()) return;
  ocupado = true;
  try {
    const cfg = E.paquete.camara;
    const conteo = ml.counts();
    const clasesListas = Object.values(conteo).filter((n) => n >= cfg.minPorClase).length;
    if (clasesListas < 2) { decir(t('lente.sinEntrenar')); return; }
    const r = await ml.classify(v, cfg);
    const chip = $('#lente-chip');
    if (!r || r.clase === 'otro' || r.confianza < cfg.umbral) {
      fijar(false); personaje('fray');
      decir(t('lente.duda'));
      if (r && r.clase !== 'otro' && r.confianza > 0.3) { chip.hidden = false; chip.textContent = t('lente.quiza', { cosa: nombreClase(r.clase).toLowerCase() }); }
      else chip.hidden = true;
      $('#lente-abrir').hidden = true; $('#lente-escuchar').hidden = true; ultimoId = null;
      return;
    }
    const pendiente = pendienteDeClase(r.clase);
    const c = pendiente || cromos().find((k) => k.tipo === 'camara' && k.clase === r.clase);
    const tx = texto(c);
    fijar(true); personaje(c.personaje);
    chip.hidden = false;
    chip.textContent = `${nombreClase(r.clase)} — ${t('lente.seguridad', { p: Math.round(r.confianza * 100) })}`;
    decir(tx.dato);
    const esc = $('#lente-escuchar');
    esc.hidden = false; esc.onclick = () => hablar(`${tx.nombre}. ${tx.dato}`, E.lang);
    const ab = $('#lente-abrir');
    if (pendiente) {
      ab.hidden = false; ab.disabled = false; ab.textContent = t('lente.abrirSobre');
      if (ultimoId !== pendiente.id) { ultimoId = pendiente.id; vibrar(50); animar(ab, [{ transform: 'scale(.9)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 300 }); }
      ab.onclick = async () => {
        ab.disabled = true;
        const foto = await capturar(v);
        await ganar(pendiente.id, { foto });
        await alGanar(pendiente.id);
      };
    } else {
      ab.hidden = false; ab.disabled = true; ab.textContent = t('lente.yaLoTienes');
    }
  } catch (e) { console.error(e); } finally { ocupado = false; }
}

async function pasoQR() {
  const v = $('#video');
  if (ocupado || !v.videoWidth) return;
  ocupado = true;
  try {
    let valor = null;
    if (qr) { const res = await qr.detect(v); valor = res[0]?.rawValue || null; }
    else if (window.jsQR) {
      const cv = lienzo(v, 520);
      const d = cv.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, cv.width, cv.height);
      valor = window.jsQR(d.data, d.width, d.height, { inversionAttempts: 'attemptBoth' })?.data || null;
    }
    if (!valor) return;
    const c = cromos().find((k) => k.tipo === 'qr' && k.codigo === valor.trim());
    const chip = $('#lente-chip');
    if (!c) { decir(t('lente.qrAjeno')); chip.hidden = true; return; }
    personaje(c.personaje);
    if (tiene(c.id)) { decir(t('lente.qrRepetido', { n: c.n, nombre: texto(c).nombre })); return; }
    fijar(true); vibrar([30, 40, 30]);
    clearInterval(bucle); bucle = null;
    await ganar(c.id);
    await alGanar(c.id);
  } catch (e) { console.error(e); } finally { ocupado = false; }
}

function lienzo(v, lado = 1100) {
  const w = v.videoWidth, hh = v.videoHeight, s = Math.min(1, lado / Math.max(w, hh));
  const cv = document.createElement('canvas');
  cv.width = Math.round(w * s); cv.height = Math.round(hh * s);
  const ctx = cv.getContext('2d');
  if (frente) { ctx.translate(cv.width, 0); ctx.scale(-1, 1); }
  ctx.drawImage(v, 0, 0, cv.width, cv.height);
  return cv;
}
const capturar = (v) => new Promise((ok) => lienzo(v).toBlob(ok, 'image/jpeg', 0.86));

async function disparar() {
  if (!objetivo || !stream) return;
  const v = $('#video');
  // Destello de obturador
  const fl = $('.lente-marco');
  animar(fl, [{ boxShadow: 'inset 0 0 0 999px rgba(255,255,255,.85)' }, { boxShadow: 'inset 0 0 0 999px rgba(255,255,255,0)' }], { duration: 320 });
  vibrar(40);
  const foto = await capturar(v);
  const { id } = objetivo;
  objetivo = null;
  frente = false;
  if (tiene(id)) {
    await ponerFoto(id, foto);
    aviso(t('lente.fotoPuesta'));
    await alGanar(id, { soloFoto: true });
  } else {
    await ganar(id, { foto });
    await alGanar(id);
  }
  ponerModo('reconocer');
}
