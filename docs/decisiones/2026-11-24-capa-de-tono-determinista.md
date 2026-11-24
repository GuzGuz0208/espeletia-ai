---
estado: propuesta
fecha: 2026-11-24
decisores: R1, R2, R3
---
# Capa de tono determinista

## Contexto y problema
Las fichas tienen un solo registro. Niños, adultos mayores o alguien asustado necesitan otro tono, sin cambiar el contenido.

## Opciones consideradas
1. Variantes escritas y aprobadas por R1, elegidas por reglas
2. Reformular con un LLM

## Decisión
Proponemos **variantes escritas** (corta, larga y niños), un léxico de registro y urgencia, y frases de empatía aprobadas, elegidas por reglas. Nunca cambia el dato ni la fuente.

## Consecuencias
- Buenas: mismo contenido, mejor tono, sin riesgo de inventar.
- Malas o riesgos: más texto que escribir y traducir.
- Cómo se verifica: validar_contratos.py comprueba que toda variante tenga ficha y fuente.
