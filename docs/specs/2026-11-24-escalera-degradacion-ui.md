---
rol: R2
estado: borrador
prioridad: P1
decisiones: [2026-11-24-escalera-de-degradacion]
---
# Escalera de degradación en la interfaz

## Problema
Si algo falla en el páramo, la app no puede quedarse muda ni colgada.

## Criterios de aceptación
- **Cuando** el worker no responda en N segundos, **entonces** se reinicia una vez y, si vuelve a fallar, el chat pasa a solo léxico y lo dice.
- **Cuando** un archivo de la caché no coincida con su SHA-256, **entonces** se marca para re-descarga con señal y Ajustes lo muestra.
- **Cuando** se niegue la cámara o el GPS, **entonces** se ofrece el QR o código del guía y la elección manual de estación.
- **Cuando** todo lo demás falle, **entonces** se muestra el menú de temas + «no tengo esa información» + el teléfono de UTON.

## Contrato
Ninguno.

## Verificación
Pruebas que simulan cada fallo (worker que no responde, caché alterada, permisos negados).

## Fuera de alcance
Reintentos con red en segundo plano.
