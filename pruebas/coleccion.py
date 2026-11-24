"""Prueba real de la colección completa: cada cromo se gana por la interfaz, como un visitante."""
import json, time, shutil, os, sys
from playwright.sync_api import sync_playwright
URL = 'http://localhost:8765/'
PERFIL = '/tmp/perfil-paramo'; shutil.rmtree(PERFIL, ignore_errors=True)
S = '/home/claude/shots3'; shutil.rmtree(S, ignore_errors=True); os.makedirs(S)
paq = json.load(open('/home/claude/app/paquete.json'))
EST = {e['id']: e for e in paq['estaciones']}
logs, pasos = [], []
def ok(msg): pasos.append(msg); print('OK', msg, flush=True)

def sesion(p, video=None):
    args = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
    if video: args.append(f'--use-file-for-fake-video-capture=/tmp/vid/{video}.y4m')
    ctx = p.chromium.launch_persistent_context(PERFIL, executable_path='/usr/bin/google-chrome', headless=True, args=args,
        viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='es-CO', accept_downloads=True,
        permissions=['camera', 'geolocation'], geolocation={'latitude': 4.96, 'longitude': -75.38, 'accuracy': 12})
    pg = ctx.pages[0] if ctx.pages else ctx.new_page()
    pg.on('console', lambda m: logs.append(f'[{m.type}] {m.text}') if m.type in ('error', 'warning') and 'vibrate' not in m.text else None)
    pg.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
    pg.on('dialog', lambda d: d.accept())
    pg.goto(URL); pg.wait_for_function('window.__paramo && window.__paramo.E.paquete', timeout=20000)
    pg.wait_for_timeout(600)
    return ctx, pg

pegados = lambda pg: pg.evaluate('window.__paramo.est.pegados()')
pendientes = lambda pg: pg.evaluate('window.__paramo.est.pendientes().length')

def abrir_todo(pg):
    n = 0
    while True:
        try: pg.wait_for_selector('#capa-sobre:not([hidden]) .sobre', timeout=5000)
        except Exception: break
        pg.wait_for_timeout(650)
        pg.click('#capa-sobre .sobre', force=True)
        pg.wait_for_selector('#capa-sobre [data-a="pegar"]:visible', timeout=12000)
        pg.click('#capa-sobre [data-a="pegar"]')
        n += 1
        pg.wait_for_timeout(1700)
    return n

def equipo(pg):
    pg.click('.muelle [data-vista="album"]'); pg.wait_for_timeout(300)
    pg.click('.muelle [data-accion="ajustes"]'); pg.click('#aj-equipo'); pg.wait_for_timeout(500)
    for d in '2611': pg.click(f'.teclado [data-k="{d}"]')
    pg.wait_for_selector('#v-equipo:not([hidden]) #clases .clase', timeout=30000)
    pg.wait_for_function("document.querySelector('#video-eq') && document.querySelector('#video-eq').videoWidth > 0", timeout=15000)

def entrenar(pg, clase, n=8):
    for _ in range(n):
        pg.click(f'#clases [data-c="{clase}"]'); pg.wait_for_timeout(380)
    c = pg.evaluate('window.__paramo.ml.counts()')
    assert c.get(clase, 0) >= n, c
    return c

def ir_lente(pg, modo=None):
    pg.click('.muelle [data-vista="lente"]')
    if modo == 'qr': pg.click('.lente-modo [data-modo="qr"]')
    pg.wait_for_function("document.querySelector('#video').videoWidth > 0", timeout=15000)

