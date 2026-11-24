// Portada del álbum (primera vez): nombre del dueño, idioma y estado sin señal. Se abre como un libro.
import { E, guardar } from './estado.js';
import { t, traducir } from './i18n.js';
import { $, h, esc, animar, reducido, vibrar } from './util.js';
import { personajes } from './art.js';

// ¿Está todo guardado para usar en modo avión? (revisa que el modelo esté en la caché)
export async function listoOffline() {
  if (!('caches' in window)) return false;
  try {
    for (const k of await caches.keys()) {
      if (!k.startsWith('album-paramo-')) continue;
      const c = await caches.open(k);
      const man = await c.match('models/partes.json', { ignoreSearch: true });
      if (!man) continue;
      const partes = Object.values(await man.json()).flatMap((m) => m.partes);
      let todas = partes.length > 0;
      for (const p of partes) if (!(await c.match(p, { ignoreSearch: true }))) { todas = false; break; }
      if (todas) return true;
    }
  } catch (e) { /* sin caché */ }
  return false;
}

export function mostrarPortada({ alAbrir, alCambiarIdioma }) {
  return new Promise((ok) => {
    const capa = $('#capa-portada');
    const pintar = () => {
      capa.innerHTML = '';
      const tapa = h(`<div class="tapa">
          <div class="tapa-idioma" role="group" aria-label="Idioma / Language">
            <button data-l="es" aria-pressed="${E.lang === 'es'}">Español</button>
            <button data-l="en" aria-pressed="${E.lang === 'en'}">English</button>
          </div>
          <div class="tapa-arte" aria-hidden="true">
            <span class="tapa-pj tapa-condor">${personajes.condor(70)}</span>
            <span class="tapa-pj tapa-fray">${personajes.fray(120)}</span>
            <span class="tapa-pj tapa-magma">${personajes.magma(78)}</span>
          </div>
          <h1 class="tapa-titulo">${esc(t('titulo'))}</h1>
          <p class="tapa-parque">${esc(t('parque'))}</p>
          <p class="tapa-lema">${esc(t('portada.lema'))}</p>
          <form class="tapa-dueno">
            <label for="tapa-nombre">${esc(t('portada.es'))}</label>
            <input id="tapa-nombre" maxlength="24" autocomplete="given-name" placeholder="${esc(t('portada.nombre'))}" value="${esc(E.nombre)}">
            <button class="btn btn-flor btn-grande">${esc(t('portada.abrir'))}</button>
          </form>
          <p class="tapa-offline" id="tapa-offline"><span class="punto"></span><span class="txt"></span></p>
          <p class="tapa-permisos">${esc(t('portada.permisos'))}</p>
        </div>`);
      capa.appendChild(tapa);
      tapa.querySelectorAll('[data-l]').forEach((b) => (b.onclick = async () => {
        E.nombre = $('#tapa-nombre').value.trim();
        E.lang = b.dataset.l; await guardar(); alCambiarIdioma(); pintar();
      }));
      tapa.querySelector('form').onsubmit = async (e) => {
        e.preventDefault();
        E.nombre = $('#tapa-nombre').value.trim();
        E.portadaVista = true;
        await guardar();
        vibrar(30);
        alAbrir();
        await abrirTapa(tapa);
        capa.hidden = true; capa.innerHTML = '';
        ok();
      };
      estadoOffline();
    };
    capa.hidden = false;
    pintar();
  });
}

async function abrirTapa(tapa) {
  if (reducido()) return;
  tapa.style.transformOrigin = 'left center';
  $('#capa-portada').classList.add('abriendo');
  await animar(tapa, [
    { transform: 'perspective(1600px) rotateY(0deg)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
    { transform: 'perspective(1600px) rotateY(-28deg)', boxShadow: '30px 0 60px rgba(0,0,0,.35)', offset: 0.35 },
    { transform: 'perspective(1600px) rotateY(-105deg)', boxShadow: '60px 0 80px rgba(0,0,0,0)' },
  ], { duration: 900, easing: 'cubic-bezier(.55,.05,.35,1)', fill: 'forwards' });
  $('#capa-portada').classList.remove('abriendo');
}

let progreso = null;
export function progresoOffline(p) { progreso = p; estadoOffline(); }

export async function estadoOffline() {
  const el = $('#tapa-offline');
  if (!el) return;
  const txt = el.querySelector('.txt');
  if (await listoOffline()) { el.className = 'tapa-offline listo'; txt.textContent = t('portada.offline.listo'); return; }
  if (progreso !== null) { el.className = 'tapa-offline cargando'; txt.textContent = t('portada.offline.cargando', { p: Math.round(progreso * 100) }); return; }
  el.className = 'tapa-offline'; txt.textContent = t('portada.offline.no');
}
