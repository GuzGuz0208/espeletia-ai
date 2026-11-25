---
estado: propuesta
fecha: 2026-11-24
decisores: R1, R2, R3
---
# SLM generativo opcional en el navegador que reformula la ficha recuperada

## Contexto y problema
El reto pide un asistente con «modelos de lenguaje pequeños (SLM)». Hoy Fray usa un SLM (multilingual-e5-small) para
**encontrar** la ficha oficial, pero no redacta: muestra la ficha tal cual. El jurado puede esperar un asistente que converse.
La decisión niveles-de-telefono dejó el LLM solo para un «Pro nativo», que no estará para el jueves. Las licencias y tamaños
verificados están en [docs/licencias.md](../licencias.md).

## Opciones consideradas
1. Seguir solo con recuperación (sin generación).
2. SLM generativo pequeño **en el navegador**, opcional y solo en teléfonos capaces, que reformula la ficha recuperada y se
   verifica contra ella (Qwen2.5-0.5B-Instruct, Apache-2.0, ~480-510 MB, con transformers.js sobre el ONNX Runtime que ya usa la app).
3. LLM nativo en Android (Gemma 4 E2B, Apache-2.0, LiteRT): fuera de la PWA y de iPhone.

## Decisión
Proponemos la **opción 2 como capa opcional**, sin tocar el núcleo:
- La búsqueda elige la ficha como hoy. **El carril crítico (emergencia, comer, volcán) y las abstenciones nunca pasan por el
  generador**: se muestra la ficha original.
- El SLM recibe solo la pregunta y el texto de la ficha. Responde en 1-3 frases en el idioma del visitante.
- **Verificación determinista** antes de mostrar: cifras, nombres propios y palabras de seguridad de la respuesta deben estar en la
  ficha. Si algo no coincide, o tarda más de N segundos, se muestra la ficha original. La fuente y la ficha original van siempre
  debajo («Ver ficha oficial»).
- Se descarga **aparte y solo si el visitante lo activa** («Respuestas conversacionales, +500 MB»), con 4 GB de RAM o más y la
  descarga ya completa. El modo Básico sigue siendo el predeterminado.
- Si las mediciones en teléfono no cumplen (latencia ≤4 s por respuesta en gama media, sin cerrar la pestaña por memoria), se
  muestra en la demo solo en un teléfono de gama alta, como «experimental».
Esto modificaría niveles-de-telefono, que dice «Pro solo nativo».

## Consecuencias
- Buenas: Fray «conversa» sin poder inventar datos (todo sale de la ficha y se verifica); Apache-2.0 sin términos que trasladar a
  los usuarios; mismo motor ONNX.
- Malas o riesgos: +500 MB de descarga; velocidad en el navegador de un teléfono **sin medir**; en iPhone, WebGPU solo desde iOS 26
  (sin ella va por WASM, más lento); más batería; la verificación puede descartar reformulaciones buenas.
- Cómo se verifica: banco de reformulación (pregunta → ficha → respuesta) con verificación automática; la puerta de seguridad sigue
  al 100 % porque el carril crítico no pasa por el SLM; medición en los 3 teléfonos (spec pruebas-en-telefonos).

## Más información
- Spec por escribir: `slm-reformulacion` (R2 implementa; R3 mide y verifica licencias; R1 escribe el banco de reformulación).
- Alternativas: Qwen3-0.6B (Apache-2.0, 570 MB); Gemma 3 270M/1B (Gemma Terms, con más carga legal).
