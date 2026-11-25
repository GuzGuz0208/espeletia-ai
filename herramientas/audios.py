"""Audios pregrabados por idioma: verificar que cada uno lea el texto vigente y sintetizar los que falten (offline, en el PC).

Uso:
  python herramientas/audios.py --check
      Falla si un audio no existe, si el texto que lee cambió (huella distinta), si usa una voz sintética que no está en la
      lista apta para uso comercial o si el manifiesto no cumple docs/contratos/audios.schema.json. Avisa de los no revisados.
  python herramientas/audios.py --huella ficha mal_altura es-CO
      Imprime la huella SHA-256 del texto vigente (para registrar una grabación humana en el manifiesto).
  python herramientas/audios.py --sintetizar es-ES --tipo ficha --ids emergencia,mal_altura
      Genera audios con Piper (motor GPL, solo en el PC; nunca va dentro de la app) y los registra con revisado: false.
      Necesita: pip install piper-tts imageio-ffmpeg (o ffmpeg en el PATH) y la voz descargada en herramientas/voces/.

Decisión: docs/decisiones/2026-11-24-voz-audio-pregrabado.md · Spec: docs/specs/2026-11-24-manifiesto-audios.md
Licencias de las voces: docs/licencias.md §3. es-CO no se sintetiza: se graba con personas.
"""
import argparse, hashlib, json, os, re, shutil, subprocess, sys, unicodedata

AQUI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFIESTO = os.path.join(AQUI, 'audios', 'manifiesto.json')
VOCES_DIR = os.path.join(AQUI, 'herramientas', 'voces')
# Clave del texto en el Paquete para cada idioma de audio
CLAVE = {'es-CO': 'es', 'es-ES': 'es', 'en': 'en', 'fr': 'fr', 'pt-BR': 'pt-BR', 'de': 'de'}
# Voces Piper aptas para uso comercial (lista oficial COMMERCIAL_USE.md de piper1-gpl, verificada el 24-nov-2026)
VOCES = {
    'es-ES': ('es_ES-davefx-medium', 'CC0-1.0'),
    'en': ('en_US-joe-medium', 'CC0-1.0'),
    'fr': ('fr_FR-siwis-medium', 'CC-BY-4.0 (SIWIS + Hi-Fi TTS: atribución)'),
    'pt-BR': ('pt_BR-cadu-medium', 'CC0-1.0'),
}
PERMITIDAS = {'es_ES-davefx-medium', 'es_ES-sharvard-medium', 'en_US-joe-medium', 'en_US-mike-medium',
              'en_US-kathleen-medium', 'en_GB-alba-medium', 'fr_FR-siwis-medium', 'fr_FR-mls-medium',
              'pt_BR-cadu-medium', 'pt_BR-jeff-medium', 'pt_BR-faber-medium'}


def huella(texto):
    return hashlib.sha256(unicodedata.normalize('NFC', texto.strip()).encode('utf-8')).hexdigest()


def cargar(nombre):
    with open(os.path.join(AQUI, nombre), encoding='utf-8') as f:
        return json.load(f)


def elemento(tipo, id_, chat, paq):
    """La ficha, cromo, parada o frase con ese id en el Paquete, o None."""
    lista = {'ficha': chat['fichas'], 'cromo': paq['cromos'], 'parada': paq.get('paradas', []),
             'frase': paq.get('frases', [])}[tipo]
    return next((x for x in lista if x.get('id') == id_), None)


def texto_de(tipo, id_, idioma, chat, paq):
    """Texto vigente que debe leer el audio, o None si no existe."""
    k = CLAVE[idioma]
    x = elemento(tipo, id_, chat, paq)
    if x is None:
        return None
    if tipo == 'ficha':
        return x.get(k)
    if tipo == 'cromo':
        return (x.get(k) or {}).get('dato')
    return (x.get('texto') or {}).get(k)


def dentro_de_audios(rel):
    """True si la ruta relativa del manifiesto queda dentro de audios/ (nunca fuera del repo)."""
    base = os.path.realpath(os.path.join(AQUI, 'audios'))
    ruta = os.path.realpath(os.path.join(AQUI, rel))
    return os.path.commonpath([base, ruta]) == base


def check():
    if not os.path.exists(MANIFIESTO):
        print('  ok  todavía no hay audios (audios/manifiesto.json no existe)')
        return 0
    from jsonschema import Draft202012Validator
    with open(MANIFIESTO, encoding='utf-8') as f:
        man = json.load(f)
    with open(os.path.join(AQUI, 'docs', 'contratos', 'audios.schema.json'), encoding='utf-8') as f:
        errores = [f"esquema: {'/'.join(map(str, e.absolute_path))}: {e.message}" for e in Draft202012Validator(json.load(f)).iter_errors(man)]
    if errores:
        for e in errores:
            print(f'  ERROR  {e}')
        return 1
    chat, paq = cargar('chat.json'), cargar('paquete.json')
    avisos, vistos = [], set()
    for a in man['audios']:
        nombre = f"{a['idioma']}/{a['tipo']}/{a['id']}"
        if (a['idioma'], a['tipo'], a['id']) in vistos:
            errores.append(f'{nombre}: repetido en el manifiesto')
        vistos.add((a['idioma'], a['tipo'], a['id']))
        if not dentro_de_audios(a['archivo']):
            errores.append(f"{nombre}: la ruta {a['archivo']!r} sale de audios/")
        elif not os.path.isfile(os.path.realpath(os.path.join(AQUI, a['archivo']))):
            errores.append(f"{nombre}: no existe {a['archivo']}")
        t = texto_de(a['tipo'], a['id'], a['idioma'], chat, paq)
        if t is None:
            errores.append(f'{nombre}: ese texto ya no existe en el Paquete')
        elif huella(t) != a['huella']:
            errores.append(f'{nombre}: DESACTUALIZADO, el texto cambió desde la grabación; vuelve a grabarlo o sintetizarlo')
        if a['origen'] == 'sintetico' and a['voz'] not in PERMITIDAS:
            errores.append(f"{nombre}: la voz {a['voz']!r} no está en la lista apta para uso comercial (docs/licencias.md §3)")
        if a['origen'] == 'sintetico' and a['idioma'] == 'es-CO':
            errores.append(f'{nombre}: es-CO se graba con personas, no se sintetiza (decisión voz-audio-pregrabado)')
        if not a['revisado']:
            avisos.append(f'{nombre}: falta que R1 lo escuche y marque revisado: true')
    for x in avisos:
        print(f'  aviso  {x}')
    for x in errores:
        print(f'  ERROR  {x}')
    if errores:
        print(f'\nAudios: {len(errores)} error(es).')
        return 1
    print(f"\nAudios: OK ({len(man['audios'])} audio(s), {len(avisos)} sin revisar).")
    return 0


