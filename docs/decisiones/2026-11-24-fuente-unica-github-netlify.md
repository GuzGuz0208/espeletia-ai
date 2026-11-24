---
estado: propuesta
fecha: 2026-11-24
decisores: R1, R2, R3
---
# Fuente única de verdad: GitHub main → Netlify con previews por PR

## Contexto y problema
Hoy Netlify sirve la v3.4 y main está en v3.8: no se sabe qué versión ven los teléfonos.

## Opciones consideradas
1. Netlify conectado al repo: main = producción, cada PR con preview
2. Netlify Drop manual
3. GitHub Pages

## Decisión
Proponemos **Netlify conectado a GitHub**: main se publica solo, cada PR tiene su URL de preview para probar en teléfonos, y nadie arrastra carpetas a mano.

## Consecuencias
- Buenas: lo que está en main es lo que ven los teléfonos; se prueba antes de fusionar.
- Malas o riesgos: requiere acceso de dueño a la cuenta de Netlify (dsalazardev).
- Cómo se verifica: la versión del SW que muestra Ajustes coincide con la de main.
