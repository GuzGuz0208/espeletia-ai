---
estado: aceptada
fecha: 2026-11-24
decisores: R1, R2, R3
---
# QR firmado guía ↔ visitante, sin red

## Contexto y problema
El guía entrega cromos y confirma lugares, pero en el páramo no hay señal.

## Opciones consideradas
1. QR y código de 4 dígitos con firma HMAC por franja de 5 min, verificados con el reloj
2. Servidor que valida códigos
3. Códigos fijos impresos

## Decisión
Elegimos **HMAC-SHA256 de «acción + franja»**, verificado offline en el teléfono del visitante. El formato está en `docs/contratos/qr-guia.md`.

## Consecuencias
- Buenas: funciona sin red y cada código sirve una vez por teléfono.
- Malas o riesgos: en la prueba de concepto la clave está en un archivo público (ver la decisión secretos-poc-en-repo-publico).
- Cómo se verifica: `pruebas/guia_parque.py` (Playwright).
