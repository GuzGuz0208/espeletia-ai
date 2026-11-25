# Reto vs. evidencia

Reto UTON / ACOPI Caldas / Universidad de Caldas: *«Guía de páramo sin señal: asistente de IA para la interpretación
ambiental en alta montaña»*. Cada restricción con su evidencia y su estado real. **Medido** = hay un número reproducible;
**no medido** = falta probarlo.

| Restricción del reto | Cómo la cumple la app | Evidencia | Estado |
|---|---|---|---|
| 100 % modo avión | El service worker precachea la app y ~90 MB de modelos verificados con SHA-256; la IA corre en el teléfono | `sw.js`; `pruebas/coleccion.py` (modo avión: cargan la app, el álbum y el modelo) | Medido en Chrome de escritorio; **falta Android e iPhone reales** |
| Modelos pequeños en hardware de baja potencia | e5-small podado (66 MB, int8) + MobileNetV2 (8,8 MB); worker sin congelar la pantalla; modo solo léxico si falta RAM | LEEME v3.5: 0 s de pantalla congelada, ~35 ms por pregunta en PC | Medido en PC (con CPU frenada 4×); **falta un teléfono de gama baja** |
| Solo información oficial, nada inventado en seguridad | Recupera y no genera; carril crítico determinista; fichas con fuente | `herramientas/evaluar.py` (puerta de seguridad); `validar_contratos.py` (invariantes); bancos de `pruebas/` | Medido: ver [evals.md](evals.md). Las fichas son **borrador**: falta validarlas con el PNN |
| Autonomía energética | Modo Noche; GPS en pausa en segundo plano; el 3D solo dibuja al moverlo; IA en worker | LEEME (mapa y 3D) | **No medido**: prueba de batería en 3 teléfonos (backlog) |
| Interpretación ambiental | Fichas de flora, fauna, historia y normas; Lente; álbum por capítulos; pausas de contemplación | `chat.json`, `paquete.json`, [experiencia.md](experiencia.md) | Contenido borrador |
| Uso en alta montaña con guía | Modo guía con QR firmado sin red; plan B del guía en cada cromo; norma de guía obligatorio | `js/guia.js`, `pruebas/guia_parque.py`, [investigacion/recorrido-pnn.md](investigacion/recorrido-pnn.md) | Probado en navegador |
| Multilingüe | es/en hoy; fr, de y pt-BR como borrador; audio por idioma propuesto | `js/i18n.js`, decisión voz-audio-pregrabado | Parcial |

## Lo que diremos con honestidad en la demo
- Qué está medido y dónde (números de evals.md y del LEEME).
- Qué falta: teléfonos reales de gama baja, batería, validación del PNN, coordenadas de campo.
- Que la app **no reemplaza al guía**: lo amplifica.
