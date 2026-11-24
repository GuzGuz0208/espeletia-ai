---
rol: R2
estado: borrador
prioridad: P0
decisiones: [2026-11-24-pwa-sin-tiendas]
---
# Arreglos de iPhone

## Problema
En iPhone, Safari no vibra, no siempre mantiene la pantalla encendida, tiene pocas voces y la instalación no es obvia. El QR del guía debe abrir bien en Safari y Chrome.

## Criterios de aceptación
- **Cuando** la app quiera vibrar en iPhone, **entonces** muestra una señal visual equivalente (destello o pulso) en lugar de fallar en silencio.
- **Cuando** no haya Wake Lock, **entonces** la pausa y el Modo guía usan un plan B y avisan «mantén la pantalla encendida».
- **Cuando** el visitante abra la web en un iPhone sin instalarla (`navigator.standalone` falso), **entonces** la portada muestra, antes de empezar la descarga de ~95 MB, un aviso grande: «Instálala para usarla sin señal: Compartir → Agregar a inicio, y ábrela desde el ícono». La descarga pesada se hace desde la app instalada.
- **Cuando** el visitante esté en Android con Chrome y la app no esté instalada, **entonces** se ofrece el botón «Instalar» (`beforeinstallprompt`) con el mismo mensaje.
- **Cuando** la app ya esté instalada, **entonces** el aviso no vuelve a salir.
- **Cuando** se escanee el QR del guía con la cámara del iPhone, **entonces** se abre la app (o su URL) y no un texto suelto.

## Contrato
Ninguno (si el QR cambia de formato, actualizar `docs/contratos/qr-guia.md`).

## Verificación
Prueba manual en un iPhone real (marcar «no probado» si no hay); prueba de punta a punta en Chrome.

## Fuera de alcance
Notificaciones push y almacenamiento persistente avanzado.

## Notas
Por qué instalar primero: en iPhone, la app instalada en la pantalla de inicio guarda sus datos separados de Safari, así que lo descargado en Safari probablemente no pasa a la app instalada (**confirmar en el iPhone de prueba**). Además, Safari puede borrar los datos de sitios no usados en varios días.
