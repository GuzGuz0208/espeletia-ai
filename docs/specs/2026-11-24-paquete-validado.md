---
rol: R1
estado: borrador
prioridad: P0
decisiones: [2026-11-24-contenido-paquete-paramo]
---
# Paquete validado: fichas nuevas del anexo y estado por ficha

## Problema
Faltan reglas oficiales que un visitante necesita (edad, seguro, inducción, horario, drones, ruido, sendero) y no se sabe qué fichas validó el PNN.

## Criterios de aceptación
- **Cuando** se agreguen fichas desde el anexo dic-2023, **entonces** cada una lleva `fuente` (agregar la fuente `pnn_anexo2023` al catálogo con su URL) y la página en el texto o en una nota.
- **Cuando** el PNN o UTON valide una ficha, **entonces** su campo `estado` pasa a `validado`; las demás quedan `borrador`.
- **Cuando** se cambie `chat.json`, **entonces** se regenera `models/chat_indice.json` con `indice_chat.py --fijos` y `evaluar.py` no empeora.

## Contrato
`docs/contratos/chat-ficha.schema.json` (campo opcional `estado`: `borrador` | `validado`).

## Verificación
`validar_contratos.py` y `evaluar.py` en CI.

## Fuera de alcance
Cambiar la interfaz para mostrar la insignia (eso es de R2).

## Notas
Datos en docs/investigacion/recorrido-pnn.md. No subir tarifas sin confirmar (la fuente es antigua).
