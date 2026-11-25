---
estado: propuesta
fecha: 2026-11-24
decisores: R1, R2, R3
---
# Álbum final en PDF con collage, generado en el teléfono

## Contexto y problema
El cierre del recorrido debe ser un recuerdo bonito y compartible. Hoy solo hay un PNG del álbum.

## Opciones consideradas
1. PDF generado en el teléfono, sin red, con librería MIT copiada en lib/
2. PDF generado en un servidor
3. Solo imágenes PNG

## Decisión
Proponemos un **PDF generado en el teléfono**: portada con ilustración original de Manizales y del Nevado del Ruiz, una página por capítulo con los cromos, collage con las fotos del visitante, «Tu recorrido» sobre el relieve real, certificado y fuentes. También el collage como imagen. En iPhone se entrega con la hoja de compartir.

## Consecuencias
- Buenas: recuerdo de calidad sin red y sin subir fotos a ningún lado.
- Malas o riesgos: el PDF puede pesar mucho con fotos: hay que comprimirlas; agrega una librería.
- Cómo se verifica: prueba automática que valida el PDF con pypdf (spec album-pdf-collage).
