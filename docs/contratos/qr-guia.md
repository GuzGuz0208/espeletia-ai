# Contrato: QR y código del Modo guía

Implementado en `js/guia.js`. Funciona **sin red**: el teléfono del visitante verifica la firma con su propio reloj.
Decisión: [qr-firmado-sin-red](../decisiones/2026-11-24-qr-firmado-sin-red.md). La clave y el PIN de la prueba de concepto
viven en `paquete.json → guia` y **no se copian en ningún documento** (decisión secretos-poc-en-repo-publico).

## Franja de tiempo
- `franja = floor(milisegundos_unix / (franjaMin × 60 000))`; `franjaMin` sale de `paquete.json → guia.franjaMin` (5 por defecto).
- El visitante acepta las franjas `f-2, f-1, f, f+1`: unos 10 minutos hacia atrás y 1 hacia adelante, por relojes desfasados.
  Si la franja es más vieja, responde «vencido».

## Contenido del QR
```
PARAMO-G|<acción>|<franja>|<firma>
```
- `firma` = primeros 12 caracteres hex de `HMAC-SHA256(clave, "<acción>|<franja>")`.
- Prefijo fijo `PARAMO-G|` (`esDelGuia()`); exactamente 4 campos separados por `|`.

## Código de 4 dígitos
- `código = parseInt(hex(HMAC-SHA256(clave, "cod|<acción>|<franja>"))[0:8], 16) mod 10000`, con ceros a la izquierda.
- Mismas franjas aceptadas que el QR.

## Acciones
| Acción | Significado | Estado |
|---|---|---|
| `h:<cromo>` | Historia contada por el guía: entrega ese cromo del capítulo IV | implementada |
| `e:<estación>` | «Llegamos a esta estación» (cuando el GPS falla); también marca «en el parque» | implementada |
| `aqui` | «Estamos en el parque»: habilita la pausa y la foto de grupo por 2 h | implementada |
| `c:<clase>` | «Confirmo lo que ve la Lente» (cuando duda o no está entrenada) | implementada |
| `p:<parada>` | Parada narrada: abre la parada en el idioma del visitante y, al terminar la explicación, entrega su cromo | **propuesta** (spec paradas-narradas) |
| `r:<HHMM>` | Hora de regreso fijada por el guía, para los avisos sin red | **propuesta** (spec avisos-sin-red) |

## Reglas del lado del visitante
- Cada combinación `acción|franja` sirve **una vez por teléfono** (se guarda en `usados`). Si el cromo ya se tenía, se
  responde «repetido» sin entregar nada.
- 5 códigos equivocados seguidos bloquean 1 minuto; luego 2, 4, 8 y como máximo 16 minutos. Un acierto reinicia la cuenta.
- La firma se comprueba primero: un QR con firma inválida se rechaza como falso; uno con firma válida pero fuera de la
  ventana dice «vencido».

## QR de fauna (señalética, no firmados)
`PARAMO-QR-<n>` (campo `codigo` de cada cromo de tipo `qr` en `paquete.json`). Requieren permiso del PNN para imprimirse en
el sendero.

## Límite conocido
Con la clave en un archivo público, alguien con conocimientos puede generar códigos. En producción, cada guía tendría su
propia clave al registrarse y la app verificaría con firma de clave pública.
