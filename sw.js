// Service worker: guarda toda la app (incluido el modelo de ~9 MB y el motor WASM) para usarla en modo avión.
// Avisa el progreso a la portada para que el visitante sepa cuándo ya puede quedarse sin señal.
const VERSION = 'v10-2026-11-24';
const CACHE = `album-paramo-${VERSION}`;
const APP = [
  './', 'index.html', 'styles.css', 'manifest.json', 'paquete.json',
  'js/app.js', 'js/db.js', 'js/ml.js', 'js/util.js', 'js/estado.js', 'js/i18n.js', 'js/art.js', 'js/cromo.js',
  'js/album.js', 'js/sobre.js', 'js/chat.js', 'js/chatui.js', 'chat.json', 'js/celebrar.js', 'js/lente.js', 'js/mapa.js', 'js/portada.js', 'js/ajustes.js', 'js/exportar.js',
  'js/motor.js', 'lib/ort.wasm.min.js', 'lib/ort-wasm-simd-threaded.js', 'lib/jsQR.js', 'lib/qrcode.js', 'lib/tokenizers.min.js',
  'fonts/bricolage-grotesque-latin-wdth-normal.woff2', 'fonts/atkinson-hyperlegible-latin-400-normal.woff2', 'fonts/atkinson-hyperlegible-latin-700-normal.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png',
  // Chat sin internet: índice de fichas y tokenizador del modelo de lenguaje
  'models/chat_indice.json', 'models/e5_tokenizer.json', 'models/e5_tokenizer_config.json', 'models/partes.json',
  // Los pesados (motor WASM, modelo de visión y modelo de lenguaje) van partidos en trozos de 8 MB:
  // se agregan al final leyendo models/partes.json, así no hay que mantener la lista a mano.
];

async function listaCompleta() {
  const man = await (await fetch('models/partes.json', { cache: 'reload' })).json();
  return [...APP, ...Object.values(man).flatMap((m) => m.partes)];
}

async function avisar(msg) {
  for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(msg);
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const lista = await listaCompleta();
    let hechos = 0;
    for (const url of lista) {
      const ya = await cache.match(url);
      if (!ya) {
        const res = await fetch(url, { cache: 'reload' });
        if (!res.ok) { avisar({ tipo: 'error', url, status: res.status }); throw new Error(`No se pudo guardar ${url} (${res.status})`); }
        await cache.put(url, res);
      }
      hechos++;
      avisar({ tipo: 'progreso', p: hechos / lista.length });
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('album-paramo-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
    avisar({ tipo: 'listo' });
  })());
});

// Primero la caché (funciona sin señal). El paquete de contenido se intenta actualizar cuando hay red.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const esPaquete = req.url.includes('paquete.json');
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit && !esPaquete) return hit;
    try {
      const res = await fetch(req);
      if (res.ok && (esPaquete || (APP.some((u) => req.url.endsWith(u.replace('./', ''))) || req.url.includes('/models/partes/')))) cache.put(req, res.clone());
      return res;
    } catch (e) {
      if (hit) return hit;
      if (req.mode === 'navigate') return cache.match('index.html');
      throw e;
    }
  })());
});
