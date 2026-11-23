// Exporta un cromo (frente + dato oficial) o el álbum completo como imagen PNG.
import { E, cromo as getCromo, texto, fotoBlob, estacion, capitulos, cromosDe, abierto, total, pegados } from './estado.js';
import { ilustracion, personajes } from './art.js';
import { t } from './i18n.js';
import { fecha, alturaTxt, num } from './cromo.js';

const C = { papel: '#e6ece8', papel2: '#f1f4f1', verde: '#2f6b4f', amarillo: '#f4c431', noche: '#1d2b38', sello: '#d8492b', gris: '#5d6f68' };
const ESTILO = `<style>.ink-y{fill:${C.amarillo}}.ink-g{fill:${C.verde};mix-blend-mode:multiply}.ink-p{fill:${C.papel2}}.l{fill:none!important;stroke-width:3;stroke-linecap:round}.ink-y .l{stroke:${C.amarillo}}.ink-g .l{stroke:${C.verde}}.ink-p .l{stroke:${C.papel2};stroke-width:2.2}</style>`;

function svgImg(svg) {
  return new Promise((ok, mal) => {
    const limpio = svg.replace(/^(<svg[^>]*?) width="[^"]*"/, '$1').replace(/^(<svg[^>]*?) height="[^"]*"/, '$1');
    const s = limpio.replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" `).replace('>', `>${ESTILO}`);
    const img = new Image(); img.onload = () => ok(img); img.onerror = mal;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  });
}
function blobImg(b) {
  return new Promise((ok, mal) => { const u = URL.createObjectURL(b); const i = new Image(); i.onload = () => { ok(i); URL.revokeObjectURL(u); }; i.onerror = mal; i.src = u; });
}
async function fuentes() {
  await Promise.all(['800 90px Bricolage', '700 40px Bricolage', '400 30px Atkinson', '700 30px Atkinson'].map((f) => document.fonts.load(f.replace('Bricolage', '"Bricolage Grotesque"').replace('Atkinson', '"Atkinson Hyperlegible"')))).catch(() => {});
}
function lineas(ctx, txt, x, y, ancho, alto, max = 5) {
  const pal = txt.split(' '); let l = '', n = 0;
  for (const p of pal) {
    const prueba = l ? `${l} ${p}` : p;
    if (ctx.measureText(prueba).width > ancho && l) { ctx.fillText(l, x, y + n * alto); n++; l = p; if (n >= max) return y + n * alto; }
    else l = prueba;
  }
  if (l) { ctx.fillText(l, x, y + n * alto); n++; }
  return y + n * alto;
}
function cubrir(ctx, img, x, y, w, h) {
  const s = Math.max(w / img.width, h / img.height);
  ctx.drawImage(img, x + (w - img.width * s) / 2, y + (h - img.height * s) / 2, img.width * s, img.height * s);
}
function troquel(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  for (let i = x + r * 2; i < x + w - r; i += r * 4.4) { ctx.beginPath(); ctx.arc(i, y, r, 0, 7); ctx.arc(i, y + h, r, 0, 7); ctx.fill(); }
  for (let j = y + r * 2; j < y + h - r; j += r * 4.4) { ctx.beginPath(); ctx.arc(x, j, r, 0, 7); ctx.arc(x + w, j, r, 0, 7); ctx.fill(); }
}

// Dibuja el frente de un cromo en (x, y) con ancho w (alto = w * 4/3).
async function frente(ctx, id, x, y, w) {
  const c = getCromo(id), r = E.album[id], tx = texto(c), hgt = w * 4 / 3, u = w / 100;
  ctx.save();
  ctx.fillStyle = C.papel2; ctx.beginPath(); ctx.roundRect(x, y, w, hgt, 3 * u); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.roundRect(x + 4 * u, y + 4 * u, w - 8 * u, hgt - 30 * u, 2 * u); ctx.clip();
  const foto = r?.foto ? await fotoBlob(id) : null;
  if (foto) cubrir(ctx, await blobImg(foto), x + 4 * u, y + 4 * u, w - 8 * u, hgt - 30 * u);
  else { ctx.fillStyle = '#dfe7e2'; ctx.fillRect(x, y, w, hgt); ctx.drawImage(await svgImg(ilustracion(id)), x + 10 * u, y + 10 * u, w - 20 * u, w - 20 * u); }
  ctx.restore();
  if (c.brillante) {
    const g = ctx.createLinearGradient(x, y, x + w, y + hgt);
    ['rgba(255,120,200,.0)', 'rgba(120,220,255,.28)', 'rgba(255,240,120,.30)', 'rgba(160,255,190,.26)', 'rgba(255,120,200,.0)'].forEach((s, i) => g.addColorStop(i / 4, s));
    ctx.fillStyle = g; ctx.fillRect(x + 4 * u, y + 4 * u, w - 8 * u, hgt - 30 * u);
  }
  ctx.fillStyle = C.amarillo; ctx.fillRect(x, y + hgt - 26 * u, w, 26 * u);
  ctx.fillStyle = C.verde; ctx.font = `800 ${17 * u}px "Bricolage Grotesque"`; ctx.fillText(num(c.n), x + 5 * u, y + hgt - 8 * u);
  ctx.fillStyle = C.noche; ctx.font = `700 ${8.4 * u}px "Bricolage Grotesque"`;
  lineas(ctx, tx.nombre, x + 27 * u, y + hgt - 15 * u, w - 32 * u, 8.6 * u, 2);
  if (r) {
    ctx.save(); ctx.translate(x + w - 19 * u, y + 19 * u); ctx.rotate(-0.2); ctx.globalAlpha = 0.9;
    ctx.strokeStyle = C.sello; ctx.fillStyle = C.sello; ctx.lineWidth = 1.6 * u;
    ctx.beginPath(); ctx.arc(0, 0, 13 * u, 0, 7); ctx.stroke(); ctx.lineWidth = 0.7 * u; ctx.beginPath(); ctx.arc(0, 0, 10.5 * u, 0, 7); ctx.stroke();
    ctx.textAlign = 'center'; ctx.font = `700 ${4.6 * u}px "Atkinson Hyperlegible"`; ctx.fillText(alturaTxt(r), 0, -0.5 * u);
    ctx.font = `700 ${3.4 * u}px "Atkinson Hyperlegible"`; ctx.fillText(fecha(r.fecha), 0, 4.6 * u); ctx.restore();
  }
  ctx.restore();
}

