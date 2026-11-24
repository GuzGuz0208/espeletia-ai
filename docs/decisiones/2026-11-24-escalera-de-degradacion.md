---
estado: propuesta
fecha: 2026-11-24
decisores: R1, R2, R3
---
# Escalera de degradación ante fallos

## Contexto y problema
En el páramo fallan cosas: poca RAM, caché corrupta, worker colgado, permisos negados. La app nunca debe quedar muda.

## Opciones consideradas
1. Escalera explícita de respaldos
2. Mostrar el error y ya

## Decisión
Proponemos esta escalera: modelo que no carga o poca RAM → búsqueda léxica (ya existe); caché corrupta → re-verificar SHA y re-descargar con señal; worker colgado → timeout y reinicio; cámara o GPS negados → QR o código del guía y elección manual; último recurso → menú de temas + «no tengo esa información» + teléfono de UTON.

## Consecuencias
- Buenas: siempre hay una respuesta segura.
- Malas o riesgos: más estados que probar.
- Cómo se verifica: pruebas que simulan cada fallo (spec escalera-degradacion-ui).
