---
rol: R2
estado: borrador
prioridad: P2
decisiones: [2026-11-24-traduccion-pretraducida, 2026-11-24-licencias-de-modelos]
---
# Spike: traducción en vivo guía → visitante

## Problema
Lo que el guía improvisa no está pre-traducido. ¿Se puede traducir en vivo, sin red, en un teléfono?

## Criterios de aceptación
- **Cuando** termine el spike, **entonces** hay una tabla con 2-3 candidatos (reconocimiento de voz offline + traducción offline) y, para cada uno: tamaño, RAM, latencia en un teléfono real, idiomas, licencia verificada en su ficha oficial y si los datos salen del teléfono.
- **Cuando** un candidato cumpla (≤150 MB adicionales, latencia ≤3 s por frase, licencia que permita uso con un operador comercial), **entonces** se muestra en la demo como «experimental», sin reemplazar las paradas pre-traducidas.
- **Cuando** ninguno cumpla, **entonces** se documenta y queda como fase 2.

## Contrato
Ninguno.

## Verificación
Medición manual documentada en el PR del spike.

## Fuera de alcance
Traducir información de seguridad en vivo: esa siempre sale de fichas revisadas.

## Notas
NLLB queda descartado por licencia no comercial.
