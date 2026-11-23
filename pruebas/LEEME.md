# Prueba de punta a punta

`coleccion.py` gana los 24 cromos por la interfaz, con Chrome (Playwright), cámara y GPS simulados.

1. Instala lo necesario: `pip install playwright` y ten Google Chrome instalado (o `playwright install chromium`).
2. Sirve la app desde la carpeta principal: `python3 -m http.server 8765`.
3. Crea los videos de cámara simulada en `/tmp/vid/` (formato .y4m): uno por clase (`otro`, `frailejon`, `pajonal`, `sietecueros`, `musgo`, `laguna`, `roca`, `nevado`, `desconocido`) y `qr.y4m`, que muestra los QR PARAMO-QR-15 a 20, uno tras otro. Ejemplo con ffmpeg:
   `ffmpeg -loop 1 -i foto.jpg -vf "zoompan=z='1.15+0.1*sin(on/18)':d=1:s=640x480:fps=10" -t 6 -pix_fmt yuv420p /tmp/vid/frailejon.y4m`
4. `python3 coleccion.py` (tarda unos 6 minutos, porque la pausa de contemplación dura 2 minutos reales).
