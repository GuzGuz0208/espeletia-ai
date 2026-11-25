---
rol: R2
estado: borrador
prioridad: P1
decisiones: [2026-11-24-reglas-del-juego, 2026-11-24-escalera-de-degradacion]
---
# Avisos sin red

## Problema
Sin señal no hay notificaciones push, pero el teléfono sabe dónde está, a qué altura, qué hora es y qué le falta. Esos avisos pueden cuidar al visitante.

## Criterios de aceptación
- **Cuando** el visitante llegue a una estación, **entonces** el teléfono vibra (o destella en iPhone) y guarda el sobre (ya existe).
- **Cuando** supere 3.500 m, **entonces** aparece «camina despacio» con la ficha del mal de altura (ya existe).
- **Cuando** se acerque la hora de regresar (la fija el guía en el Modo guía o, si no, el horario oficial de ingreso hasta las 14:00), **entonces** avisa «es hora de volver con tu guía».
- **Cuando** termine una pausa o haya sobres esperando y el visitante esté quieto, **entonces** se lo recuerda una vez.
- **Cuando** la batería baje del 20 % (solo donde el navegador lo informa: Android/Chrome), **entonces** sugiere el modo Noche y cerrar la cámara.

## Contrato
Hora de regreso como acción nueva del Modo guía (actualizar `docs/contratos/qr-guia.md` si viaja por QR).

## Verificación
Prueba de Playwright con GPS, reloj y batería simulados.

## Fuera de alcance
Avisos con la pantalla apagada o la app cerrada: el navegador no entrega GPS en segundo plano y las notificaciones push necesitan red.

## Notas
Nunca avisos mientras se camina que pidan mirar la pantalla: solo vibración y una línea.
