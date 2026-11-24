# Álbum del Páramo: prueba de concepto v3 (opción B + chat sin internet)

App web instalable (PWA) para visitantes del PNN Los Nevados. Funciona **en modo avión** después de abrirla una vez con internet. Corre en Android (Chrome) y en iPhone (Safari) sin pasar por tiendas de apps. Está en español e inglés.

## La experiencia

Es un álbum de cromos impreso de verdad, en risografía a dos tintas: verde frailejón y amarillo flor de frailejón.

1. **Portada.** El visitante escribe su nombre en la etiqueta («Este álbum es de…») y elige idioma. La portada indica si la app ya está lista para usarse sin señal. Al tocar «Abrir el álbum», la tapa se abre como un libro.
2. **Álbum.** Tiene 4 páginas, una por capítulo, con pestañas de índice al borde. Se pasan con un deslizamiento y la hoja gira sobre el lomo. Cada espacio vacío muestra la figura impresa del cromo, su número y cómo se consigue.

   | Capítulo | Cromos | Cómo se ganan |
   |---|---|---|
   | I. El sendero | 6 | GPS, pausa y foto de grupo |
   | II. Flora y paisaje | 8 | Lente (cámara) |
   | III. Fauna | 6 | QR |
   | IV. Historias del guía | 4 | Códigos |

3. **Sobres.** Cada cromo ganado llega en un sobre:
   - el visitante lo rasga con un toque;
   - el cromo sale y se voltea;
   - con «Pegar en el álbum», vuela a su espacio y se estampa;
   - 5 cromos son **brillantes**, con lámina holográfica que reacciona al dedo o a la inclinación del celular.
4. **Caminando no se interrumpe.** Al llegar a una estación, el celular solo vibra y guarda el sobre. Los sobres esperan en el álbum hasta que el grupo se detenga.
5. **Detalle.** Al tocar un cromo pegado se ve en grande. Al tocarlo otra vez se voltea, y el dorso trae el dato oficial con su fuente, la estación, la fecha y el dueño. Desde ahí se puede guardar la imagen, pasarla al grupo, escucharla o cambiar la ilustración por una foto propia.
6. **Lente.** La mira se cierra sobre lo que reconoce, y Fray, el Cóndor o Magma cuentan el dato. Si la Lente duda, dice «No estoy seguro, pregúntale a tu guía». Tiene modo QR y modo foto, con cambio a cámara frontal para la selfie de grupo.
7. **Mapa.** Un pliego topográfico con las curvas de nivel del volcán, las estaciones y el punto «estás aquí». No descarga mapas: se dibuja solo.
8. **Pausa de contemplación.** 2 minutos sin tocar la pantalla. Si alguien la toca, el tiempo vuelve a empezar.
9. **Final.** Al completar una página caen hojas de frailejón. Al llegar a 24/24 aparece un sello, y el álbum completo se descarga como una sola imagen.
10. **Pregúntale a Fray (nuevo en la v3).** Es un chat que funciona sin internet y responde solo con fichas oficiales del parque, siempre con su fuente. Se ve más abajo.

**Ajustes** (botón «⋯»): nombre, idioma, apariencia (Papel, Noche para ahorrar batería, o Automática), lectura en voz alta, vibración, descargar el álbum y estado «lista para usar sin señal».

## Pregúntale a Fray: chat sin internet

**Qué es.** Es un buscador semántico, no un generador de texto. Un modelo de lenguaje pequeño, que corre dentro del celular, entiende la pregunta en lenguaje natural. Con eso elige la **ficha oficial** más parecida y la muestra tal cual, con su fuente. El chat no puede inventar datos: o muestra una ficha oficial o responde «No tengo esa información oficial. Pregúntale a tu guía».

**El modelo**
- Es **multilingual-e5-small** (licencia MIT), cuantizado a int8.
- Le podé el vocabulario a escritura latina (español, inglés, francés, alemán, portugués…). Así bajó de 135 MB a **70 MB** y da resultados **idénticos** (diferencia 0; la comprobación está en `herramientas/podar.py`).
- El tokenizador es `@huggingface/tokenizers` (37 KB) y da los mismos tokens que la versión de Python.
- Responde en unos **35 ms** por pregunta en un computador. En un celular de gama media debería tardar algo más, pero falta medirlo.

**El contenido** está en `chat.json`:
- 66 fichas en español e inglés, cada una con fuente: página oficial del PNN Los Nevados, reglamentación para visitantes, descripción del PNN 2019, WCS y Cenicafé.
- Unas 900 formas de preguntar.
- 48 ejemplos de preguntas fuera de tema.

**Reglas de seguridad fijas**, que no dependen del modelo:
- Si la pregunta menciona una emergencia, primero sale la ficha de emergencia.
- Si menciona comer algo, o algo venenoso o tóxico, primero sale la ficha «no pruebes plantas, pregúntale a tu guía».
- El estado del volcán **nunca** se da: el chat remite al Servicio Geológico Colombiano y al guía.
- Para servicios sin información oficial (baños, comida, parqueadero, señal, wifi) responde que no tiene esa información y da el teléfono de la UTON.

