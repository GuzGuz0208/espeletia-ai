# Prueba: LLM nativo en el teléfono (sin programar nada)

Antes de construir un APK, medimos si un LLM **nativo** (fuera del navegador) responde rápido y bien en el teléfono. Usamos dos
apps abiertas ya publicadas que corren modelos 100 % offline:

| App | Motor | Licencia | Dónde |
|---|---|---|---|
| **PocketPal AI** | llama.cpp (modelos GGUF) | MIT, código en github.com/a-ghorbani/pocketpal-ai | Google Play o App Store |
| **Google AI Edge Gallery** | LiteRT-LM (CPU o GPU) | código en github.com/google-ai-edge/gallery | Google Play (Android 12+) |

Las dos muestran los **tokens por segundo**. PocketPal tiene además una página de *benchmark* con la memoria usada.

## Qué probar (con wifi para bajar el modelo; después, en modo avión)
1. **PocketPal:** bajar `Qwen2.5-0.5B-Instruct` (GGUF Q4_K_M, unos 400 MB) y luego `Qwen2.5-1.5B-Instruct` (Q4_K_M, ~1 GB).
2. **AI Edge Gallery:** probar el modelo Gemma más pequeño que ofrezca la app (Gemma 3 1B o Gemma 4 E2B) en **GPU** y en **CPU**.
3. En **modo avión**, pegar como mensaje de sistema:
   > Eres Fray, guía del parque. Reescribe el DATO como respuesta corta y amable a la PREGUNTA, en una sola frase en español. Copia
   > las cifras y los nombres tal cual. No agregues nada que no esté en el DATO. Si el DATO no responde la PREGUNTA, responde
   > exactamente: No tengo esa información oficial; pregúntale a tu guía.
4. Y como mensajes, uno por uno:
   - `PREGUNTA: ¿hasta qué hora puedo entrar a Brisas? DATO: El sector Brisas-Kumanday abre todos los días de 8:00 a. m. a 2:00 p. m.`
   - `PREGUNTA: ¿cuánto paga un extranjero por entrar? DATO: Tarifas 2026 en Brisas-Kumanday: menores de 25 años, $12.500; mayores de 25, $24.500; extranjeros no residentes, $68.000.`
   - `PREGUNTA: ¿cuántos glaciares le quedan a Colombia? DATO: Los glaciares ocupan cerca del 1,82 % del parque, que protege 3 de los 6 glaciares que le quedan a Colombia.`
   - `PREGUNTA: ¿puedo llevar mi dron? DATO: Los drones están prohibidos (Resolución 0543 de 2018).`
   - `PREGUNTA: ¿hay restaurante en Brisas? DATO: El sector Brisas-Kumanday abre todos los días de 8:00 a. m. a 2:00 p. m.` (trampa: debe decir «No tengo esa información oficial…»)

## Qué anotar (por modelo)
| Modelo | App y motor | Tokens/s | Segundos hasta la primera palabra | ¿Respuestas correctas? (de 5) | ¿Se calentó o se trabó? | RAM usada |
|---|---|---|---|---|---|---|
| Qwen2.5-0.5B Q4 | PocketPal | | | | | |
| Qwen2.5-1.5B Q4 | PocketPal | | | | | |
| Gemma (el más pequeño) | Edge Gallery · GPU | | | | | |
| Gemma (el más pequeño) | Edge Gallery · CPU | | | | | |

Pega la tabla en el issue #24.

## Cómo se decide
- Para que se sienta como conversación hace falta, a ojo, **≥10 tokens/s y ≤2 s hasta la primera palabra** con respuestas de 1 o 2
  frases (unos 30-40 tokens → 3-4 s en total).
- Si un modelo de **1-1,5B** cumple eso y acierta **≥4 de 5** sin trabar el teléfono, vale la pena el APK Android con LLM nativo
  (decisión apk-android-llm-nativo).
- Si solo cumple el de 0,5B, la calidad no alcanza: se queda la respuesta extractiva.