export async function cromoPNG(id) {
  await fuentes();
  const c = getCromo(id), r = E.album[id], tx = texto(c);
  const W = 1080, H = 1620, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fontStretch = 'condensed';
  ctx.fillStyle = C.papel; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.verde; ctx.font = '800 54px "Bricolage Grotesque"'; ctx.fillText(t('titulo'), 80, 100);
  ctx.fillStyle = C.gris; ctx.font = '400 28px "Atkinson Hyperlegible"'; ctx.fillText(`${t('parque')}${E.nombre ? ' — ' + t('de', { nombre: E.nombre }) : ''}`, 80, 142);
  ctx.save(); ctx.shadowColor = 'rgba(29,43,56,.25)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  await frente(ctx, id, 190, 190, 700); ctx.restore();
  troquel(ctx, 190, 190, 700, 933, 6, C.papel);
  let y = 1210;
  ctx.fillStyle = C.gris; ctx.font = '700 26px "Atkinson Hyperlegible"'; ctx.fillText(t('det.datoOficial'), 100, y);
  ctx.fillStyle = C.noche; ctx.font = '400 38px "Atkinson Hyperlegible"'; y = lineas(ctx, tx.dato, 100, y + 52, 880, 50, 4);
  const f = c.fuente ? E.paquete.fuentes[c.fuente] : null;
  ctx.fillStyle = C.gris; ctx.font = '400 24px "Atkinson Hyperlegible"';
  const est = r?.estacion ? estacion(r.estacion) : null;
  lineas(ctx, [f ? t('det.fuente', { f: f.titulo }) : null, est ? est.nombre : null].filter(Boolean).join(' — '), 100, Math.min(y + 24, H - 70), 880, 30, 2);
  return new Promise((ok) => cv.toBlob(ok, 'image/png'));
}

export async function albumPNG() {
  await fuentes();
  const cols = 6, cw = 220, gap = 24, W = 80 * 2 + cols * cw + (cols - 1) * gap;
  const caps = capitulos();
  let filas = 0; for (const k of caps) filas += Math.ceil(cromosDe(k.id).length / cols);
  const ch = cw * 4 / 3, H = 260 + filas * (ch + gap) + caps.length * 80 + 80;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  ctx.fontStretch = 'condensed';
  ctx.fillStyle = C.papel; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.verde; ctx.font = '800 84px "Bricolage Grotesque"'; ctx.fillText(t('titulo'), 80, 120);
  ctx.fillStyle = C.noche; ctx.font = '400 32px "Atkinson Hyperlegible"';
  ctx.fillText(`${t('parque')}${E.nombre ? ' — ' + t('de', { nombre: E.nombre }) : ''} — ${t('album.pegados', { n: pegados(), t: total() })}`, 80, 172);
  let y = 230;
  for (const k of caps) {
    ctx.fillStyle = C.verde; ctx.font = '800 34px "Bricolage Grotesque"'; ctx.fillText(`${k.num}  ${k[E.lang]}`, 80, y + 34); y += 60;
    const lista = cromosDe(k.id);
    for (let i = 0; i < lista.length; i++) {
      const x = 80 + (i % cols) * (cw + gap), yy = y + Math.floor(i / cols) * (ch + gap);
      if (abierto(lista[i].id)) await frente(ctx, lista[i].id, x, yy, cw);
      else {
        ctx.strokeStyle = 'rgba(47,107,79,.35)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x, yy, cw, ch, 10); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(47,107,79,.35)'; ctx.font = '800 48px "Bricolage Grotesque"'; ctx.fillText(num(lista[i].n), x + 18, yy + 60);
      }
    }
    y += Math.ceil(lista.length / cols) * (ch + gap) + 20;
  }
  ctx.drawImage(await svgImg(personajes.fray(100)), W - 230, 30, 150, 165);
  return new Promise((ok) => cv.toBlob(ok, 'image/png'));
}

export function descargar(blob, nombre) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
