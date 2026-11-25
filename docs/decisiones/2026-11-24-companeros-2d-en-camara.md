---
estado: propuesta
fecha: 2026-11-24
decisores: R1, R2, R3
---
# Compañeros 2D en la cámara, en modo «encuentro»

## Contexto y problema
Queremos el encanto de «ver» a Fray, el Cóndor o Magma en el paisaje, al estilo de los juegos de realidad aumentada, sin exponer a nadie a caminar mirando el teléfono.

## Opciones consideradas
1. Encuentro: el personaje aparece sobre la cámara solo en una parada o pausa, con paralaje leve
2. Apariciones por GPS que hay que perseguir
3. WebXR / realidad aumentada inmersiva

## Decisión
Proponemos **encuentros**: los personajes SVG que ya existen (Fray, Cóndor y Magma, en js/art.js) aparecen sobre la cámara al llegar a una estación, cuando la Lente reconoce algo o con el QR del guía, con paralaje por DeviceOrientation. Al tocarlos cuentan la ficha y permiten una foto con el personaje, que va al collage. Sin WebXR (iPhone no lo soporta) y sin persecuciones.

## Consecuencias
- Buenas: mágico y seguro; reutiliza el arte existente.
- Malas o riesgos: DeviceOrientation pide permiso en iPhone; hay que manejar el «no».
- Cómo se verifica: spec companeros-2d-camara; prueba en un iPhone.
