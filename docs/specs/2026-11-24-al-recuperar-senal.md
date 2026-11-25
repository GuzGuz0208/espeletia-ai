---
rol: R3
estado: hecha (parte R3)
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

## Estado (24-nov)
- Hecho en `sw.js` (v18):
  - aviso `contenido` cuando llega un paquete distinto;
  - revalidación de `paquete.json`/`parque.json` con `cache: 'no-cache'` (antes la caché HTTP podía devolver uno viejo durante minutos);
  - mensajes `verificar` y `reparar`, que responden `sin señal` si no hay red;
  - la caché guarda solo los archivos de la app (antes guardaba cualquier archivo pedido).
- Protocolo en [docs/contratos/sw-mensajes.md](../contratos/sw-mensajes.md).
- Probado en el navegador:
  - un modelo dañado a propósito → `verificar` lo detecta → `reparar` lo arregla;
  - rutas ajenas rechazadas;
  - paquete cambiado → un aviso, y ninguno si no cambió;
  - sin servidor: la app carga y `reparar` responde `sin señal`.
- Pendiente (R2, #20): mostrar «contenido actualizado» y usar `verificar`/`reparar` en la escalera de degradación.
