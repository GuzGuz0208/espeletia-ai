---
estado: aceptada
fecha: 2026-11-24
decisores: R1, R2, R3
---
# PWA primero para Android e iPhone, sin tiendas

## Contexto y problema
Hay que llegar a Android y a iPhone en dos días, sin cuentas de desarrollador ni revisiones de tienda, y la app debe funcionar sin señal.

## Opciones consideradas
1. PWA estática instalable desde el navegador
2. Apps nativas en Play Store y App Store/TestFlight
3. Envoltorio web (Capacitor) publicado en tiendas

## Decisión
Elegimos **PWA estática sin build** (módulos ES + service worker que precachea todo). App Store y TestFlight quedan descartados para el hackatón: exigen cuenta de pago y revisión, y hay riesgo de rechazo por ser un envoltorio web (guía 4.2 de Apple).

## Consecuencias
- Buenas: un solo código, se instala desde una URL, se actualiza al publicar y no depende de terceros.
- Malas o riesgos: en iPhone hay límites de Safari (vibración, wake lock, voces, almacenamiento). Hay que probar en un iPhone real.
- Cómo se verifica: prueba en modo avión en un Android y un iPhone (DoD de cada PR).
