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
Proponemos las dos cosas juntas: `--subir` (número y fecha, a mano) con `--check` en CI, y además `--sellar` en el despliegue de Netlify, que agrega a VERSION la huella del contenido de la app. Así, aunque alguien olvide `--subir`, la versión publicada cambia cuando cambia cualquier archivo.

## Consecuencias
- Buenas: nadie depende de acordarse.
- Malas o riesgos: un paso de build rompe el «sin build» actual; hay que mantenerlo mínimo.
- Cómo se verifica: `version_sw.py --check` en CI.
