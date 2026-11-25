---
estado: aceptada
fecha: 2026-11-24
decisores: R1, R2, R3
---
# Contenido solo desde el Paquete Páramo, con fuente y estado

## Contexto y problema
El contenido lo escriben personas distintas del código y debe validarlo el PNN. Si los datos quedan regados en js/, nadie puede auditarlos.

## Opciones consideradas
1. Paquete de datos versionado (chat.json, paquete.json, parque.json)
2. Textos dentro del código

## Decisión
Elegimos el **Paquete Páramo**: todo dato del parque vive en `chat.json`, `paquete.json` y `models/parque.json`, con `fuente` y estado borrador/validado. La interfaz solo tiene textos de interfaz (i18n.js).

## Consecuencias
- Buenas: R1 cambia contenido sin tocar código; CI valida contratos y referencias.
- Malas o riesgos: hoy el estado borrador/validado es por archivo, no por ficha (pendiente para R1).
- Cómo se verifica: `herramientas/validar_contratos.py` contra `docs/contratos/`.
