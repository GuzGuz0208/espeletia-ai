# Flujo de trabajo: SDD + harness

Tres personas, cada una con su agente de IA, trabajando en paralelo hasta el jueves. La metodología está en la decisión
[sdd-con-harness](decisiones/2026-11-24-sdd-con-harness.md).

## Roles y rutas
| Rol | Persona | Es dueño de |
|---|---|---|
| R1 · Contenido, campo y seguridad | @dsalazardev | `chat.json`, textos de `paquete.json`, `pruebas/preguntas_*`, traducciones, guion de demo, `docs/contexto/R1.md` |
| R2 · Producto y experiencia | @Eduardo37830 | `js/*`, `index.html`, `styles.css`, `js/i18n.js`, `docs/contexto/R2.md` |
| R3 · Plataforma, arquitectura y calidad | @GuzGuz0208 | `AGENTS.md`, `docs/`, `.github/`, `sw.js`, `herramientas/`, Netlify, `docs/contexto/R3.md` |

El detalle está en [.github/CODEOWNERS](../.github/CODEOWNERS). Si necesitas cambiar algo de otro rol, abre un issue o pídeselo:
no lo edites tú.

## El ciclo de un cambio
1. **Decisión**, si cambia algo de fondo: un archivo en `docs/decisiones/AAAA-MM-DD-slug.md` con la plantilla MADR.
2. **Spec**: `docs/specs/AAAA-MM-DD-slug.md` (plantilla en `docs/specs/plantilla.md`), corta y con criterios de aceptación
   verificables («Cuando… entonces…»), contrato que toca, eval que lo prueba y lo que queda fuera.
3. **Contrato**: si cambia la forma de un JSON, primero su esquema en `docs/contratos/`.
4. **Eval primero**: un caso en un banco o un check que hoy falla.
5. **Implementación** por el agente del rol, en su rama, tocando solo sus rutas. El agente lee `AGENTS.md`, su `docs/contexto/Rn.md`
   y la spec.
6. **Verificación**: CI en verde (contratos, modelos, versión del SW, evals y seguridad al 100 %) + la Definition of Done.
7. **Registro**: un archivo en `docs/cambios/` y una nota en tu `docs/contexto/Rn.md`.

## Ramas y PR
- Ramas `r1/<tema>`, `r2/<tema>`, `r3/<tema>`. Nada directo a `main`: `main` queda protegido (PR + checks).
- **PR pequeños**: uno por spec o por arreglo, que se revisen en minutos. La plantilla pide la spec y la DoD.
- Commits en español: `feat:`, `fix:`, `docs:`, `chore:`.
- Fusiona quien abrió el PR, cuando CI está en verde y otro rol lo revisó si toca un punto de choque.

## Definition of Done
- [ ] Funciona en **modo avión** (después de cargar una vez con señal).
- [ ] **Verificación en verde**: `validar_contratos.py`, `verificar_modelos.py` y `evaluar.py` (seguridad al 100 %).
- [ ] Probado en **un Android y un iPhone**, o marcado explícitamente «no probado en …».
- [ ] Textos nuevos con **claves i18n en es y en**.
- [ ] Si cambió un archivo de la app o de `models/`: VERSION del SW subida (`version_sw.py --subir`).
- [ ] Spec citada y un archivo en `docs/cambios/`.

## Puntos de choque
| Archivo | Regla |
|---|---|
| `sw.js` (VERSION, lista APP) | Solo R3 lo edita. Si agregas un archivo a la app, pídelo en el PR; R3 sube la versión al fusionar. |
| `js/i18n.js` | R2 es dueño; R1 propone traducciones por PR. Agrega claves al final de cada bloque para reducir conflictos. |
| `styles.css`, `index.html` | Solo R2. |
| `chat.json` | Solo R1. Después de cambiarlo, regenera el índice. |
| `models/chat_indice.json` | **Generado.** En conflicto, descarta ambos lados y corre `python -X utf8 herramientas/indice_chat.py --fijos`. |
| `CHANGELOG.md`, `docs/decisiones/README.md` | **Generados** con `python herramientas/generar_indices.py`. En conflicto, regenéralos. |

## Contexto y cambios sin archivos compartidos
- **No hay** CONTEXT ni CHANGELOG que editen los tres. Cada rol escribe solo su `docs/contexto/Rn.md`.
- Cada cambio deja un archivo en `docs/cambios/AAAA-MM-DD-rN-slug.md`; `CHANGELOG.md` se genera a partir de ellos.

## Etiquetas y tablero
- Etiquetas: `r1`, `r2`, `r3` (rol) y `P0` (sin esto no hay demo), `P1` (mejora clara), `P2` (si sobra tiempo).
- Tablero (GitHub Project) con los campos Rol, Prioridad y Cuándo (hoy / mañana / jueves). El backlog inicial está en
  [backlog.md](backlog.md).

## Jueves: ensayo y congelamiento
- Mañana del jueves: ensayo general con el guion de demo, en 3 teléfonos con batería.
- **Congelamiento** a la hora acordada: solo arreglos P0 con el OK de los tres; se etiqueta el commit de la demo.
