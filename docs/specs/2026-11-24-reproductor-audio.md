---
rol: R2
estado: borrador
prioridad: P1
decisiones: [2026-11-24-voz-audio-pregrabado]
---
# Reproductor de audio por idioma

## Problema
Hoy la lectura en voz alta depende de las voces del teléfono, que en iPhone son escasas.

## Criterios de aceptación
- **Cuando** exista un audio revisado y vigente para el texto e idioma, **entonces** se reproduce ese audio.
- **Cuando** no exista, **entonces** se usa `speechSynthesis` con una voz local (`localService`) del idioma; si no hay, se muestra solo el texto.
- **Cuando** se reproduzca por primera vez en el recorrido, **entonces** se recomienda usar audífonos o volumen bajo (la norma del parque prohíbe ruidos que perturben).

## Contrato
Lee `audios/manifiesto.json` (`docs/contratos/audios.schema.json`).

## Verificación
Prueba de Playwright: con audio, sin audio y sin voz local.

## Fuera de alcance
Sintetizar voz en el teléfono.
