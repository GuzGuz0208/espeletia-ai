# Laboratorio

Páginas para **medir** ideas en un teléfono real. **No son la app**: no van en la lista APP de `sw.js`, necesitan internet y
pueden usar CDN. Nada de aquí se usa con visitantes.

## slm.html: ¿puede un SLM reformular las fichas en el teléfono?
- URL de prueba: `…/laboratorio/slm.html` (por ejemplo https://guzguz0208.github.io/espeletia-ai/laboratorio/slm.html).
- Baja Qwen2.5-0.5B-Instruct (Apache-2.0) con transformers.js 4.3.2: WebGPU q4f16 (483 MB) o WASM int8 (512 MB). Queda guardado
  en el navegador para la próxima vez.
- Corre 7 preguntas: 6 con cifras y 1 trampa que la ficha no responde. Cada respuesta pasa por el **verificador determinista**:
  - toda cifra y todo nombre propio debe estar en la ficha;
  - nada de «comestible», «tóxico» ni alertas del volcán;
  - no puede devolver una pregunta ni esquivar.
  Si falla, el visitante vería la ficha original.
- Pasar el verificador **no** significa ser útil: eso lo juzga una persona.
- «Copiar resultados» → pegarlos en el issue #24.

## Resultado del 24-nov (PC de escritorio, Chrome, WASM int8, sin GPU)
| Prompt | Útiles (juicio humano) | Bloqueadas por el verificador | Tiempo por respuesta |
|---|---|---|---|
| Español, sin ejemplo | 0 de 7 | 4 de 7 | mediana 13,5 s (5 s hasta la primera palabra) |
| Inglés + un ejemplo (el que queda en la página) | 1 de 7 | — | 7 a 18 s |

**Ejemplos de fallos:**
- «parque de fútbol de Brasil» (por «Brisas»);
- restaurantes «The Pizza Hut» y «The Mexican Restaurant» en Brisas, en la pregunta trampa;
- «hace frío hasta 25 °C»;
- «Llegarán a 6 glaciares» (la ficha dice 3 de los 6): una cifra real puesta donde no va, que el verificador no puede detectar;
- «Puedo llevar a tu perro» ante la pregunta del dron.

**Conclusión:** con 0,5B parámetros la calidad en español no alcanza, y en un teléfono sería aún más lento. El verificador atrapa
las cifras y nombres inventados, pero no las respuestas inútiles ni las cifras mal ubicadas. Ver la decisión slm-generativo-opcional
y la spec respuesta-extractiva.

**Falta medir:** WebGPU en el Redmi Note 15 (velocidad) y un modelo más grande (Qwen2.5-1.5B, ~1,2 GB) para ver si la calidad
cambia.
