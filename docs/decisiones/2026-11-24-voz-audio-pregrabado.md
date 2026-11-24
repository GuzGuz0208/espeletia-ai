---
estado: propuesta
fecha: 2026-11-24
decisores: R1, R2, R3
---
# Voz por idioma con audio pregrabado del texto validado

## Contexto y problema
Queremos voces familiares: colombiana en español y una natural en en, fr, pt-BR y es-ES. En iPhone, Safari oculta las voces descargadas (desde iOS 18 perdió las buenas en español). No encontramos voz es-CO abierta ni offline. Además, la norma del parque prohíbe ruidos que perturben.

## Opciones consideradas
1. Audio pregrabado de cada texto validado (humano en es-CO; humano o síntesis offline en el computador para los demás)
2. TTS del sistema (speechSynthesis)
3. Modelo TTS dentro del teléfono (Piper o Kokoro en el navegador)

## Decisión
Proponemos **audio pregrabado**. es-CO grabado por voces reales con consentimiento; en, fr, pt-BR y es-ES grabados o sintetizados en el computador (Piper o Kokoro según licencia) y revisados por R1. Un manifiesto liga cada audio a la huella del texto que lee; si el texto cambia, CI lo marca desactualizado. Solo se precachea el idioma elegido. Respaldo: speechSynthesis local; si no hay, texto. Volumen bajo y audífonos.

## Consecuencias
- Buenas: voz consistente en cualquier teléfono, sin modelo extra y auditable.
- Malas o riesgos: hay que grabar y volver a grabar si cambia un texto; pesa unos MB por idioma (por medir).
- Cómo se verifica: `herramientas/audios.py --check` en CI (spec manifiesto-audios).

## Más información
Fuentes: https://developer.apple.com/forums/thread/764438 · https://huggingface.co/rhasspy/piper-voices · https://huggingface.co/hexgrad/Kokoro-82M
