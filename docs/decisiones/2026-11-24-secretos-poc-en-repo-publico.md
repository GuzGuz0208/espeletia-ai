---
estado: propuesta
fecha: 2026-11-24
decisores: R1, R2, R3
---
# PIN y clave del QR en un repo público: solo para la prueba de concepto

## Contexto y problema
La clave HMAC del Modo guía y los PIN están en archivos públicos. Cualquiera con conocimientos podría generar códigos.

## Opciones consideradas
1. Aceptarlo solo para la prueba de concepto
2. Sacar la clave del repo ya

## Decisión
Proponemos **aceptarlo solo para la prueba de concepto**, sin repetir PIN ni clave en documentos nuevos. En producción, cada guía tendría su propia clave al registrarse y la app verificaría con firma de clave pública.

## Consecuencias
- Buenas: la demo funciona sin infraestructura.
- Malas o riesgos: no apto para uso real con público.
- Cómo se verifica: revisión de que ningún doc nuevo contenga PIN ni claves.
