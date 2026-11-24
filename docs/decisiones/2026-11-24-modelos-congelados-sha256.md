---
estado: aceptada
fecha: 2026-11-24
decisores: R1, R2, R3
---
# Modelos congelados y verificados por SHA-256

## Contexto y problema
Los modelos pesan unos 90 MB, se descargan una vez y deben ser exactamente los evaluados.

## Opciones consideradas
1. Partes de ≤8 MB con huella SHA-256 en models/partes.json
2. Descargar de un hub en tiempo de ejecución

## Decisión
Elegimos **modelos congelados**: partes de ≤8 MB, tamaño y SHA-256 en `models/partes.json`. El service worker une, verifica y guarda. Cambiar un modelo exige una decisión nueva y volver a medir.

## Consecuencias
- Buenas: reproducible, sin red y con caché inmutable.
- Malas o riesgos: cambiar un modelo es más lento, a propósito.
- Cómo se verifica: `herramientas/verificar_modelos.py` en CI.
