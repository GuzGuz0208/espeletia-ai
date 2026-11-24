---
rol: R3
estado: borrador
prioridad: P0
decisiones: [2026-11-24-niveles-de-telefono, 2026-11-24-pwa-sin-tiendas]
---
# Pruebas en 3 teléfonos con batería

## Problema
Todo lo medido hasta ahora es en un computador. El reto pide hardware de baja potencia y autonomía energética.

## Criterios de aceptación
- **Cuando** se prueben un Android de gama baja, un Android de gama media y un iPhone, **entonces** hay una tabla con: instalación, «Listo sin señal», tiempo de carga de la Lente y del chat (Ajustes → Tiempos de carga), modo avión de punta a punta y % de batería consumido en 1 h de uso simulado.
- **Cuando** algo falle en un teléfono, **entonces** se abre un issue con la etiqueta del rol dueño.

## Contrato
Ninguno.

## Verificación
Tabla en `docs/evals.md` (sección teléfonos) con modelo, sistema y navegador.

## Fuera de alcance
Pruebas automatizadas en dispositivos (granjas en la nube).
