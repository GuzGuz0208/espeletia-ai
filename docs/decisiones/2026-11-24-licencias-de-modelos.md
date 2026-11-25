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
Proponemos **verificar cada licencia en la ficha oficial y registrar el enlace** en [docs/licencias.md](../licencias.md)
(verificado el 24-nov-2026):
- multilingual-e5-small: MIT. ONNX Runtime Web: MIT. tokenizers.js y jsQR: Apache-2.0. qrcode-generator: MIT. Fuentes: OFL-1.1.
- MobileNetV2: origen sin registrar; re-exportar desde el ONNX Model Zoo (Apache-2.0) o documentar el origen real.
- Gemma 4: Apache-2.0 (resuelto), pero no cabe en un teléfono dentro del navegador. Gemma 3: Gemma Terms (uso comercial
  con condiciones). Qwen2.5/Qwen3: Apache-2.0.
- Piper: el motor pasó a GPL-3.0 (no se distribuye con la app); solo se usan voces de la lista comercial oficial
  (davefx, joe/mike, siwis, cadu/jeff). Kokoro-82M: Apache-2.0, plan B.
- NLLB: CC-BY-NC, descartado. No existe una voz es-CO abierta y apta para uso comercial: se graba con personas.
- La atribución de Copernicus debe usar el texto exacto de su licencia (hoy está incompleta).

## Consecuencias
- Buenas: sin sorpresas legales.
- Malas o riesgos: puede descartar un modelo que funcionaba.
- Cómo se verifica: tabla de licencias en docs/arquitectura.md con enlace a cada ficha.
