---
rol: R3
estado: borrador
prioridad: P0
decisiones: [2026-11-24-fuente-unica-github-netlify]
---
# Netlify conectado al repositorio con previews

## Problema
Netlify sirve la v3.4 (subida a mano) y main está en v3.8: los teléfonos no ven lo que hay en main.

## Criterios de aceptación
- **Cuando** se fusione algo en main, **entonces** Netlify publica solo, sin pasos manuales.
- **Cuando** se abra un PR, **entonces** Netlify crea una URL de preview y la comenta en el PR.
- **Cuando** se abra la app publicada, **entonces** la VERSION del SW coincide con la de main.

## Contrato
`netlify.toml` (publicar la raíz, sin comando) y `_headers` ya existen.

## Verificación
Comparar la versión que muestra Ajustes con `sw.js` de main después de fusionar.

## Fuera de alcance
Dominio propio y analítica.

## Notas
La cuenta de Netlify la tiene Eduardo (@Eduardo37830): él conecta el repo (Site configuration → Build & deploy → Link repository → dsalazardev/espeletia-ai, rama main, deploy previews activados). Para autorizar la app de Netlify en GitHub puede necesitar que el dueño del repo (dsalazardev) la apruebe.
