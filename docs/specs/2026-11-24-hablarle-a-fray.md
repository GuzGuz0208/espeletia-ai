---
rol: R2
estado: borrador
prioridad: P1
decisiones: [2026-11-24-recuperar-no-generar, 2026-11-24-carril-critico-determinista, 2026-11-24-licencias-de-modelos]
---
# Hablarle a Fray: botón de voz (dictado sin red)

## Problema
En el páramo, con guantes, frío y caminando, escribir en el teléfono es incómodo. El visitante debe poder **preguntar
hablando**. El dictado de los navegadores (Web Speech API) suele mandar el audio a servidores, así que sin señal no funciona
o no es confiable.

## Criterios de aceptación
- **Cuando** el visitante mantenga presionado el botón de micrófono del chat, **entonces** se graba, y al soltarlo la
  transcripción aparece en la casilla, **editable**, antes de enviarla.
- **Cuando** no haya señal, **entonces** el reconocimiento corre en el teléfono con un modelo offline (candidato: Vosk
  small-es-0.42, Apache-2.0, ~39 MB, con vosk-browser en WASM; small-en-us-0.15 para inglés). Se descarga solo si el visitante
  activa «Hablarle a Fray».
- **Cuando** el modelo offline no esté descargado y haya señal, **entonces** se puede usar el dictado del sistema, marcado
  «requiere señal».
- **Cuando** se niegue el permiso del micrófono, **entonces** queda el teclado y un aviso corto.
- **Cuando** llegue la transcripción, **entonces** pasa por la misma búsqueda y el **mismo carril crítico** que el texto escrito
  («me perdí» dicho en voz alta → ficha de emergencia).
- **Cuando** se grabe, **entonces** el audio nunca sale del teléfono ni se guarda.

## Contrato
Ninguno en JSON. Nuevo archivo grande opcional (modelo Vosk) con huella SHA-256 en `models/partes.json` si se precachea (R3).

## Verificación
- Banco de preguntas habladas (R1): 20 grabaciones cortas con acento colombiano y jerga, más las del carril crítico. Se mide la
  tasa de transcripción útil y que la puerta de seguridad siga al 100 % sobre las transcripciones.
- Prueba en un Android y un iPhone en modo avión.

## Fuera de alcance
Conversación continua (manos libres), activación por palabra clave y traducción en vivo (spec traduccion-en-vivo, que reutiliza
este reconocimiento).

## Notas
- WER publicado de Vosk small-es: 16 en Common Voice. Con jerga y viento puede ser peor: por eso la transcripción es editable.
- Alternativa a medir: Moonshine streaming tiny-es (MIT); su ejecución en el navegador no está verificada.
- Licencias en [docs/licencias.md](../licencias.md) §4.
