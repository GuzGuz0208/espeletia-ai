# Contrato: mensajes entre la página y el service worker

Implementado en `sw.js`. La página escucha con `navigator.serviceWorker.addEventListener('message', …)` (hoy en `js/app.js`)
y envía con `navigator.serviceWorker.controller.postMessage(…)`. La página ignora los tipos que no conoce, así que agregar un
tipo nuevo no rompe nada.

## Del service worker a la página
| `tipo` | Campos | Cuándo | Lo usa hoy |
|---|---|---|---|
| `progreso` | `p` (0 a 1) | mientras guarda la app para usarla sin señal | sí (portada) |
| `listo` | — | terminó de guardar y activó la versión nueva | sí (portada, precarga) |
| `error` | `detalle` | falló la instalación (archivo faltante, huella distinta…) | sí (Ajustes → causa) |
| `contenido` | `archivo` (`paquete.json` o `parque.json`) | con señal llegó un paquete **distinto** al guardado; ya quedó guardado | **pendiente (R2)**: avisar «contenido actualizado» una vez, sin interrumpir una pausa ni un sobre |
| `verificado` | `malos` (lista de rutas) | respuesta a `verificar` | **pendiente (R2)** |
| `reparado` | `ok` (rutas), `fallidos` (`{ruta, detalle}`; `detalle: 'sin señal'` si no hay red) | respuesta a `reparar` | **pendiente (R2)** |

## De la página al service worker
| `tipo` | Campos | Qué hace | Red |
|---|---|---|---|
| `verificar` | — | recalcula el SHA-256 de los archivos grandes guardados (modelos y motor WASM) contra `models/partes.json` | no la necesita (~1-2 s en un teléfono, por medir) |
| `reparar` | `rutas` (lista) | vuelve a descargar, verificar y guardar **solo** las rutas que son de la app (lista APP o archivos grandes); lo demás va a `fallidos` | la necesita; sin señal no toca nada y responde `sin señal` |

## Uso previsto (escalera de degradación, issue #20)
1. Si la Lente o el chat no cargan, la página pide `verificar`.
2. Si `malos` no está vacío: mostrar «Hay archivos dañados; se repararán cuando tengas señal» y, al volver la señal (`online`),
   pedir `reparar` con esas rutas.
3. Con `reparado.ok` completo, reintentar cargar el modelo.

## Garantías
- El service worker **nunca sube datos**: solo descarga lo que es de la app.
- `paquete.json` y `parque.json` se revalidan con el servidor (`cache: 'no-cache'`; si no cambiaron, 304 sin descarga).
- `chat.json` y `models/chat_indice.json` **no** se refrescan solos: van juntos y cambian solo con una versión nueva del SW, para
  que el índice nunca quede desalineado con las fichas.
- Solo se guardan en la caché los archivos de la lista APP y los paquetes (antes se guardaba cualquier archivo pedido).
