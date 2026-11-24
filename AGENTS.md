# AGENTS.md · Álbum del Páramo

Reglas que no se deducen leyendo el código. Si algo aquí choca con lo que te piden, para y pregunta.

## Lo que nunca se rompe
- **Cero red en ejecución.** La app corre en modo avión. Nada de `fetch` a otro origen, CDN, analítica ni API en tiempo de
  ejecución. Toda librería va copiada en `lib/` y precacheada en `sw.js`.
- **Todo dato sale del Paquete Páramo** (`chat.json`, `paquete.json`, `models/parque.json`) y lleva `fuente`. No escribas
  datos del parque en js/ ni en i18n.js. Si no hay fuente oficial, la respuesta es «no tengo esa información, pregúntale a tu guía».
- **Nunca digas si algo se come o es tóxico, ni el estado del volcán.** Ni en fichas, ni en textos de interfaz, ni en
  generado. Comer → ficha `comer_plantas`; volcán → `volcan_estado` (remite al SGC y al guía); emergencia → `emergencia`.
  Estas reglas son deterministas y van **antes** de cualquier modelo (js/chat.js y su copia en herramientas/tema_chat.py).
- **El guía va en el centro.** Por norma es obligatorio (8 visitantes por guía). La app lo complementa, nunca lo reemplaza.
- **Nada que obligue a caminar mirando el teléfono.** Sin puntos por velocidad ni riesgo; los cromos y personajes aparecen en
  paradas o pausas. Al caminar, solo vibra y guarda.

## Archivos que no se tocan a mano
- `models/` está congelado: partes con SHA-256 en `models/partes.json`. Para cambiar un modelo, `herramientas/partir.py` y una
  decisión en docs/decisiones/.
- Archivos generados: `models/chat_indice.json` (`python herramientas/indice_chat.py --fijos`), `models/partes*`,
  `models/relieve.*`, `CHANGELOG.md` y `docs/decisiones/README.md` (`python herramientas/generar_indices.py`).
  Si hay un conflicto en uno de ellos, descarta ambos lados y regenéralo.
- La lógica de búsqueda está duplicada en `js/chat.js` y `herramientas/indice_chat.py` / `tema_chat.py`. Si cambias una, cambia la otra.

## Antes de fusionar
- `python herramientas/validar_contratos.py`, `python herramientas/verificar_modelos.py` y `python herramientas/evaluar.py`
  en verde. **La puerta de seguridad de evaluar.py debe dar 100 %**: no se ajustan umbrales para pasarla, se arregla la causa.
- Los bancos de prueba ciega (`preguntas_eval2`, `preguntas_tema3`, `preguntas_seguridad`) no se usan para ajustar nada.
- Si cambiaste un archivo de la app o de models/, sube la versión del service worker:
  `python herramientas/version_sw.py --subir` (CI lo comprueba con `--check`).
- Cada PR cita su spec (`docs/specs/`) y cumple la Definition of Done de `docs/flujo-de-trabajo.md`.

## Quién toca qué
Rutas por rol en `.github/CODEOWNERS` (R1 contenido, R2 interfaz, R3 plataforma). Trabaja en tu rama `r1/`, `r2/` o `r3/` y
escribe solo en tu `docs/contexto/Rn.md`. Un cambio = un archivo en `docs/cambios/`.

## Windows
Los scripts de herramientas/ abren archivos sin `encoding`: córrelos con `python -X utf8 …` (evaluar.py ya lo hace solo).

## Repo público
No escribas PIN, claves ni datos personales en docs, issues ni PR.
