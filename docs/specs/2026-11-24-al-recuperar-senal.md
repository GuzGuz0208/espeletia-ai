---
rol: R3
estado: borrador
prioridad: P1
decisiones: [2026-11-24-fuente-unica-github-netlify, 2026-11-24-escalera-de-degradacion]
---
# Qué pasa al recuperar señal

## Problema
El visitante pasa por zonas con señal (Brisas, la vía a Manizales). Hay que aprovecharlas sin gastar datos ni batería, y sin sacar nada del teléfono.

## Criterios de aceptación
- **Cuando** haya señal y se abra la app, **entonces** el service worker refresca `paquete.json` y `models/parque.json` (ya existe) y busca una versión nueva de la app; los modelos que no cambiaron no se vuelven a bajar (ya existe).
- **Cuando** la escalera de degradación haya marcado un archivo dañado, **entonces** se re-descarga y se verifica con SHA-256.
- **Cuando** llegue contenido nuevo, **entonces** se avisa «contenido actualizado» una vez; nunca se interrumpe una pausa o un sobre.
- **Cuando** haya señal, **entonces** no se sube nada: álbum, fotos y recorrido se quedan en el teléfono.

## Contrato
Ninguno nuevo. Hoy `chat.json` solo se actualiza con una versión nueva del SW (no se refresca solo): documentarlo o cambiarlo con R1.

## Verificación
Prueba de Playwright: offline → online con un paquete cambiado; comprobar que se actualiza y que no hay peticiones de subida.

## Fuera de alcance
Respaldo en la nube o envío de datos a UTON (fase 2, con consentimiento explícito).