**Si el modelo no carga** (por ejemplo, por falta de memoria), el chat sigue funcionando solo con palabras clave.

### Cuánto acierta (medido, no estimado)

| Banco de preguntas | Con respuesta oficial | Sin respuesta oficial |
|---|---|---|
| Banco 1: 100 preguntas (la mitad se usó para calibrar; reporto todas) | 77 de 83 correctas (93 %), 6 con una ficha vecina | 13 de 17 «no lo sé» |
| **Banco 2: 40 preguntas nuevas, nunca usadas para ajustar** | **29 de 32 correctas (91 %)**, 3 con una ficha vecina | 6 de 8 «no lo sé» |

- **Cuando se equivoca,** muestra una ficha oficial de un tema vecino (por ejemplo, «no recoger plantas» en vez de «sanciones»), no un dato inventado. Si dos fichas quedan muy parejas, muestra la segunda como «Relacionado».
- **Las preguntas en inglés** se responden en inglés aunque la app esté en español.
- **Cómo se evitó la trampa:** durante el trabajo detecté que algunas formas de preguntar que había escrito eran casi iguales a preguntas del banco de prueba. Las quité todas (20) antes de medir.

### Cambiar o validar fichas

1. Edita `chat.json`: el texto oficial en `es` y `en`, las formas de preguntar en `q` y `qen`, y la `fuente`.
2. Regenera el índice con `python3 herramientas/indice_chat.py`. Necesita `onnxruntime`, `tokenizers` y `numpy`; une el modelo desde sus partes por su cuenta. Recalibra los umbrales y reporta los aciertos.
3. Comprueba que el navegador dé lo mismo que Python con `herramientas/paridad_chat.py`.
4. Sube `VERSION` en `sw.js`.

**Importante:** las fichas son un **borrador** redactado a partir de fuentes oficiales. Antes de usarlas con visitantes, el PNN debe validarlas, sobre todo tarifas, horarios, teléfonos y restricciones de salud.

**Ojo con la fecha de la demo:** según la página oficial, el parque cierra al ecoturismo desde el cuarto lunes de noviembre hasta el viernes (este año, del 23 al 27). En cierres anteriores Brisas siguió abierto; confírmenlo con el parque.

## Publicarla (necesita HTTPS por la cámara y el GPS)

- **Netlify conectado al repositorio (recomendado):** Add new site → Import from GitHub → este repo. No hay que compilar nada: `netlify.toml` publica la raíz. Cada `git push` actualiza el sitio.
- **Netlify Drop:** arrastra la **carpeta** (con `index.html` en la raíz, no una carpeta dentro de otra) a https://app.netlify.com/drop.
- **GitHub Pages** o cualquier hosting estático con HTTPS también sirve. No necesita servidor.

**Archivos grandes.** El motor WASM y los dos modelos van partidos en trozos de 8 MB en `models/partes/`, con su tamaño y huella SHA-256 en `models/partes.json`. La app (`js/motor.js`) los une y verifica al cargar. Así ningún archivo pasa de 8 MB y lo aceptan Netlify Drop, GitHub (que advierte desde 50 MB) y GitHub Pages. Para cambiar un modelo: `python3 herramientas/partir.py nuevo.onnx models/mnv2_embed.onnx`. Para recuperar el original: `python3 herramientas/partir.py --unir models/e5_small_latino.onnx salida.onnx`.

**Si la IA no carga:** Ajustes muestra el estado de la Lente y del chat. Si alguno falla, «Ver la causa» dice exactamente qué archivo faltó o qué error dio, y hay un botón para reintentar.

**En cada celular**, con internet y antes de subir:
1. Abre la URL.
2. En la portada, espera a que diga **«Listo para usar sin señal»** (descarga unos 95 MB: la Lente y el chat).
3. Menú del navegador → «Instalar app» o «Agregar a la pantalla principal».
4. Prueba en modo avión.

Para probar en un computador: dentro de la carpeta, corre `python3 -m http.server 8000` y abre `http://localhost:8000/?demo`. El modo demo permite simular la llegada a cada estación.

## Enseñarle a la Lente (Modo equipo, PIN 2611)

Se entra por Ajustes («⋯») → «Modo equipo».

1. En «Enseñar a la Lente», toca **+ Foto** de 15 a 30 veces por clase. Si mantienes presionado el botón, toma una ráfaga: muévete un poco para variar el ángulo y la luz.
2. Llena siempre **«Otra cosa»** con personas, carros, cielo y el piso del sendero. Así la Lente dice «no estoy seguro» en vez de adivinar.
3. La Lente no ofrece cromos hasta tener al menos 2 clases con 5 fotos o más.
4. **Exportar modelo** guarda un `.json` con las «huellas» de las fotos (no las fotos). Con **Importar modelo** se carga en los demás celulares.

