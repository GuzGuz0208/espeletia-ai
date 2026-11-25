---
rol: R3
estado: lista para probar
prioridad: P1
decisiones: [2026-11-24-version-sw-en-despliegue]
---
# Versión del service worker siempre al día

## Problema
Si se olvida subir VERSION en sw.js, los teléfonos se quedan con archivos viejos.

## Criterios de aceptación
- **Cuando** un PR cambie un archivo de la lista APP de sw.js o de models/ y no cambie VERSION, **entonces** `version_sw.py --check` falla en CI.
- **Cuando** alguien corra `python herramientas/version_sw.py --subir`, **entonces** VERSION pasa a `v<N+1>-<fecha de hoy>`.
- **Cuando** la lista APP nombre un archivo que no existe, **entonces** `validar_contratos.py` falla.

## Contrato
Formato de VERSION: `v<número>-AAAA-MM-DD`.

## Verificación
Job `contratos` de CI.

## Fuera de alcance
Calcular la huella en el despliegue (paso siguiente, cuando Netlify esté conectado).

## Estado (24-nov)
- Hecho: `version_sw.py --check` en CI y `--sellar` en `netlify.toml`: al publicar, VERSION queda `v<N>-<fecha>-<huella8>`,
  donde la huella es el SHA-256 de sw.js, la lista APP y models/partes.json. Probado en un clon: sellar dos veces no repite la huella
  y cambiar `js/app.js` cambia la versión publicada.
- Pendiente: confirmar en el primer deploy preview de Netlify que el build encuentra `python3` (la imagen de Netlify lo trae;
  si fallara, volver a `command = ""`). GitHub Pages no corre el sello: ahí sigue mandando `--subir`.
