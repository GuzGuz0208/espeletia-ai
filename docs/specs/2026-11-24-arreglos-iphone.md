---
rol: R2
estado: borrador
prioridad: P0
decisiones: [2026-11-24-pwa-sin-tiendas]
---
# Instalación obligatoria y arreglos de iPhone

## Problema
En iPhone, Safari no vibra, no siempre mantiene la pantalla encendida, tiene pocas voces y la instalación no es obvia. El QR del guía debe abrir bien en Safari y Chrome.

## Criterios de aceptación
- **Cuando** la app quiera vibrar en iPhone, **entonces** muestra una señal visual equivalente (destello o pulso) en lugar de fallar en silencio.
- **Cuando** no haya Wake Lock, **entonces** la pausa y el Modo guía usan un plan B y avisan «mantén la pantalla encendida».
- **Paso obligatorio de instalación, justo después de escribir el nombre** (pedido del equipo el 24-nov). Cuando el visitante
  escriba su nombre en la portada y la app **no** esté instalada (`matchMedia('(display-mode: standalone)')` falso y
  `navigator.standalone` falso), **entonces** aparece una pantalla «Instala tu álbum para usarlo sin señal» **antes** de la
  descarga de ~95 MB, y no se pasa al álbum desde ahí:
  - **Android + Chrome:** botón «Instalar». El evento `beforeinstallprompt` se captura **al cargar la página**
    (`preventDefault()` y se guarda), no al mostrar la pantalla; si no llegó, se muestran los pasos manuales: menú ⋮ →
    «Instalar app» o «Agregar a la pantalla principal».
  - **iPhone (Safari o Chrome):** pasos con dibujo: Compartir → «Agregar a inicio» → abrir desde el ícono. iPhone nunca muestra
    un botón de instalar automático.
  - **Dentro de Instagram, WhatsApp o Facebook** (navegador interno, sin opción de instalar): «Abre este enlace en Chrome / Safari»
    con botón para copiar el enlace. Importa porque el reto se difunde por Instagram.
  - Al abrir la app instalada (desde el ícono) se continúa con el nombre guardado y empieza la descarga.
  - Escape discreto «Continuar sin instalar (no funcionará sin señal)» solo para computadores y la demo ante el jurado.
- **Cuando** la app ya esté instalada, **entonces** el paso no vuelve a salir.
- **Cuando** termine la descarga en la app instalada, **entonces** se pide almacenamiento persistente (`navigator.storage.persist()`);
  si el navegador dice que no (Safari suele responder `false`), no pasa nada: la app instalada igual conserva sus datos.
- **Cuando** se escanee el QR del guía con la cámara del iPhone, **entonces** se abre la app (o su URL) y no un texto suelto.

## Contrato
Ninguno (si el QR cambia de formato, actualizar `docs/contratos/qr-guia.md`).

## Verificación
Prueba manual en un iPhone real (marcar «no probado» si no hay); prueba de punta a punta en Chrome.

## Fuera de alcance
Notificaciones push y almacenamiento persistente avanzado.

## Notas
Por qué instalar primero: en iPhone, la app instalada en la pantalla de inicio guarda sus datos separados de Safari, así que lo descargado en Safari probablemente no pasa a la app instalada (**confirmar en el iPhone de prueba**). Además, Safari puede borrar los datos de sitios no usados en varios días.

**Por qué a veces no aparece la opción de instalar** (Redmi Note 15, 24-nov): Chrome solo dispara `beforeinstallprompt` cuando
se cumplen sus criterios y, si el visitante lo cerró una vez, lo oculta durante un tiempo; dentro de Instagram/WhatsApp no existe; y
en iPhone nunca existe. Por eso la app debe mostrar **su propio** paso de instalación con los pasos manuales como respaldo, en vez de
depender del aviso del navegador.

**Espacio:** Chrome y Safari 17+ permiten a un sitio guardar hasta ~60 % del disco (la app instalada en iPhone tiene la misma cuota que
en Safari). Los ~95 MB actuales y +500 MB de un SLM opcional caben; el límite práctico es el tiempo de descarga y la RAM, no el disco.
Fuentes: webkit.org/blog «Updates to Storage Policy» · developer.mozilla.org «Storage quotas and eviction criteria».
