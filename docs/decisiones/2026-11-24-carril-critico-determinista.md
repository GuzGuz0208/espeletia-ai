---
estado: aceptada
fecha: 2026-11-24
decisores: R1, R2, R3
---
# Carril crítico determinista: emergencias, comer plantas y volcán

## Contexto y problema
Hay preguntas en las que un error puede costar una vida o una intoxicación: emergencias, si algo se come y el estado del volcán.

## Opciones consideradas
1. Reglas deterministas antes del modelo
2. Confiar en la búsqueda semántica
3. Generar con un LLM y filtrar después

## Decisión
Elegimos **reglas deterministas que van antes de cualquier modelo**: urgencia → ficha `emergencia` (y `mal_altura` si aplica); comer, venenoso o tóxico → `comer_plantas`; el estado del volcán nunca se da: `volcan_estado` remite al SGC y al guía. Nunca son generativas.

## Consecuencias
- Buenas: comportamiento predecible y verificable.
- Malas o riesgos: las expresiones regulares pueden no cubrir jerga; hace falta un banco adversarial.
- Cómo se verifica: puerta de seguridad de `evaluar.py` al 100 % en CI; banco `pruebas/preguntas_seguridad.json` (R1).
