// Ajustes del visitante y Modo equipo (enseñar a la Lente, fijar estaciones, códigos, demo).
import * as ml from './ml.js';
import { E, guardar, estaciones, fijarEstacion, cromos, vaciar, texto } from './estado.js';
import { t } from './i18n.js';
import { $, $$, h, esc, aviso, vibrar, animar, atraparFoco } from './util.js';
import { listoOffline } from './portada.js';
import { albumPNG, descargar } from './exportar.js';
import { iniciarGPS } from './mapa.js';

const PIN = '2611';
let ctx = {};
export function iniciarAjustes(c) { ctx = c; }

// ---------- Hoja de ajustes ----------
export async function abrirAjustes() {
  const capa = $('#capa-ajustes');
  const listo = await listoOffline();
  capa.innerHTML = '';
  const hoja = h(`<div class="hoja">
      <div class="hoja-asa" aria-hidden="true"></div>
      <h2>${esc(t('aj.titulo'))}</h2>
      <label class="campo"><span>${esc(t('aj.nombre'))}</span><input id="aj-nombre" maxlength="24" value="${esc(E.nombre)}" placeholder="${esc(t('portada.nombre'))}"></label>
      <div class="campo"><span>${esc(t('aj.idioma'))}</span>
        <div class="segmentos" role="group"><button data-l="es" aria-pressed="${E.lang === 'es'}">Español</button><button data-l="en" aria-pressed="${E.lang === 'en'}">English</button></div></div>
      <div class="campo"><span>${esc(t('aj.tema'))}</span>
        <div class="segmentos" role="group">${['auto', 'papel', 'noche'].map((k) => `<button data-tema="${k}" aria-pressed="${E.ajustes.tema === k}">${esc(t(`aj.tema.${k}`))}</button>`).join('')}</div></div>
      <label class="interruptor"><input type="checkbox" id="aj-voz" ${E.ajustes.voz ? 'checked' : ''}><span>${esc(t('aj.voz'))}</span></label>
      <label class="interruptor"><input type="checkbox" id="aj-vibrar" ${E.ajustes.vibrar ? 'checked' : ''}><span>${esc(t('aj.vibrar'))}</span></label>
      <button class="btn btn-linea btn-ancho" id="aj-poster">${esc(t('aj.poster'))}</button>
      <p class="estado-offline ${listo ? 'listo' : ''}"><span class="punto"></span>${esc(listo ? t('aj.listo') : t('aj.noListo'))}</p>
      <div class="hoja-pie">
        <button class="link" id="aj-equipo">${esc(t('aj.equipo'))}</button>
        <span class="version">${esc(t('aj.version', { v: E.paquete.version }))}</span>
      </div>
      <button class="btn btn-flor btn-ancho" id="aj-cerrar">${esc(t('aj.cerrar'))}</button>
    </div>`);
  capa.appendChild(hoja);
  capa.hidden = false;
  const soltar = atraparFoco(capa);
  animar(hoja, [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 320, easing: 'cubic-bezier(.2,.9,.3,1)' });
  const cerrar = async () => {
    E.nombre = $('#aj-nombre').value.trim();
    await guardar();
    await animar(hoja, [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }], { duration: 220, easing: 'ease-in' });
    capa.hidden = true; capa.innerHTML = ''; soltar();
    ctx.alCambiar();
  };
  $$('[data-l]', hoja).forEach((b) => (b.onclick = async () => {
    E.lang = b.dataset.l; E.nombre = $('#aj-nombre').value.trim(); await guardar(); ctx.alCambiar(); abrirAjustes();
  }));
  $$('[data-tema]', hoja).forEach((b) => (b.onclick = async () => {
    E.ajustes.tema = b.dataset.tema; await guardar(); aplicarTema();
    $$('[data-tema]', hoja).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));
  $('#aj-voz').onchange = (e) => { E.ajustes.voz = e.target.checked; guardar(); };
  $('#aj-vibrar').onchange = (e) => { E.ajustes.vibrar = e.target.checked; guardar(); };
  $('#aj-poster').onclick = async () => descargar(await albumPNG(), 'album-del-paramo.png');
  $('#aj-equipo').onclick = async () => { await cerrar(); pedirPIN(); };
  $('#aj-cerrar').onclick = cerrar;
  capa.onclick = (e) => { if (e.target === capa) cerrar(); };
}

export function aplicarTema() {
  const tema = E.ajustes.tema === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'noche' : 'papel') : E.ajustes.tema;
  document.documentElement.dataset.tema = tema;
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => E.paquete && aplicarTema());

