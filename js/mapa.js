// Mapa del sendero (dibujado como un pliego topográfico) y geocercas por GPS.
import { E, bus, estaciones, cromos, tiene, ganar, visitar, ponerPosicion, texto } from './estado.js';
import { t } from './i18n.js';
import { $, h, esc, distancia, fmtDist, vibrar, aviso, animar } from './util.js';

let watch = null;
let onLlegada = async () => {};

export function iniciarMapa({ llegada }) {
  onLlegada = llegada;
  bus.addEventListener('posicion', () => { revisar(); if (!$('#v-mapa').hidden) pintar(); });
  bus.addEventListener('cambio', () => { if (!$('#v-mapa').hidden) pintar(); });
  chip(t('mapa.gpsApagado'), false);
}

export function iniciarGPS() {
  if (!('geolocation' in navigator)) { chip(t('mapa.gpsSin'), false); return; }
  if (watch !== null) return;
  chip(t('mapa.gpsBuscando'), false);
  watch = navigator.geolocation.watchPosition((p) => {
    ponerPosicion({ lat: p.coords.latitude, lon: p.coords.longitude, precision: p.coords.accuracy, altitud: p.coords.altitude });
    chip(t('mapa.gpsOk', { m: Math.round(p.coords.accuracy) }), p.coords.accuracy < 50);
  }, (err) => {
    chip(err.code === 1 ? t('mapa.gpsSinPermiso') : t('mapa.gpsSin'), false);
  }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 60000 });
}

function chip(txt, ok) { const c = $('#gps-chip'); c.textContent = txt; c.classList.toggle('ok', ok); }

function revisar() {
  const p = E.posicion;
  if (!p || p.precision > 120) return; // posición muy imprecisa: esperar
  for (const e of estaciones()) {
    if (distancia(p, e) <= e.radio + Math.min(p.precision, 30)) llegar(e);
  }
}

export async function llegar(e, { simulado = false } = {}) {
  const nueva = await visitar(e.id);
  const c = cromos().find((k) => k.tipo === 'gps' && k.estacion === e.id);
  if (c && !tiene(c.id)) {
    await ganar(c.id, { estacionId: e.id });
    vibrar([200, 120, 200]); // caminando: solo vibra; el sobre espera en el álbum
    aviso(t('sobre.caminando', { nombre: texto(c).nombre }), 4500);
    await onLlegada(c.id, { simulado });
  } else if (nueva) {
    aviso(t('mapa.llegaste', { est: e.nombre }));
  }
  if (!$('#v-mapa').hidden) pintar();
}

export function simular(e) {
  ponerPosicion({ lat: e.lat, lon: e.lon, precision: 8, altitud: e.altura });
  return llegar(e, { simulado: true });
}

