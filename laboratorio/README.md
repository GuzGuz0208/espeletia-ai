# Laboratorio

Páginas para **medir** ideas en un teléfono real. **No son la app**: no van en la lista APP de `sw.js`, necesitan internet y
pueden usar CDN. Nada de aquí se usa con visitantes.

## slm.html: ¿puede un SLM reformular las fichas en el teléfono?
- URL de prueba: `…/laboratorio/slm.html` (por ejemplo https://guzguz0208.github.io/espeletia-ai/laboratorio/slm.html).
- Baja Qwen2.5-0.5B-Instruct (Apache-2.0) con transformers.js 4.3.2: WASM int8 (512 MB) o WebGPU q4f16 (483 MB). Queda guardado
  en el navegador para la próxima vez.
- El modelo corre en un **Web Worker** (`slm-worker.js`): la pantalla no se congela. En la prueba en PC, el bloqueo máximo fue de
  31 ms. Muestra el texto mientras sale y tiene botón **Detener**.
- Dos contextos para comparar: **frase enfocada** (la frase de la ficha que eligió e5) o **ficha completa**.
- Corre 7 preguntas: 6 con cifras y 1 trampa que la ficha no responde. Cada respuesta pasa por el **verificador determinista**:
  - toda cifra y todo nombre propio debe estar en la ficha;
  - una cifra con unidad de medida o de dinero debe tener esa misma unidad en la ficha («2026 pesos» no vale si 2026 es un año);
  - nada de «comestible», «tóxico» ni alertas del volcán;
  - no puede devolver una pregunta ni esquivar.
  Si falla, el visitante vería la ficha original.
- Pasar el verificador **no** significa ser útil: eso lo juzga una persona.
- «Copiar resultados» → pegarlos en el issue #24.

## Resultados del 24-nov
**PC de escritorio, Chrome, WASM int8, sin GPU:**
| Contexto y prompt | Útiles (juicio humano) | Tiempo por respuesta |
|---|---|---|
| Ficha completa, prompt en español | 0 de 7 | mediana 13,5 s (5 s hasta la primera palabra) |
| Ficha completa, prompt en inglés + 1 ejemplo | 1 de 7 | 7 a 18 s |
| **Frase enfocada** + 3 ejemplos en español | 1 a 2 de 7: inventa menos, pero omite la respuesta («abre a las 8:00» sin decir hasta cuándo) o cambia cifras («2026 pesos») | 13 a 19 s (el prompt con ejemplos es más largo) |

**Redmi Note 15 Pro 5G (versión anterior de la página, con el modelo en el hilo principal):** la descarga y la generación
**congelaron el teléfono**, que se calentó mucho. Hubo que salir del navegador y la prueba quedó en la 4 de 7. La página ya usa un
worker; el calor y el consumo siguen, porque el modelo ocupa la GPU o todos los núcleos.

**Ejemplos de fallos:**
- «parque de fútbol de Brasil» (por «Brisas»);
- restaurantes «The Pizza Hut» y «The Mexican Restaurant» en Brisas, en la pregunta trampa;
- «hace frío hasta 25 °C»;
- «Llegarán a 6 glaciares» (la ficha dice 3 de los 6): una cifra real puesta donde no va, que el verificador no puede detectar;
- «Puedo llevar a tu perro» ante la pregunta del dron.

**Conclusión:**
- Un mejor contexto **reduce** los inventos, pero un modelo de 0,5B sigue sin ser confiable en español.
- Un modelo más grande escribiría mejor, pero sería más lento y más pesado, y el de 0,5B ya congeló un teléfono de gama media-alta.
- El verificador atrapa las cifras, unidades y nombres inventados, pero no las respuestas incompletas o inútiles.

Ver la decisión slm-generativo-opcional y la spec respuesta-extractiva.

**Falta medir:** WebGPU en el Redmi Note 15 (velocidad) y un modelo más grande (Qwen2.5-1.5B, ~1,2 GB) para ver si la calidad
cambia.
