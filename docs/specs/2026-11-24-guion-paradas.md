---
rol: R1
estado: borrador
prioridad: P0
decisiones: [2026-11-24-guia-en-el-centro, 2026-11-24-traduccion-pretraducida]
---
# Guion por parada y libro de frases del guía

## Problema
Las paradas narradas y el audio necesitan un texto corto, oficial y traducido por parada, y el guía necesita frases frecuentes en otros idiomas.

## Criterios de aceptación
- **Cuando** se defina una parada, **entonces** tiene `id`, `estacion`, título y texto en es y en (fr, de y pt-BR como borrador), `fuente` y `estado`.
- **Cuando** el texto de una parada se lea en voz alta, **entonces** dura entre 30 y 90 segundos.
- **Cuando** se escriban frases del guía («nos quedamos juntos», «tomen agua», «vamos a descender»), **entonces** van con traducción revisada.

## Contrato
Campos nuevos opcionales en `paquete.json`: `paradas[]` y `frases[]` (ver `docs/contratos/paquete.schema.json`).

## Verificación
`validar_contratos.py`: referencias a estaciones y fuentes; es y en presentes.

## Fuera de alcance
Grabar los audios (spec grabacion-voces).

## Notas
Afinar con los expertos el jueves. Material candidato: «La ruta del cóndor» (U. Caldas + UTadeo).