with sync_playwright() as p:
    # ===== Sesión 1: portada, GPS caminando, códigos, pausa, grupo, foto =====
    ctx, pg = sesion(p, 'otro')
    pg.wait_for_selector('#capa-portada:not([hidden]) .tapa', timeout=10000)
    pg.fill('#tapa-nombre', 'Valentina'); pg.click('.tapa-dueno button'); pg.wait_for_timeout(1300)
    assert pg.is_hidden('#capa-portada'); ok('portada: nombre guardado y el álbum se abre')
    equipo(pg); print('  muestras', entrenar(pg, 'otro')); ok('Modo equipo con PIN y entrenamiento de «Otra cosa»')
    # Una sola clase entrenada: la Lente NO debe ofrecer cromos (corrección del falso positivo)
    ir_lente(pg); pg.wait_for_timeout(3000)
    assert pg.is_hidden('#lente-abrir'); ok('con una sola clase la Lente no inventa cromos')
    pg.click('.muelle [data-vista="album"]')

    # Caminar por el sendero: llegar a cada estación (GPS se activó solo porque el permiso ya estaba)
    for i, eid in enumerate(['e1', 'e2', 'e3', 'e4']):
        e = EST[eid]
        for frac in (0.004, 0.0015, 0.0002):
            ctx.set_geolocation({'latitude': e['lat'] + frac, 'longitude': e['lon'], 'accuracy': 10}); pg.wait_for_timeout(700)
        pg.wait_for_function(f'window.__paramo.est.pendientes().length >= {i + 1}', timeout=10000)
        assert pg.is_hidden('#capa-sobre'), 'caminando no debe abrir el sobre'
    pg.screenshot(path=f'{S}/01_sobres_pendientes.png')
    ok(f'GPS: 4 estaciones -> {pendientes(pg)} sobres esperando, sin interrumpir la caminata')
    pg.click('#btn-sobres'); n = abrir_todo(pg); assert n == 4 and pegados(pg) == 4, (n, pegados(pg)); ok('se abren y pegan los 4 sobres del GPS')

    # Códigos del guía
    pg.click('.pestana:nth-child(4)'); pg.wait_for_timeout(800)
    for c in [c for c in paq['cromos'] if c['tipo'] == 'guia']:
        pg.click(f'.ranura[data-id="{c["id"]}"]'); pg.wait_for_selector('#codigo-in')
        if c['id'] == 'agua':
            pg.fill('#codigo-in', '0000'); pg.click('.codigo button'); pg.wait_for_timeout(400)
            assert pg.is_visible('#codigo-in'), 'código incorrecto no debe desbloquear'
        pg.fill('#codigo-in', c['codigo']); pg.click('.codigo button'); assert abrir_todo(pg) == 1
    assert pegados(pg) == 8; ok('4 códigos del guía (y rechaza el incorrecto)')

    # Foto de grupo (ya hay más de 3)
    pg.click('.pestana:nth-child(1)'); pg.wait_for_timeout(800)
    pg.click('.ranura[data-id="grupo"]'); pg.click('.como-accion .btn-flor'); pg.wait_for_selector('#disparar:visible', timeout=10000)
    pg.wait_for_function("document.querySelector('#video').videoWidth > 0", timeout=10000)
    pg.screenshot(path=f'{S}/02_foto_grupo.png'); pg.click('#disparar'); assert abrir_todo(pg) == 1; ok('foto de grupo con la cámara')

    # Ponerle mi foto a un cromo del guía
    pg.click('.pestana:nth-child(4)'); pg.wait_for_timeout(800); pg.click('.ranura[data-id="agua"]'); pg.wait_for_timeout(400)
    pg.click('[data-a="foto"]'); pg.wait_for_selector('#disparar:visible'); pg.wait_for_function("document.querySelector('#video').videoWidth > 0"); pg.click('#disparar')
    pg.wait_for_selector('#capa-detalle:not([hidden]) .cromo.grande', timeout=10000)
    assert pg.evaluate("window.__paramo.E.album.agua.foto"); pg.click('.cerrar-x'); ok('«Ponerle mi foto» reemplaza la ilustración con la foto')

    # Pausa de contemplación: tocar reinicia; 2 minutos reales sin tocar la desbloquean
    pg.click('.pestana:nth-child(1)'); pg.wait_for_timeout(800)
    pg.click('.ranura[data-id="mirada"]'); pg.click('.como-accion .btn-flor'); pg.wait_for_timeout(5000)
    pg.mouse.click(195, 300); pg.wait_for_timeout(300)
    assert 'empezamos de nuevo' in pg.inner_text('#pausa-estado'); t0 = time.time()
    pg.screenshot(path=f'{S}/03_pausa.png')
    pg.wait_for_selector('#capa-sobre:not([hidden]) .sobre', timeout=135000)
    print(f'  pausa completada en {time.time() - t0:.0f} s'); assert abrir_todo(pg) == 1; ok('pausa de 2 minutos (tocar la pantalla reinicia)')
    assert pegados(pg) == 10, pegados(pg)
    ctx.close()

    # ===== Sesiones de cámara: una por clase (enseñar en Modo equipo y luego ganar con la Lente) =====
    for clase in ['frailejon', 'pajonal', 'sietecueros', 'musgo', 'laguna', 'roca', 'nevado']:
        ctx, pg = sesion(p, clase)
        equipo(pg); entrenar(pg, clase)
        veces = 2 if clase == 'frailejon' else 1
        for _ in range(veces):
            ir_lente(pg)
            pg.wait_for_selector('#lente-abrir:not([hidden]):not([disabled])', timeout=25000)
            conf = pg.inner_text('#lente-chip')
            if clase == 'frailejon': pg.screenshot(path=f'{S}/04_lente_fija.png')
            pg.click('#lente-abrir'); assert abrir_todo(pg) == 1
        ok(f'Lente: {clase} reconocido ({conf}) y pegado' + (' + «Abrir sobre» para el segundo frailejón' if veces == 2 else ''))
        ctx.close()

    # ===== Imagen que no está entrenada: no debe dar cromo =====
    ctx, pg = sesion(p, 'desconocido'); ir_lente(pg); pg.wait_for_timeout(5000)
    assert pg.is_hidden('#lente-abrir') or pg.is_disabled('#lente-abrir')
    msg = pg.inner_text('#lente-msg'); pg.screenshot(path=f'{S}/05_lente_duda.png'); ctx.close()
    ok(f'imagen desconocida -> «{msg}»')

    # ===== QR: los 6 de fauna =====
    ctx, pg = sesion(p, 'qr')
    for i in range(6):
        ir_lente(pg, 'qr')
        pg.wait_for_selector('#capa-sobre:not([hidden]) .sobre', timeout=30000)
        assert abrir_todo(pg) == 1
    ok('6 QR de fauna leídos con la cámara')
    total = pegados(pg); print('  pegados', total)
    assert total == 24, total
    pg.wait_for_selector('#capa-detalle:not([hidden]) .final', timeout=8000)
    pg.screenshot(path=f'{S}/06_final.png'); ok('24/24 y celebración final')
    with pg.expect_download() as d: pg.click('#final-desc')
    d.value.save_as('/tmp/album.png'); ok('descarga del álbum completo')
    pg.click('#final-cerrar'); ctx.close()

from PIL import Image
print('álbum PNG', Image.open('/tmp/album.png').size)
print(f'\n{len(pasos)} pasos OK')
print('\n'.join(sorted(set(logs))) or 'sin errores en consola')
