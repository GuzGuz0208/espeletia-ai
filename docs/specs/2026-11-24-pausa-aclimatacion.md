---
rol: R2
estado: borrador
prioridad: P1
decisiones: [2026-11-24-experiencia-tres-fuentes-de-cromos]
---
# Pausa de aclimatación como cromo

## Problema
La ficha oficial recomienda pausas para aclimatarse; el juego puede reforzar esa conducta segura.

## Criterios de aceptación
- **Cuando** el visitante esté en una estación (o tenga el código «estamos en el parque»), **entonces** puede iniciar una pausa de aclimatación.
- **Cuando** pase el tiempo de la pausa sin tocar la pantalla, **entonces** recibe el cromo de descanso de esa estación; si toca, el tiempo se reinicia (como la pausa de contemplación).
- **Cuando** la pausa termine, **entonces** la app sugiere tomar agua y avisar al guía si hay síntomas (ficha `aclimatar` / `mal_altura`).

## Contrato
Nuevo `tipo` de cromo `aclimatacion` en `paquete.json` (los cromos los define R1).

## Verificación
Prueba con reloj simulado en Playwright.

## Fuera de alcance
Medir signos vitales o dar consejos médicos.

## Notas
La duración la fija R1 con la ficha oficial (la ficha `aclimatar` habla de pausas de 10 minutos). Confirmar con los expertos.
