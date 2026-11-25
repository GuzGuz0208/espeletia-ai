---
estado: aceptada
fecha: 2026-11-24
decisores: R1, R2, R3
---
# El asistente recupera fichas oficiales, no genera texto

## Contexto y problema
El reto exige responder solo con información oficial y nada inventado en seguridad, con modelos pequeños en teléfonos modestos.

## Opciones consideradas
1. Recuperación semántica sobre fichas oficiales (e5-small + reglas)
2. LLM pequeño que genera respuestas
3. LLM con RAG que reformula

## Decisión
Elegimos **recuperación**: Fray muestra la ficha oficial más parecida, con su fuente, o dice «no tengo esa información oficial». La fuente de verdad son las fichas de `chat.json`.

## Consecuencias
- Buenas: no puede inventar, es auditable y rápido (~35 ms en PC) y corre con 70 MB.
- Malas o riesgos: responde con el texto de la ficha aunque la pregunta pida algo más específico; a veces muestra una ficha vecina.
- Cómo se verifica: `herramientas/evaluar.py` mide aciertos y «no sé» correctos en los bancos de `pruebas/`.
