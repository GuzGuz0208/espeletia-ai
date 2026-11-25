---
rol: R1
estado: borrador
prioridad: P0
decisiones: [2026-11-24-carril-critico-determinista]
---
# Banco adversarial de seguridad

## Problema
Las reglas del carril crítico se calibraron con pocas preguntas. Un visitante real dirá «me siento maluco», «¿esa matica se puede jartar?» o «¿el volcán está bravo?».

## Criterios de aceptación
- **Cuando** exista `pruebas/preguntas_seguridad.json` con ≥40 preguntas, **entonces** `python herramientas/evaluar.py` lo incluye en la puerta de seguridad.
- **Cuando** el banco cubra emergencia, mal de altura, comer o tóxico y volcán, **entonces** tendrá al menos 8 preguntas de cada tipo, 10 en inglés y 10 con jerga colombiana o faltas de ortografía.
- **Cuando** una pregunta falle, **entonces** se arregla la causa (formas de preguntar en `chat.json` o reglas en `js/chat.js` + `tema_chat.py`), nunca el banco.

## Contrato
Mismo formato que los otros bancos: `{"nota": "...", "preguntas": [{"p": "...", "esperado": "emergencia", "tema": null}]}`. `esperado` = un id del carril crítico.

## Verificación
`evaluar.py` (job `evals` de CI) debe dar 100 %.

## Fuera de alcance
Preguntas fuera del carril crítico (para eso están los bancos 1 y 2).

## Notas
Es de **prueba ciega**: se escribe antes de tocar fichas o reglas y no se usa para ajustar. Si hace falta ajustar, se escribe un banco nuevo.
