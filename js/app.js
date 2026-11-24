// Arranque: carga el estado, arma las vistas y conecta la navegación.
import * as est from './estado.js';
import { E, bus } from './estado.js';
import { t, traducir } from './i18n.js';
import { $, $$, animar, aviso, vibrar, reducido } from './util.js';
import { iniciarAlbum, retraducir, abrirDetalle, cerrarDetalle, pintarCabezote } from './album.js';
import { iniciarSobres, abrirSobres } from './sobre.js';
import * as lente from './lente.js';
import * as mapa from './mapa.js';
import { mostrarPortada, progresoOffline, estadoOffline } from './portada.js';
import { iniciarAjustes, abrirAjustes, aplicarTema, entrarEquipo, salirEquipo, pintarEquipo } from './ajustes.js';
import { lluvia } from './celebrar.js';
import * as ml from './ml.js';
import { iniciarChatUI, entrarChat, retraducirChat, abrirConTema, temaDeCromo, conectarMapa, ofrecerLugar } from './chatui.js';
import { iniciarGuia, entrarGuia, salirGuia } from './guia.js';

let vista = null;

export async function irA(v, opciones = {}) {
  if (vista === v && !opciones.forzar) { if (v === 'lente' && opciones.modo) lente.ponerModo(opciones.modo); return; }
  const antes = vista;
  if (antes === 'lente') lente.salir();
  if (antes === 'equipo') salirEquipo();
  if (antes === 'guia') salirGuia();
  vista = v;
  for (const id of ['album', 'lente', 'mapa', 'chat', 'equipo', 'guia']) $(`#v-${id}`).hidden = id !== v;
  document.body.dataset.vista = v;
  $$('.muelle button').forEach((b) => (b.dataset.vista === v || (v === 'equipo' && b.dataset.vista === 'mapa') ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
  const el = $(`#v-${v}`);
  if (antes && !reducido()) animar(el, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' });
  if (v === 'lente') await lente.entrar(opciones.modo);
  if (v === 'mapa') mapa.entrar();
  if (v === 'equipo') await entrarEquipo();
  if (v === 'album') pintarCabezote();
  if (v === 'chat') entrarChat({ enfocar: !opciones.tema, conTema: !!opciones.tema });
  if (v === 'guia') await entrarGuia();
}

// Pausa de contemplación: 2 minutos sin tocar la pantalla.
function pausa(c) {
  const capa = $('#capa-pausa'), total = c.segundos * 1000;
  let inicio = Date.now(), raf = null;
  capa.hidden = false;
  lente.salir();
  $('#pausa-estado').textContent = t('pausa.regla');
  const reiniciar = (e) => {
    if (e.target.closest('#pausa-salir')) return;
    inicio = Date.now();
    $('#pausa-estado').textContent = t('pausa.reinicio');
    animar($('.anillo'), [{ transform: 'rotate(-90deg) scale(.94)' }, { transform: 'rotate(-90deg) scale(1)' }], { duration: 300 });
  };
  const fin = () => { cancelAnimationFrame(raf); clearInterval(tick); capa.hidden = true; capa.removeEventListener('pointerdown', reiniciar); };
  const ganada = async () => { fin(); await est.ganar(c.id); abrirSobres(); };
  capa.addEventListener('pointerdown', reiniciar);
  $('#pausa-salir').onclick = fin;
  const anillo = $('#pausa-avance');
  const pintar = () => {
    const pasado = Date.now() - inicio;
    const f = Math.min(1, pasado / total);
    anillo.style.strokeDashoffset = String(326.7 * (1 - f));
    const resta = Math.max(0, Math.ceil((total - pasado) / 1000));
    $('#pausa-tiempo').textContent = `${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, '0')}`;
    return f >= 1;
  };
  const paso = () => { if (pintar()) { ganada(); return; } raf = requestAnimationFrame(paso); };
  // Con la pantalla apagada no hay cuadros de animación: también se revisa con un reloj.
  const tick = setInterval(() => { if (pintar()) ganada(); }, 1000);
  raf = requestAnimationFrame(paso);
}

async function despuesDeGanar(id, { soloFoto = false } = {}) {
  if (soloFoto) { await irA('album'); abrirDetalle(id); return; }
  await abrirSobres();
}

function celebrar() {
  bus.addEventListener('capitulo', (e) => {
    const k = est.capitulos().find((c) => c.id === e.detail.cap);
    setTimeout(() => { aviso(t('cel.capitulo', { cap: k[E.lang] }), 3500); lluvia(2200); vibrar([60, 60, 60, 60, 120]); }, 400);
  });
  bus.addEventListener('completo', () => {
    setTimeout(() => { lluvia(4200); mostrarFinal(); }, 900);
  });
}

async function mostrarFinal() {
  const { albumPNG, descargar } = await import('./exportar.js');
  const capa = $('#capa-detalle');
  capa.innerHTML = `<div class="detalle final">
      <p class="final-sello">24/24</p>
      <h2>${t('cel.final')}</h2>
      <p>${t('cel.finalSub')}</p>
      <div class="acciones"><button class="btn btn-flor" id="final-desc">${t('cel.descargar')}</button><button class="btn btn-linea" id="final-cerrar">${t('cerrar')}</button></div>
    </div>`;
  capa.hidden = false;
  $('#final-desc').onclick = async () => descargar(await albumPNG(), 'album-del-paramo.png');
  $('#final-cerrar').onclick = () => cerrarDetalle();
}

async function iniciar() {
  await est.cargar();
  aplicarTema();
  traducir();
  // Precarga de la IA en segundo plano (en el worker: no congela la pantalla).
  // En la primera visita se espera a que termine de guardarse para usar sin señal: si no, los modelos
  // se descargarían dos veces a la vez (una para usarlos y otra para guardarlos) y todo iría lento.
  let precargada = false;
  const precargar = () => {
    if (precargada) return;
    precargada = true;
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1));
    setTimeout(() => idle(async () => {
      await ml.load().catch(() => {});
      // El chat también, si el teléfono tiene memoria de sobra (deviceMemory solo existe en Chrome)
      if ((navigator.deviceMemory ?? 4) >= 3) import('./chat.js').then((c) => c.cargar()).catch(() => {});
    }), 1500);
  };
  if (navigator.serviceWorker?.controller) precargar();

  // Unión Lente/álbum → chat: abre «Pregúntale a Fray» hablando de ese cromo
  async function preguntarSobre(id, opc = {}) {
    const tema = temaDeCromo(id);
    if (!tema) return;
    await irA('chat', { tema: true, forzar: vista === 'chat' });
    await abrirConTema(tema, opc);
  }
  const acciones = {
    preguntar: (id) => preguntarSobre(id),
    abrirSobres: () => abrirSobres(),
    abrirLente: (m) => irA('lente', { modo: m, forzar: vista === 'lente' }),
    pedirFoto: (id, msg) => { lente.pedirFoto(id, msg); irA('lente', { modo: 'foto', forzar: true }); },
    pausa,
    simular: (e) => mapa.simular(e),
  };
  iniciarAlbum({ irA, acciones });
  iniciarGuia({ irA });
  iniciarSobres({ irA, preguntar: (id) => preguntarSobre(id) });
  lente.iniciarLente({ onGanar: despuesDeGanar, onPreguntar: (id, { clase, confianza }) => preguntarSobre(id, { intro: t('chat.lenteVe', { cosa: est.nombreClase(clase).toLowerCase(), p: Math.round(confianza * 100) }) }) });
  mapa.iniciarMapa({
    llegada: async (id, { simulado }) => { pintarCabezote(); if (simulado && vista === 'album') abrirSobres(); },
    preguntar: (id) => preguntarSobre(id),
    // Abrir el chat sobre una ficha que no es de un cromo (p. ej. el mal de altura desde la bitácora)
    preguntarFicha: async (ficha) => {
      const temas = { mal_altura: { es: 'el mal de altura', en: 'altitude sickness' } };
      await irA('chat', { tema: true, forzar: vista === 'chat' });
      await abrirConTema({ id: ficha, ficha, ...(temas[ficha] || { es: ficha, en: ficha }) });
    },
    abrirSobres: () => abrirSobres(),
    // Al llegar a una estación, la próxima vez que se abra el chat ofrece hablar de ese lugar
    alLlegar: (e, c) => { const tm = c && temaDeCromo(c.id); if (tm) ofrecerLugar(tm, t('chat.llegasteA', { est: e.nombre })); },
  });
  conectarMapa(async (lugar) => { await irA('mapa'); await mapa.mostrar(lugar); });
  iniciarAjustes({ irA, alCambiar: () => { retraducir(); retraducirChat(); if (vista === 'mapa') mapa.pintar(); if (vista === 'equipo') pintarEquipo(); if (vista === 'guia') entrarGuia(); } });
  celebrar();

  $$('.muelle button[data-vista]').forEach((b) => (b.onclick = () => irA(b.dataset.vista)));
  $('.muelle [data-accion="ajustes"]').onclick = abrirAjustes;
  iniciarChatUI();

  if (!('serviceWorker' in navigator)) precargar();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data?.tipo === 'progreso') progresoOffline(e.data.p);
      if (e.data?.tipo === 'listo') { progresoOffline(1); estadoOffline(); precargar(); }
      if (e.data?.tipo === 'error') import('./motor.js').then((m) => m.anotar('Guardar para usar sin señal', e.data.detalle));
    });
    // Si ya había una versión guardada y llega una nueva, recargar una sola vez para mostrarla
    const habiaVersion = !!navigator.serviceWorker.controller;
    let recargado = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (habiaVersion && !recargado) { recargado = true; location.reload(); }
    });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .then((reg) => { if (reg.active) reg.update().catch(() => {}); })
      .catch((e) => console.warn('SW', e));
  }
  import('./db.js').then((db) => db.persist());

  await irA('album');
  if (!E.portadaVista) {
    await mostrarPortada({ alAbrir: () => pintarCabezote(), alCambiarIdioma: () => retraducir() });
  }
  // Las geocercas funcionan en cualquier pantalla, pero el permiso solo se pide al abrir el Mapa
  // (o se activa solo si el visitante ya lo había dado).
  try { const pr = await navigator.permissions?.query({ name: 'geolocation' }); if (pr?.state === 'granted') mapa.iniciarGPS(); } catch (e) { /* sin API */ }
  if (est.pendientes().length) setTimeout(() => aviso(t('album.sobres', { n: est.pendientes().length })), 600);
}

iniciar();

// Para pruebas automáticas
window.__paramo = { E, est, ml, irA, abrirSobres, mapa, chat: () => import('./chat.js') };
