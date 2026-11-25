---
estado: propuesta
fecha: 2026-11-25
decisores: R1, R2, R3
---
# APK Android que envuelve la PWA y agrega un LLM nativo (modo Pro)

## Contexto y problema
El equipo quiere un LLM **generativo**, 100 % offline, **en el teléfono** (no se puede llevar un PC al páramo) y con respuestas
rápidas. En el navegador, Qwen2.5-0.5B tardó de 7 a 19 s por respuesta en un PC y **congeló y calentó** un Redmi Note 15 Pro 5G
(laboratorio/README.md). El navegador limita: el modelo corre en WASM o WebGPU, los pesos se copian a la memoria de JavaScript y no
hay acceso a las rutinas optimizadas del procesador ni a la NPU.

## Opciones consideradas
1. Seguir en el navegador (transformers.js/WebGPU).
2. **APK Android que envuelve la misma PWA** (Capacitor o Expo + WebView) y le agrega un puente a un motor nativo (llama.cpp vía
   `llama-cpp-capacitor` o `llama.rn`, o LiteRT-LM de Google).
3. Reescribir la app en nativo (Expo/React Native completo).

## Decisión
Proponemos la **opción 2**, **solo si la medición nativa la justifica** (laboratorio/prueba-llm-nativo.md):
- **Mismo contenido y misma interfaz.** Es la PWA actual dentro del APK. Si existe `window.FrayNativo.generar()`, la app lo usa; si
  no (iPhone, otros navegadores), sigue en modo Básico.
- **Motor nativo:** llama.cpp (GGUF Q4) o LiteRT-LM (GPU/CPU). Usan el procesador mucho mejor que el navegador: mmap de los pesos,
  rutinas ARM optimizadas, GPU por OpenCL. Google publica 47-52 tokens/s para Gemma 4 E2B en un S26 Ultra; un gama media dará menos:
  **hay que medirlo**.
- **Más control:** llama.cpp permite **gramáticas (GBNF/JSON Schema)** que restringen la salida, por ejemplo obligar a que las cifras
  sean solo las de la ficha. Además, límite de tokens, tiempo máximo, caché del prompt del sistema y modelo precargado al abrir la app.
- **Flujo:**
  1. Fray responde **al instante** con la frase oficial (respuesta extractiva).
  2. El LLM la reescribe y el verificador la revisa.
  3. Si pasa en menos de N segundos, se reemplaza; si no, queda la oficial.
- **El carril crítico nunca pasa por el LLM.**
- Gemma 4 E2B (Apache-2.0) o Qwen2.5-1.5B (Apache-2.0) como candidatos; el de 0,5B no alcanza en calidad.

## Consecuencias
- Buenas:
  - Más velocidad y la posibilidad de un modelo de 1-2B con mejor español.
  - Control de la salida por gramática.
  - Se reutiliza el 100 % de la PWA, y Daner ya explora Expo.
- Malas o riesgos:
  - Solo Android: iPhone exige una Mac, cuenta de Apple y firma, así que queda en modo Básico.
  - Instalar el APK a mano exige «orígenes desconocidos».
  - 1-2 GB más de descarga.
  - El teléfono se calienta igual mientras genera.
  - Hay que montar el entorno de compilación (Android SDK o EAS Build) en un día.
- Cómo se verifica:
  - Tabla de laboratorio/prueba-llm-nativo.md en el Redmi y en un gama baja.
  - Puerta de seguridad al 100 %.
  - Demo en modo avión.

## Más información
- Decisiones relacionadas: niveles-de-telefono (Pro solo nativo), slm-generativo-opcional (evidencia en el navegador), pwa-sin-tiendas.
- Fuentes: developers.googleblog.com «Blazing fast on-device GenAI with LiteRT-LM» · github.com/google-ai-edge/gallery ·
  github.com/a-ghorbani/pocketpal-ai · github.com/mybigday/llama.rn (GBNF y JSON Schema) · npm `llama-cpp-capacitor`.
