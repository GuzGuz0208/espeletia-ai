---
estado: propuesta
fecha: 2026-11-24
decisores: R1, R2, R3
---
# Versión del service worker calculada en el despliegue

## Contexto y problema
Si alguien olvida subir VERSION en sw.js, los teléfonos se quedan con la versión vieja. Hoy se sube a mano.

## Opciones consideradas
1. Calcular la versión con una huella de los archivos de APP en el despliegue de Netlify
2. Subirla a mano con ayuda de una herramienta y comprobarla en CI

## Decisión
Mientras tanto: `herramientas/version_sw.py --subir` y `--check` en CI. Proponemos pasar a una huella calculada en el despliegue cuando Netlify esté conectado.

## Consecuencias
- Buenas: nadie depende de acordarse.
- Malas o riesgos: un paso de build rompe el «sin build» actual; hay que mantenerlo mínimo.
- Cómo se verifica: `version_sw.py --check` en CI.
