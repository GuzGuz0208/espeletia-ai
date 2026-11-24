---
estado: aceptada
fecha: 2026-11-24
decisores: R1, R2, R3
---
# Traducción: textos pre-traducidos y revisados

## Contexto y problema
Hay visitantes que no hablan español. Una traducción automática en vivo puede cambiar el sentido de una norma de seguridad.

## Opciones consideradas
1. Textos pre-traducidos y revisados por persona
2. Traducción libre en vivo en el teléfono

## Decisión
Elegimos **pre-traducido y revisado** (es y en hoy; fr, de y pt-BR como borrador). La traducción libre en vivo es fase 2 (spike P2 con criterios).

## Consecuencias
- Buenas: lo que lee el visitante está revisado.
- Malas o riesgos: cubre solo los textos escritos de antemano; lo que el guía improvisa no se traduce.
- Cómo se verifica: paridad de claves es/en en validar_contratos.py; revisión de R1.
