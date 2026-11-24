---
estado: propuesta
fecha: 2026-11-24
decisores: R1, R2, R3
---
# Licencias de modelos y voces

## Contexto y problema
El repo es público y el piloto podría usarse con un operador comercial (UTON). Las fuentes no coinciden sobre algunas licencias.

## Opciones consideradas
1. Verificar cada licencia en la ficha oficial del modelo antes de usarlo
2. Asumir la licencia que dice un blog

## Decisión
Proponemos **verificar en la ficha oficial** y registrar el enlace: multilingual-e5-small (el LEEME dice MIT: confirmar), MobileNetV2 (depende de dónde se exportó: confirmar), Gemma 4 (las fuentes no coinciden: no usar hasta verificar), NLLB (no comercial: descartado), voces Piper (licencia por voz) y Kokoro-82M (Apache-2.0 según su ficha).

## Consecuencias
- Buenas: sin sorpresas legales.
- Malas o riesgos: puede descartar un modelo que funcionaba.
- Cómo se verifica: tabla de licencias en docs/arquitectura.md con enlace a cada ficha.
