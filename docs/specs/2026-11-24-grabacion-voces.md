---
rol: R1
estado: borrador
prioridad: P1
decisiones: [2026-11-24-voz-audio-pregrabado]
---
# Grabación de voces es-CO y revisión de audios

## Problema
Queremos una voz familiar colombiana y voces naturales en otros idiomas, sin depender de las voces del teléfono.

## Criterios de aceptación
- **Cuando** se grabe una parada o ficha crítica en es-CO, **entonces** queda en `audios/es-CO/<id>.mp3`, mono, ≤64 kbps, con consentimiento por escrito de quien graba.
- **Cuando** un audio de en, fr, pt-BR o es-ES sea sintético, **entonces** R1 lo escucha completo y marca `revisado: true` en el manifiesto.
- **Cuando** cambie el texto, **entonces** el audio queda desactualizado (lo detecta `audios.py --check`) y se vuelve a grabar.

## Contrato
`docs/contratos/audios.schema.json` (manifiesto `audios/manifiesto.json`).

## Verificación
`herramientas/audios.py --check` (spec manifiesto-audios).

## Fuera de alcance
El reproductor (spec reproductor-audio).

## Notas
Prioridad: paradas y fichas críticas primero. Grabar en un lugar silencioso; nada de música de fondo.
