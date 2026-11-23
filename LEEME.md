# Álbum del Páramo: prueba de concepto v2 (opción B)

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

**Ajustes** (botón «⋯»): nombre, idioma, apariencia (Papel, Noche para ahorrar batería, o Automática), lectura en voz alta, vibración, descargar el álbum y estado «lista para usar sin señal».

## Publicarla (necesita HTTPS por la cámara y el GPS)

- **Netlify Drop:** arrastra la carpeta `album-paramo` a https://app.netlify.com/drop.
- **GitHub Pages** o cualquier hosting estático con HTTPS también sirve. No necesita servidor.

**En cada celular**, con internet y antes de subir:
1. Abre la URL.
2. En la portada, espera a que diga **«Listo para usar sin señal»** (descarga unos 25 MB).
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
index.html, styles.css, manifest.json, sw.js   interfaz y modo sin señal (avisa el progreso de descarga)
paquete.json      Paquete Páramo: estaciones, clases, capítulos, 24 cromos es/en, fuentes, calibración de la Lente
js/app.js         arranque, navegación y pausa de contemplación
js/estado.js      colección, reglas, persistencia y miniaturas de fotos
js/album.js       páginas, giro de hoja, espacios, detalle y códigos
js/sobre.js       abrir sobres: rasgar, voltear, volar al espacio y estampar
js/cromo.js       componente de cromo (frente, dorso y brillo holográfico)
js/lente.js       cámara: reconocer, QR y foto
js/ml.js          MobileNetV2 (ONNX) + k-NN con piso de similitud
js/mapa.js        GPS, geocercas y pliego topográfico
js/portada.js     portada y estado sin señal
js/ajustes.js     ajustes, PIN y Modo equipo
js/exportar.js    PNG de cromo y de álbum completo
js/art.js         24 ilustraciones risográficas y los 3 personajes (originales)
js/i18n.js        textos es/en
js/celebrar.js    chispas y lluvia de hojas
lib/              ONNX Runtime Web 1.31 (WASM), jsQR, qrcode-generator
models/           mnv2_embed.onnx (MobileNetV2 del ONNX Model Zoo, sin la capa final)
fonts/            Bricolage Grotesque (variable) y Atkinson Hyperlegible, ambas con licencia OFL
pruebas/          prueba de punta a punta con Playwright
```

Para cambiar textos o cromos, edita `paquete.json`. Si cambias archivos de la app, sube `VERSION` en `sw.js`.