// ---------- PIN con teclado propio ----------
function pedirPIN() {
  const capa = $('#capa-ajustes');
  capa.innerHTML = '';
  let v = '';
  const hoja = h(`<div class="hoja hoja-pin">
      <h2>${esc(t('eq.pin'))}</h2>
      <div class="pin-puntos" aria-live="polite"><i></i><i></i><i></i><i></i></div>
      <div class="teclado">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((k) => `<button ${k === '' ? 'disabled aria-hidden="true"' : ''} data-k="${k}" ${k === '⌫' ? 'aria-label="Borrar"' : ''}>${k}</button>`).join('')}</div>
      <button class="btn btn-linea btn-ancho" data-x>${esc(t('cerrar'))}</button>
    </div>`);
  capa.appendChild(hoja);
  capa.hidden = false;
  const soltar = atraparFoco(capa);
  const pintar = () => $$('.pin-puntos i', hoja).forEach((p, i) => p.classList.toggle('lleno', i < v.length));
  const fin = () => { capa.hidden = true; capa.innerHTML = ''; soltar(); };
  $$('[data-k]', hoja).forEach((b) => (b.onclick = async () => {
    const k = b.dataset.k;
    if (k === '⌫') v = v.slice(0, -1); else if (v.length < 4) v += k;
    pintar(); vibrar(8);
    if (v.length === 4) {
      if (v === PIN) { fin(); ctx.irA('equipo'); }
      else { vibrar([40, 40, 40]); await animar($('.pin-puntos', hoja), [{ transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(0)' }], { duration: 260 }); aviso(t('eq.pinMal')); v = ''; pintar(); }
    }
  }));
  $('[data-x]', hoja).onclick = fin;
}

// ---------- Vista de equipo ----------
export function pintarEquipo() {
  const v = $('#v-equipo');
  v.innerHTML = '';
  v.appendChild(h(`<div class="equipo">
      <header class="campo-cab"><h2 id="eq-titulo">${esc(t('eq.titulo'))}</h2><button class="btn btn-linea btn-mini" id="eq-volver">${esc(t('eq.volver'))}</button></header>
      <p class="sub">${esc(t('eq.sub'))}</p>
      <details open><summary>${esc(t('eq.ensenar'))}</summary>
        <p class="sub">${esc(t('eq.ensenarSub'))}</p>
        <div class="mini-visor"><video id="video-eq" playsinline muted></video></div>
        <div id="clases" class="clases"></div>
        <div class="fila"><button id="eq-probar" class="btn btn-linea">${esc(t('eq.probar'))}</button><span id="eq-prueba" class="sub"></span></div>
        <div class="fila">
          <button id="eq-exportar" class="btn btn-linea">${esc(t('eq.exportar'))}</button>
          <label class="btn btn-linea">${esc(t('eq.importar'))}<input id="eq-importar" type="file" accept=".json,application/json" hidden></label>
          <button id="eq-borrar" class="btn btn-peligro">${esc(t('eq.borrar'))}</button>
        </div>
      </details>
      <details><summary>${esc(t('eq.estaciones'))}</summary><p class="sub">${esc(t('eq.estacionesSub'))}</p><ol id="eq-est" class="estaciones"></ol></details>
      <details><summary>${esc(t('eq.codigos'))}</summary><p class="sub">${esc(t('eq.codigosSub'))}</p><button id="eq-imprimir" class="btn btn-linea">${esc(t('eq.verCodigos'))}</button></details>
      <details><summary>${esc(t('eq.datos'))}</summary>
        <label class="interruptor"><input type="checkbox" id="eq-demo" ${E.ajustes.demo ? 'checked' : ''}><span>${esc(t('eq.demo'))}</span></label>
        <button id="eq-vaciar" class="btn btn-peligro">${esc(t('eq.vaciar'))}</button>
        <p class="sub">${esc(E.paquete.estado[E.lang])}</p>
      </details>
    </div>`));
  $('#eq-volver').onclick = () => ctx.irA('mapa');
  $('#eq-probar').onclick = probar;
  $('#eq-exportar').onclick = () => descargar(new Blob([ml.exportModel()], { type: 'application/json' }), 'modelo-lente-paramo.json');
  $('#eq-importar').onchange = async (e) => {
    try { await ml.load(); await ml.importModel(await e.target.files[0].text()); pintarClases(); aviso(t('eq.importado')); }
    catch (err) { aviso(err.message, 4000); }
  };
  $('#eq-borrar').onclick = async () => { if (confirm(t('eq.borrarSeguro'))) { await ml.clearSamples(); pintarClases(); } };
  $('#eq-demo').onchange = async (e) => { E.ajustes.demo = e.target.checked; await guardar(); };
  $('#eq-vaciar').onclick = async () => { if (confirm(t('eq.vaciarSeguro'))) { await vaciar(); aviso(t('eq.vaciado')); } };
  $('#eq-imprimir').onclick = hojaCodigos;
  pintarEstaciones();
}

let streamEq = null;
export async function entrarEquipo() {
  pintarEquipo();
  try {
    streamEq = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    const v = $('#video-eq'); v.srcObject = streamEq; await v.play().catch(() => {});
  } catch (e) { console.warn(e); }
  await ml.load().catch(() => {});
  pintarClases();
  iniciarGPS();
}
export function salirEquipo() { if (streamEq) { streamEq.getTracks().forEach((x) => x.stop()); streamEq = null; } }

function pintarClases() {
  const box = $('#clases');
  if (!box) return;
  const cont = ml.counts();
  box.innerHTML = '';
  for (const k of E.paquete.clases) {
    const n = cont[k.id] || 0;
    const fila = h(`<div class="clase">
        <span><b>${esc(k[E.lang])}</b>${k.ayuda ? `<small>${esc(k.ayuda[E.lang])}</small>` : ''}<small class="cuenta ${n >= 15 ? 'lista' : ''}">${esc(t('eq.fotos', { n }))}${n >= 15 ? ` — ${esc(t('eq.lista'))}` : ''}</small></span>
        <button class="btn btn-flor btn-mini" data-c="${k.id}">${esc(t('eq.mas'))}</button>
      </div>`);
    const b = $('button', fila);
    const una = async () => {
      const v = $('#video-eq');
      if (!v?.videoWidth || !ml.ready()) return;
      await ml.addSample(k.id, v);
      vibrar(12);
      const nn = ml.counts()[k.id] || 0;
      $('.cuenta', fila).textContent = `${t('eq.fotos', { n: nn })}${nn >= 15 ? ` — ${t('eq.lista')}` : ''}`;
      $('.cuenta', fila).classList.toggle('lista', nn >= 15);
    };
    b.onclick = una;
    let rafaga = null;
    b.onpointerdown = () => { rafaga = setTimeout(function r() { una(); rafaga = setTimeout(r, 280); }, 450); };
    b.onpointerup = b.onpointerleave = b.onpointercancel = () => clearTimeout(rafaga);
    box.appendChild(fila);
  }
}

async function probar() {
  const v = $('#video-eq');
  const r = await ml.classify(v, E.paquete.camara);
  if (!r) { $('#eq-prueba').textContent = t('eq.sinFotos'); return; }
  const k = E.paquete.clases.find((c) => c.id === r.clase);
  $('#eq-prueba').textContent = `${t('eq.prueba', { cosa: k[E.lang], p: Math.round(r.confianza * 100) })} ${r.confianza < E.paquete.camara.umbral ? t('eq.pruebaBaja') : ''}`;
}

function pintarEstaciones() {
  const ol = $('#eq-est');
  ol.innerHTML = '';
  estaciones().forEach((e, i) => {
    const li = h(`<li><span class="est-num">${i + 1}</span><span class="est-txt"><b>${esc(e.nombre)}</b><small>${e.lat.toFixed(5)}, ${e.lon.toFixed(5)} — ${e.radio} m — ${esc(e.fijada ? t('eq.fijada') : t('eq.aprox'))}</small></span></li>`);
    const b = h(`<button class="btn btn-linea btn-mini">${esc(t('eq.fijar'))}</button>`);
    b.onclick = async () => {
      const p = E.posicion;
      if (!p) { iniciarGPS(); aviso(t('eq.esperaGps')); return; }
      if (p.precision > 30) { aviso(t('eq.precision', { m: Math.round(p.precision) }), 3500); return; }
      await fijarEstacion(e.id, p);
      aviso(t('eq.fijadaOk', { est: e.nombre }));
      pintarEstaciones();
    };
    li.appendChild(b);
    ol.appendChild(li);
  });
}

function hojaCodigos() {
  const qrs = cromos().filter((c) => c.tipo === 'qr').map((c) => {
    const q = window.qrcode(0, 'M'); q.addData(c.codigo); q.make();
    return `<figure><img src="${q.createDataURL(8, 2)}" alt="QR ${esc(c.codigo)}"><figcaption><b>${c.n}. ${esc(texto(c).nombre)}</b><br>${esc(c.codigo)}</figcaption></figure>`;
  }).join('');
  const guias = cromos().filter((c) => c.tipo === 'guia').map((c) => `<li><b>${c.n}. ${esc(texto(c).nombre)}</b>: <code>${esc(c.codigo)}</code></li>`).join('');
  const w = window.open('', '_blank');
  if (!w) { aviso(t('eq.ventanas')); return; }
  w.document.write(`<!DOCTYPE html><html lang="${E.lang}"><head><meta charset="utf-8"><title>${esc(t('eq.codigos'))}</title>
    <style>body{font-family:system-ui,sans-serif;color:#1d2b38;padding:24px}h1{margin:0 0 4px}.qrs{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}figure{margin:0;text-align:center;border:1px dashed #9aa;padding:10px;break-inside:avoid}img{width:100%;image-rendering:pixelated}code{font-size:1.3em}</style>
    </head><body><h1>${esc(t('titulo'))}</h1><p>${esc(t('eq.codigosSub'))}</p><div class="qrs">${qrs}</div><h2>${esc(t('tipo.guia'))}</h2><ul>${guias}</ul><p><small>${esc(E.paquete.estado[E.lang])}</small></p></body></html>`);
  w.document.close();
}
