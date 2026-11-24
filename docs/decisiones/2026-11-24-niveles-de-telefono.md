---
estado: aceptada
fecha: 2026-11-24
decisores: R1, R2, R3
---
# Niveles de teléfono: Básico sin LLM y Pro opcional nativo

## Contexto y problema
Los teléfonos de los visitantes van de gama baja a alta, y el reto pide modelos pequeños en hardware de baja potencia.

## Opciones consideradas
1. Básico (recuperación, sin LLM) para todos + Pro opcional nativo
2. LLM en el navegador para todos
3. Solo Básico

## Decisión
Elegimos **Básico para todos** (e5-small + MobileNetV2, sin LLM). **Pro** es opcional, solo nativo: un LLM reformula la ficha, se verifica contra ella y, si algo no coincide, vuelve a la ficha original. Gemma no se afina para el hackatón; el modo Pro nativo es un spike P2.

## Consecuencias
- Buenas: nadie queda por fuera y la seguridad no depende del LLM.
- Malas o riesgos: Pro no estará listo para la demo.
- Cómo se verifica: medición de RAM y latencia en el spike; el Básico se mide con evaluar.py.
