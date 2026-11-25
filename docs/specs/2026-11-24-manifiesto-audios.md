---
rol: R3
estado: borrador
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
