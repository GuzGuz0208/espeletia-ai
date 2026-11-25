<!-- Generado por herramientas/generar_indices.py: no lo edites a mano. -->
# Cambios

Se genera desde `docs/cambios/` (un archivo por cambio). Para agregar uno, copia
`docs/cambios/plantilla.md`.

## 2026-11-24

- **R3** · agregado (r3/audios): herramientas/audios.py: verifica que cada audio pregrabado lea el texto vigente con una voz apta para uso comercial (en CI) y sintetiza audios offline con Piper en el PC. Probado con la voz CC0 es_ES-davefx.
- **R3** · agregado (r3/harness-base): Andamiaje del equipo: AGENTS.md, decisiones, specs por rol, investigación del recorrido, contratos JSON Schema, herramientas de verificación (contratos, modelos, evaluación con puerta de seguridad, versión del SW) y CI. No cambia nada de la app.
- **R3** · agregado (r3/licencias): Licencias verificadas de modelos, voces y librerías (docs/licencias.md) y propuesta de un SLM generativo opcional que reformula la ficha recuperada sin tocar el carril crítico (Qwen2.5-0.5B, Apache-2.0). Pendientes: atribución de Copernicus, origen de MobileNetV2 y archivos de licencia.
- **R3** · agregado (r3/prueba-y-dictado): Guía para probar la app completa en un teléfono lejos del páramo (modo demo, enseñar a la Lente, QR, Modo guía, Fray y batería) y spec del botón para hablarle a Fray con reconocimiento de voz sin red.
