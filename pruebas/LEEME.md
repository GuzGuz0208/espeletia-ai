# Prueba de punta a punta

`coleccion.py` gana los 24 cromos por la interfaz, con Chrome (Playwright), cámara y GPS simulados.

1. Instala lo necesario: `pip install playwright` y ten Google Chrome instalado (o `playwright install chromium`).
2. Sirve la app desde la carpeta principal: `python3 -m http.server 8765`.
3. Crea los videos de cámara simulada en `/tmp/vid/` (formato .y4m): uno por clase (`otro`, `frailejon`, `pajonal`, `sietecueros`, `musgo`, `laguna`, `roca`, `nevado`, `desconocido`) y `qr.y4m`, que muestra los QR PARAMO-QR-15 a 20, uno tras otro. Ejemplo con ffmpeg:
   `ffmpeg -loop 1 -i foto.jpg -vf "zoompan=z='1.15+0.1*sin(on/18)':d=1:s=640x480:fps=10" -t 6 -pix_fmt yuv420p /tmp/vid/frailejon.y4m`
4. `python3 coleccion.py` (tarda unos 6 minutos, porque la pausa de contemplación dura 2 minutos reales).

`guia_parque.py` prueba el Modo guía y el Paquete del parque (unos 2 minutos). Además de los videos anteriores necesita fotos de prueba en `/tmp/galeria/fotos/<clase>/*.jpg` (frailejon, otro, pajonal; 8 por clase):
- la pausa no se puede desde la casa y el código «aquí» del guía la habilita;
- el QR de una historia que muestra el teléfono del guía, escaneado por otro teléfono, entrega el cromo; reusarlo no da nada;
- el guía confirma un frailejón por QR y el visitante gana el cromo sin Lente entrenada; un QR con firma falsa se rechaza y uno de hace 25 minutos dice «vencido»;
- el equipo carga fotos desde la galería, descarga `parque.json` y un teléfono nuevo, sin entrenar, reconoce y gana el cromo.

`union.py` prueba la unión Lente → chat (unos 2 minutos). Usa el `parque.json` que deja `guia_parque.py` en `/tmp/parque_ui.json` y una foto `/tmp/galeria/desconocido.jpg` (un cuadro del video «desconocido»). Al terminar deja `models/parque.json` como estaba.

Bancos del chat con tema: `preguntas_tema.json`, `preguntas_tema2.json` y `preguntas_tema3.json` (este último escrito al final y medido una sola vez). Se miden con `python3 herramientas/tema_chat.py`.
