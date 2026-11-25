# Componentes de terceros y sus licencias

Textos completos en esta carpeta. Detalle, fuentes y lo descartado en [docs/licencias.md](../docs/licencias.md).
La app debe mostrar estos créditos en Ajustes → «Créditos y licencias» (pendiente, R2).

| Componente | Dónde está | Licencia | Texto |
|---|---|---|---|
| multilingual-e5-small (versión podada e int8) | `models/partes/e5_small_latino.onnx.*` | MIT | [MIT-multilingual-e5-small.txt](MIT-multilingual-e5-small.txt) |
| MobileNetV2 del ONNX Model Zoo (`mobilenetv2-12`, github.com/onnx/models), sin el clasificador y optimizado. Verificado el 24-nov: los 103 tensores de pesos y las salidas son idénticos a los del Zoo cortado en el tensor `472` | `models/partes/mnv2_embed.onnx.*` | Apache-2.0 | [Apache-2.0.txt](Apache-2.0.txt) |
| ONNX Runtime Web 1.31.1 | `lib/ort.wasm.min.js`, `lib/ort-wasm-simd-threaded.*` | MIT © Microsoft Corporation | [MIT-onnxruntime-web.txt](MIT-onnxruntime-web.txt) |
| @huggingface/tokenizers | `lib/tokenizers.min.js` | Apache-2.0 | [../lib/tokenizers.LICENSE](../lib/tokenizers.LICENSE) |
| jsQR (github.com/cozmo/jsQR) | `lib/jsQR.js` | Apache-2.0 | [Apache-2.0.txt](Apache-2.0.txt) |
| QR Code Generator © 2009 Kazuhiko Arase | `lib/qrcode.js` | MIT. «QR Code» es marca registrada de DENSO WAVE INCORPORATED | [MIT-qrcode-generator.txt](MIT-qrcode-generator.txt) |
| Bricolage Grotesque © 2022 The Bricolage Grotesque Project Authors | `fonts/bricolage-*.woff2` | SIL OFL 1.1 | [OFL-bricolage-grotesque.txt](OFL-bricolage-grotesque.txt) |
| Atkinson Hyperlegible © 2020 Braille Institute of America, Inc. | `fonts/atkinson-*.woff2` | SIL OFL 1.1 | [OFL-atkinson-hyperlegible.txt](OFL-atkinson-hyperlegible.txt) |
| Copernicus DEM GLO-30 | `models/relieve.*` | Licencia Copernicus COP-DEM-GLO-30-F (uso comercial permitido) | Atribución obligatoria abajo |

## Atribución obligatoria del relieve (licencia Copernicus, art. 6)
> produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under
> COPERNICUS by the European Union and ESA; all rights reserved

> The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the
> Copernicus WorldDEM-30.

Los datos se modificaron: recorte, promedio a celdas de unos 60 m y sombreado.