def sintetizar(idioma, tipo, ids):
    if idioma not in VOCES:
        sys.exit(f'No hay voz sintética apta para {idioma}. es-CO se graba con personas.')
    voz, licencia = VOCES[idioma]
    modelo = os.path.join(VOCES_DIR, f'{voz}.onnx')
    if not os.path.exists(modelo):
        sys.exit(f'Falta la voz: descárgala con  python -m piper.download_voices --download-dir herramientas/voces {voz}')
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg:
        try:
            import imageio_ffmpeg  # trae su propio ffmpeg: pip install imageio-ffmpeg
            ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        except ImportError:
            sys.exit('Falta ffmpeg: instálalo o corre  pip install imageio-ffmpeg')
    chat, paq = cargar('chat.json'), cargar('paquete.json')
    man = {'version': 1, 'audios': []}
    if os.path.exists(MANIFIESTO):
        with open(MANIFIESTO, encoding='utf-8') as f:
            man = json.load(f)
    idioma = next(k for k in VOCES if k == idioma)  # el nombre de carpeta sale de la tabla, no de la línea de comandos
    carpeta = os.path.join(AQUI, 'audios', idioma)
    os.makedirs(carpeta, exist_ok=True)
    for pedido in ids:
        x = elemento(tipo, pedido, chat, paq)
        if x is None or not re.fullmatch(r'[a-z0-9_]+', str(x.get('id', ''))):
            print(f'  salto  {tipo} {pedido!r}: no existe en el Paquete')
            continue
        id_ = x['id']  # las rutas usan el id del Paquete, nunca el texto escrito en la línea de comandos
        t = texto_de(tipo, id_, idioma, chat, paq)
        if not t:
            print(f'  salto  {tipo} {id_}: no hay texto en {CLAVE[idioma]}')
            continue
        archivo = re.sub(r'[^a-z0-9_]', '', id_)  # saneado: solo minúsculas, dígitos y «_»
        wav = os.path.join(carpeta, f'{archivo}.wav')
        mp3 = os.path.join(carpeta, f'{archivo}.mp3')
        # El texto va por la entrada estándar, nunca como argumento del comando
        subprocess.run([sys.executable, '-m', 'piper', '-m', modelo, '-f', wav], input=t, text=True, encoding='utf-8', check=True)
        subprocess.run([ffmpeg, '-loglevel', 'error', '-y', '-i', wav, '-ac', '1', '-b:a', '48k', mp3], check=True)
        os.remove(wav)
        rel = f'audios/{idioma}/{id_}.mp3'
        man['audios'] = [a for a in man['audios'] if not (a['idioma'] == idioma and a['tipo'] == tipo and a['id'] == id_)]
        man['audios'].append({'idioma': idioma, 'id': id_, 'tipo': tipo, 'archivo': rel, 'huella': huella(t),
                              'voz': voz, 'origen': 'sintetico', 'licencia': licencia, 'revisado': False})
        print(f'  ok  {rel}')
    os.makedirs(os.path.dirname(MANIFIESTO), exist_ok=True)
    with open(MANIFIESTO, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(man, f, ensure_ascii=False, indent=1)
    print('Recuerda: R1 escucha cada audio y marca revisado: true; R3 sube la versión del SW si van a la app.')


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--check', action='store_true')
    g.add_argument('--huella', nargs=3, metavar=('TIPO', 'ID', 'IDIOMA'))
    g.add_argument('--sintetizar', metavar='IDIOMA', choices=sorted(VOCES))
    ap.add_argument('--tipo', default='ficha', choices=['ficha', 'parada', 'cromo', 'frase'])
    ap.add_argument('--ids', default='', help='ids separados por coma (por defecto, las fichas críticas)')
    a = ap.parse_args()
    if a.check:
        sys.exit(check())
    if a.huella:
        tipo, id_, idioma = a.huella
        if tipo not in ('ficha', 'parada', 'cromo', 'frase') or idioma not in CLAVE:
            sys.exit('tipo: ficha|parada|cromo|frase · idioma: ' + '|'.join(CLAVE))
        t = texto_de(tipo, id_, idioma, cargar('chat.json'), cargar('paquete.json'))
        if t is None:
            sys.exit(f'No existe {tipo} {id_} en {CLAVE[idioma]}')
        print(huella(t))
        return
    ids = [x for x in a.ids.split(',') if x] or ['emergencia', 'mal_altura', 'comer_plantas', 'volcan_estado']
    sintetizar(a.sintetizar, a.tipo, ids)


if __name__ == '__main__':
    main()
