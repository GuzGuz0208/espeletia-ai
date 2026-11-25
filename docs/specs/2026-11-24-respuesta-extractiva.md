---
rol: R2
estado: borrador
prioridad: P1
decisiones: [2026-11-24-recuperar-no-generar, 2026-11-24-slm-generativo-opcional]
---
# Respuesta corta extractiva (conversar sin generar)

## Problema
Fray muestra la ficha entera: correcta, pero larga para una pregunta puntual («¿hasta qué hora puedo entrar?»). Un SLM generativo
pequeño (Qwen2.5-0.5B) inventó datos en la prueba del 24-nov (laboratorio/README.md). Queremos respuestas cortas y directas **sin
generar texto**.

## Idea
Dentro de la ficha ya elegida, escoger **la frase (o las dos frases) que mejor responden la pregunta**, con el mismo modelo
multilingual-e5-small que ya carga la app. La respuesta es texto oficial literal: no se puede inventar nada. Debajo, siempre
«Ver ficha completa» y la fuente.

## Criterios de aceptación
- **Cuando** Fray elija una ficha que no sea del carril crítico ni dinámica y la ficha tenga más de 2 frases, **entonces** muestra
  primero la frase más parecida a la pregunta (similitud coseno e5 `query:` vs `passage:` de cada frase) y la ficha completa
  plegada debajo.
- **Cuando** la mejor frase no llegue a un umbral calibrado, o dos frases queden muy parejas, **entonces** muestra las dos mejores
  en su orden original, o la ficha entera.
- **Cuando** la ficha sea del carril crítico (emergencia, mal de altura, comer, volcán) o de abstención, **entonces** se muestra
  entera, como hoy.
- **Cuando** se mida con un banco nuevo de 30 preguntas puntuales, **entonces** la frase elegida contiene la respuesta en ≥80 % de
  los casos (juicio de R1).

## Contrato
Opcional: precalcular los vectores por frase en `models/chat_indice.json` (`frases`) con `herramientas/indice_chat.py`; si no, se
calculan al vuelo (2 a 6 frases por ficha, unos 35 ms cada una en PC; falta medirlo en teléfono).

## Verificación
- Copia de la lógica en Python (`herramientas/tema_chat.py` o un `extractiva.py`) y banco `pruebas/preguntas_extractiva.json`
  (R1, prueba ciega) medido con `evaluar.py`.
- La puerta de seguridad sigue al 100 %: el carril crítico no cambia.

## Fuera de alcance
Reformular, resumir o traducir con un modelo generativo.

## Notas
Ventajas sobre un SLM: 0 MB extra, sin inventar, rápido y funciona en cualquier teléfono. Se puede combinar con la capa de tono
(prefijos aprobados como «Sí:» / «No:» cuando la frase lo permite).