**Calibración.** Con fotos reales, dos escenas distintas tienen una similitud de 0,34 a 0,56 y la misma escena, de 0,76 a 0,95. Por eso la confianza exige una similitud mínima de 0,50 a 0,68, además del voto de los vecinos y del umbral de 70 %. Esto corrige el error de la v1, en la que una sola clase entrenada hacía que todo pareciera esa clase. Los valores se ajustan en `paquete.json` → `camara`.

Para la demo del 26, se puede entrenar con fotos impresas o en pantalla.

## Antes de usarla con visitantes reales

- **Coordenadas:** las de `paquete.json` son aproximadas. En campo, usa «Fijar aquí» en cada estación (exige una precisión de 30 m o mejor). Lo fijado queda guardado aparte y no se pierde cuando se actualiza el paquete.
- **Estaciones 2 y 3:** los nombres están por confirmar con UTON.
- **Textos (es/en):** son borradores con fuente. Persona 1 debe validarlos con el PNN. La traducción al inglés también necesita revisión.
- **QR en la señalética:** requiere permiso del PNN. Los códigos para imprimir están en el Modo equipo.

## Probado de punta a punta

La prueba está en `pruebas/coleccion.py`. Usa Playwright con Chrome, perfil persistente, cámara simulada con videos de fotos reales en movimiento y GPS simulado. Cada cromo se ganó **por la interfaz**, como lo haría un visitante:

- La portada guarda el nombre.
- El Modo equipo funciona con PIN y entrenamiento.
- Con una sola clase entrenada, la Lente no inventa cromos.
- **GPS:** se caminó por las 4 estaciones. Quedaron 4 sobres esperando sin interrumpir, y se abrieron y pegaron.
- **Códigos:** 4 códigos del guía, y rechaza el incorrecto.
- **Fotos:** funcionan la foto de grupo y «Ponerle mi foto».
- **Pausa:** 2 minutos reales; tocar la pantalla la reinicia.
- **Lente:** 7 clases reconocidas, además del segundo frailejón. Una imagen no entrenada responde «No estoy seguro».
- **QR:** los 6 de fauna, leídos con la cámara.
- **Final:** **24/24**, con celebración, descarga del álbum (1600×2246) y del cromo (1080×1620).
- **Persistencia:** al reabrir, el álbum sigue completo.
- **Modo avión:** cargan la app, el álbum y el modelo.
- **Ajustes:** funcionan el cambio a inglés y el tema noche.
- No hubo errores en la consola.

**Falta probar en celulares reales:** velocidad en gama baja (4 GB), la Lente con luz de páramo y la voz del sistema en cada marca.

## Estructura

```
index.html, styles.css, manifest.json, sw.js   interfaz y modo sin señal (avisa el progreso de descarga y se actualiza sola)
_headers, netlify.toml   configuración de Netlify (caché del service worker y de los modelos)
paquete.json      Paquete Páramo: estaciones, clases, capítulos, 24 cromos es/en, fuentes, calibración de la Lente
js/app.js         arranque, navegación y pausa de contemplación
js/estado.js      colección, reglas, persistencia y miniaturas de fotos
js/album.js       páginas, giro de hoja, espacios, detalle y códigos
js/sobre.js       abrir sobres: rasgar, voltear, volar al espacio y estampar
js/cromo.js       componente de cromo (frente, dorso y brillo holográfico)
js/lente.js       cámara: reconocer, QR y foto
js/motor.js       carga compartida de ONNX Runtime y de los modelos partidos, con diagnóstico de errores
js/ml.js          MobileNetV2 (ONNX) + k-NN con piso de similitud
js/mapa.js        GPS, geocercas y pliego topográfico
js/portada.js     portada y estado sin señal
js/ajustes.js     ajustes, PIN y Modo equipo
js/exportar.js    PNG de cromo y de álbum completo
js/chat.js        motor del chat: embedding de la pregunta, búsqueda híbrida (significado + palabras), umbrales y reglas de seguridad
js/chatui.js      pantalla «Pregúntale a Fray»
chat.json         66 fichas oficiales es/en con fuentes, formas de preguntar y ejemplos fuera de tema
js/art.js         24 ilustraciones risográficas y los 3 personajes (originales)
js/i18n.js        textos es/en
js/celebrar.js    chispas y lluvia de hojas
lib/              ONNX Runtime Web 1.31 (sus .mjs renombrados a .js), jsQR, qrcode-generator, @huggingface/tokenizers
models/           partes/ (motor WASM, modelo de la Lente y del chat, en trozos de 8 MB) · partes.json · e5_tokenizer.json · chat_indice.json
herramientas/     partir/unir modelos, poda del modelo, índice y calibración del chat, comparación JS vs Python
fonts/            Bricolage Grotesque (variable) y Atkinson Hyperlegible, ambas con licencia OFL
pruebas/          prueba de punta a punta con Playwright
```

Para cambiar textos o cromos, edita `paquete.json`. Si cambias archivos de la app, sube `VERSION` en `sw.js`.
