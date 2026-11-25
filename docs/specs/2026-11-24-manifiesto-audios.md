---
rol: R3
estado: hecha
prioridad: P1
decisiones: [2026-11-24-voz-audio-pregrabado]
---
# Manifiesto de audios y verificación

## Problema
Cada audio debe corresponder exactamente al texto validado que lee; si el texto cambia, el audio queda viejo.

## Criterios de aceptación
- **Cuando** se agregue un audio, **entonces** `audios/manifiesto.json` registra idioma, id, tipo, archivo, huella SHA-256 del texto que lee, voz, origen (humano o sintético), licencia y si está revisado.
- **Cuando** el texto de la ficha o parada cambie, **entonces** `python herramientas/audios.py --check` marca el audio desactualizado y falla en CI.
- **Cuando** se pida síntesis offline (`audios.py --sintetizar <idioma>`), **entonces** se genera en el computador con el motor elegido, nunca en el teléfono.

## Contrato
`docs/contratos/audios.schema.json`.

## Verificación
Job `contratos` de CI (cuando exista `audios/`).

## Fuera de alcance
El reproductor (R2) y la grabación (R1).

## Notas
Motor de síntesis por decidir tras verificar licencias (Piper: licencia por voz; Kokoro-82M: Apache-2.0).

## Estado (24-nov)
- Hecho: `herramientas/audios.py` con `--check` (en CI), `--huella` y `--sintetizar` con Piper (voces de la lista comercial
  de docs/licencias.md). Probado: síntesis de `emergencia` y `comer_plantas` con `es_ES-davefx-medium` (CC0) → MP3 mono de 55-70 KB
  cada uno (unos 4-5 MB por idioma para 75 fichas); `--check` detecta audio desactualizado, voz no permitida y es-CO sintético.
- Para sintetizar: `pip install piper-tts imageio-ffmpeg` y `python -m piper.download_voices --download-dir herramientas/voces <voz>`.
- Pendiente: grabaciones es-CO (R1, #8) y reproductor (R2, #19).
