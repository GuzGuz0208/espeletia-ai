---
rol: R2
estado: borrador
prioridad: P1
decisiones: [2026-11-24-companeros-2d-en-camara, 2026-11-24-reglas-del-juego]
---
# Compañeros 2D en la cámara

## Problema
Queremos que Fray, el Cóndor y Magma «estén» en el paisaje, sin mecánicas que hagan caminar mirando el teléfono.

## Criterios de aceptación
- **Cuando** el visitante llegue a una estación, la Lente reconozca algo con seguridad o lea el QR del guía, **entonces** aparece el personaje del cromo (`personaje` en paquete.json) sobre la imagen de la cámara.
- **Cuando** el teléfono se incline, **entonces** el personaje se desplaza un poco (paralaje con DeviceOrientation); si el permiso se niega, queda fijo.
- **Cuando** el visitante toque al personaje, **entonces** este cuenta el dato de la ficha (con fuente) y ofrece «foto con Fray», que guarda una imagen compuesta (cámara + personaje) para el collage.
- **Cuando** el GPS indique que el visitante camina, **entonces** no aparece ningún personaje.

## Contrato
Ninguno en JSON; las fotos compuestas se guardan en IndexedDB junto a las fotos del álbum.

## Verificación
Prueba de Playwright con cámara simulada: aparece en parada, no aparece caminando, la foto queda guardada.

## Fuera de alcance
WebXR, modelos 3D y apariciones aleatorias.

## Notas
Reutiliza `personajes` de js/art.js. En iPhone, DeviceOrientation pide permiso con un toque del usuario.
