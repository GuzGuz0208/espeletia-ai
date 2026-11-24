---
rol: R2
estado: borrador
prioridad: P0
decisiones: [2026-11-24-album-final-pdf]
---
# Álbum final en PDF + collage

## Problema
Al terminar, el visitante debe llevarse un recuerdo bonito: hoy solo hay un PNG del álbum.

## Criterios de aceptación
- **Cuando** el visitante toque «Descargar mi álbum», **entonces** se genera en el teléfono, sin red, un PDF con: portada (ilustración original de Manizales y del Nevado del Ruiz, nombre y fecha), una página por capítulo con los cromos ganados (los faltantes en silueta), collage con sus fotos (grupo, «ponerle mi foto», fotos con personajes), «Tu recorrido» (relieve real con el rastro, altura máxima, distancia, tiempo y perfil), certificado «Guardián del páramo» y fuentes/créditos (incluida la atribución de Copernicus).
- **Cuando** se genere, **entonces** el PDF pesa ≤15 MB (fotos redimensionadas y comprimidas) y tarda ≤10 s en un teléfono de gama media.
- **Cuando** el teléfono sea un iPhone, **entonces** se entrega con la hoja de compartir (`navigator.share` con archivo) y, si no se puede, como descarga.
- **Cuando** el visitante lo pida, **entonces** también obtiene el collage como imagen.

## Contrato
Ninguno en JSON. Librería PDF con licencia MIT copiada en `lib/` y precacheada (R3 la agrega a `sw.js` y verifica la licencia).

## Verificación
Prueba de Playwright: generar el PDF del álbum completo y validarlo con pypdf (número de páginas, imágenes y textos clave).

## Fuera de alcance
Imprimir, enviar por correo o subir las fotos a cualquier servidor.

## Notas
Ilustraciones originales en el estilo risográfico de la app: nada de fotos o marcas ajenas. Textos de R1 (spec texto del PDF en el backlog).
