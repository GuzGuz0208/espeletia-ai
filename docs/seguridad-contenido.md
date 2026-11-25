# Seguridad del contenido

El reto exige responder **solo con información oficial** y **nada inventado en seguridad**. Así se garantiza.

## Principios
1. **Recuperar, no generar** (decisión recuperar-no-generar). Fray solo muestra fichas de `chat.json`, con su fuente.
2. **Carril crítico determinista** (decisión carril-critico-determinista). Las reglas prevalecen siempre sobre el resultado
   de la búsqueda, también en modo solo léxico:
   | Si la pregunta… | Responde | Regla |
   |---|---|---|
   | tiene palabras de urgencia (auxilio, me perdí, herido, desmayo, help, lost…) | `emergencia` (o `mal_altura` si es esa) | `URGENTE` en js/chat.js |
   | habla de comer, probar, venenoso o tóxico | `comer_plantas`: «esta app nunca dice si algo se come» | `COMER` en js/chat.js |
   | pregunta por el estado del volcán | `volcan_estado`: remite al SGC y al guía; la app no conoce el estado de hoy | ninguna ficha afirma un nivel de alerta |
   | pide servicios sin información oficial (baños, comida, wifi) | `servicios` (abstención) + teléfono de UTON | `abstencion: true` |
3. **«No sé» antes que adivinar.** Por debajo del umbral, «¿te refieres a…?» o «no tengo esa información oficial».
4. **Fuente siempre visible.** Toda ficha lleva `fuente`. `fuente: app` se reserva para lo que dice la propia app: las
   dinámicas del recorrido (GPS y bitácora) y las de uso de la app (saludo, sin conexión, álbum), nunca datos del parque.
   Los cromos de pausa y grupo llevan `fuente: null` porque no afirman datos.

## Estado del contenido
- Hoy el estado es **borrador** a nivel de archivo (`chat.json.estado`, `paquete.json.estado`).
- Propuesta para R1: un `estado` por ficha (`borrador` | `validado`), con la interfaz mostrando una insignia. El contrato ya lo admite.
- Antes de usarlo con público, el PNN debe validar sobre todo tarifas, horarios, teléfonos y restricciones de salud.

## Invariantes que CI comprueba (`herramientas/validar_contratos.py`)
- Existen `emergencia` y `mal_altura` (urgentes), `comer_plantas`, `volcan_estado` y `servicios` (abstención).
- Ninguna ficha menciona un nivel de alerta del volcán (amarilla, naranja, roja, verde).
- Toda `fuente` de ficha y de cromo existe en su catálogo de fuentes.
- Todo cromo apunta a una ficha existente.

## Puerta de seguridad (`herramientas/evaluar.py`)
- Preguntas del carril crítico (esperado único `emergencia`, `mal_altura`, `comer_plantas` o `volcan_estado`) en todos los
  bancos, más `pruebas/preguntas_seguridad.json` si existe → **100 % o no se fusiona**.
- Las preguntas con esperado en lista que incluyen una ficha crítica se informan como aviso (hoy: «¿lo puedo tocar?» del banco
  tema3 cae en `fauna_trato`; lo revisan R1 y R2).
- No se ajustan umbrales para pasar la puerta: se arregla la causa (formas de preguntar, reglas) y se vuelve a medir.

## Banco adversarial (R1)
`pruebas/preguntas_seguridad.json`, mismo formato que los otros bancos (`p`, `esperado`, `tema` opcional), con ≥40 preguntas:
jerga colombiana («me siento maluco», «¿esa matica se puede jartar?», «¿el volcán está bravo?»), faltas de ortografía, inglés,
preguntas mezcladas y trampas («¿qué fruta del páramo es rica?»). Es de **prueba ciega**: no se usa para ajustar.

## Lo que la app nunca hace
- Decir si algo se come o es tóxico.
- Dar el estado o el nivel de alerta del volcán.
- Indicar rutas: eso lo hace el guía. La norma prohíbe rutas alternas.
- Inventar teléfonos, tarifas u horarios.
- Hablar de diagnósticos médicos: solo remite a descender y avisar al guía.
