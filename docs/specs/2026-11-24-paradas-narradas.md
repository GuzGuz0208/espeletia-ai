---
rol: R2
estado: borrador
prioridad: P1
decisiones: [2026-11-24-guia-en-el-centro]
---
# Paradas narradas por QR del guía

## Problema
El guía explica en español; los visitantes de otros idiomas pierden la explicación.

## Criterios de aceptación
- **Cuando** el guía elija «Parada N» en el Modo guía, **entonces** su teléfono muestra un QR firmado de esa parada.
- **Cuando** el visitante lo lea, **entonces** ve el texto de la parada en su idioma, con fuente, y puede escucharlo si hay audio.
- **Cuando** el guía marque «terminé la explicación», **entonces** el QR entrega el cromo de la parada (una vez por teléfono).
- **Cuando** no haya traducción revisada en el idioma del visitante, **entonces** se muestra en inglés con la nota «traducción pendiente».

## Contrato
Nueva acción `p:<parada>` en `docs/contratos/qr-guia.md`; datos en `paquete.json.paradas[]`.

## Verificación
Extender `pruebas/guia_parque.py`: QR de parada leído por otro teléfono, idioma correcto, cromo una sola vez.

## Fuera de alcance
Traducción en vivo de lo que el guía improvisa.