// Curvas de nivel generadas alrededor del volcán: dan textura de mapa sin descargar teselas.
function curvas(cx, cy, escala) {
  let s = '';
  for (let k = 1; k <= 22; k++) {
    const r = k * 26 * escala;
    let d = '';
    for (let a = 0; a <= 64; a++) {
      const ang = (a / 64) * Math.PI * 2;
      const ruido = 1 + 0.08 * Math.sin(ang * 3 + k) + 0.05 * Math.sin(ang * 5 - k * 1.7) + 0.03 * Math.cos(ang * 9 + k * 0.6);
      const x = cx + Math.cos(ang) * r * ruido * 1.15, y = cy + Math.sin(ang) * r * ruido * 0.9;
      d += `${a ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    s += `<path class="curva${k % 4 === 0 ? ' maestra' : ''}" d="${d}Z"/>`;
  }
  return s;
}

export function pintar() {
  const ests = estaciones();
  const v = E.paquete.volcan;
  const pts = ests.map((e) => [e.lat, e.lon]);
  const cerca = E.posicion && Math.min(...ests.map((e) => distancia(E.posicion, e))) < 1500;
  if (cerca) pts.push([E.posicion.lat, E.posicion.lon]);
  const la = pts.map((p) => p[0]), lo = pts.map((p) => p[1]);
  const [minLa, maxLa, minLo, maxLo] = [Math.min(...la), Math.max(...la), Math.min(...lo), Math.max(...lo)];
  const esc2 = Math.min(200 / ((maxLo - minLo) || 1e-3), 320 / ((maxLa - minLa) || 1e-3));
  const xy = (a, o) => [80 + (o - minLo) * esc2, 60 + (maxLa - a) * esc2];
  const [vx, vy] = xy(v.lat, v.lon);
  const mPorGrado = 111320;
  let s = `<rect class="pliego-fondo" width="360" height="440"/>`;
  // El centro de las curvas se acerca al pliego para que el relieve cubra todo el mapa.
  const cx = Math.min(460, Math.max(-100, vx)), cy = Math.min(560, Math.max(-120, vy));
  s += `<g class="curvas">${curvas(cx, cy, 1)}</g>`;
  s += `<g class="pliegues"><path d="M120 0 V440 M240 0 V440 M0 220 H360"/></g>`;
  const camino = ests.map((e) => xy(e.lat, e.lon));
  s += `<path class="ruta-sombra" d="M${camino.map((p) => p.join(' ')).join(' L')}"/>`;
  s += `<path class="ruta" d="M${camino.map((p) => p.join(' ')).join(' L')}"/>`;
  if (vx > -40 && vx < 400 && vy > -40 && vy < 480) s += `<g class="volcan" transform="translate(${Math.min(330, Math.max(30, vx))} ${Math.min(420, Math.max(20, vy))})"><path d="M-14 8 L-4 -10 H4 L14 8Z"/><text y="22" text-anchor="middle">${esc(v.nombre)}</text></g>`;
  ests.forEach((e, i) => {
    const [x, y] = camino[i];
    const r = Math.max(10, (e.radio / mPorGrado) * esc2);
    const hecha = E.visitadas[e.id];
    const izq = x > 210;
    s += `<circle class="geo" cx="${x}" cy="${y}" r="${r}"/>`;
    s += `<g class="pin${hecha ? ' hecha' : ''}" transform="translate(${x} ${y})"><circle r="12"/><text y="4.5" text-anchor="middle">${i + 1}</text></g>`;
    s += `<text class="pin-nombre" x="${izq ? x - 18 : x + 18}" y="${y + 4}" text-anchor="${izq ? 'end' : 'start'}">${esc(e.nombre)}</text>`;
  });
  if (cerca) { const [x, y] = xy(E.posicion.lat, E.posicion.lon); s += `<g class="yo" transform="translate(${x} ${y})"><circle class="yo-onda" r="10"/><circle r="7"/><title>${esc(t('mapa.aqui'))}</title></g>`; }
  else if (E.posicion) s += `<text class="nota-mapa" x="180" y="425" text-anchor="middle">${esc(t('mapa.lejos'))}</text>`;
  $('#mapa').innerHTML = s;

  const ol = $('#estaciones');
  ol.innerHTML = '';
  ests.forEach((e, i) => {
    const c = cromos().find((k) => k.tipo === 'gps' && k.estacion === e.id);
    const hecha = E.visitadas[e.id] || (c && tiene(c.id));
    const d = E.posicion ? fmtDist(distancia(E.posicion, e), E.lang) : '—';
    const li = h(`<li class="${hecha ? 'hecha' : ''}">
        <span class="est-num">${i + 1}</span>
        <span class="est-txt"><b>${esc(e.nombre)}</b>${e.porConfirmar ? `<small>${esc(t('mapa.porConfirmar'))}</small>` : ''}<small>${e.altura ? `${e.altura.toLocaleString(E.lang === 'es' ? 'es-CO' : 'en-US')} m` : ''}</small></span>
        <span class="est-dist">${hecha ? esc(t('mapa.visitada')) : esc(d)}</span>
      </li>`);
    if (E.ajustes.demo && !hecha) {
      const b = h(`<button class="btn btn-linea btn-mini">${esc(t('mapa.simular'))}</button>`);
      b.onclick = () => simular(e);
      li.appendChild(b);
    }
    ol.appendChild(li);
  });
}

export function entrar() {
  iniciarGPS();
  pintar();
  animar($('.pliego'), [
    { transform: 'perspective(900px) rotateX(55deg) scaleY(.6)', opacity: 0, clipPath: 'inset(0 0 60% 0)' },
    { transform: 'perspective(900px) rotateX(0) scaleY(1)', opacity: 1, clipPath: 'inset(0 0 0 0)' },
  ], { duration: 560, easing: 'cubic-bezier(.2,.8,.25,1)' });
}
