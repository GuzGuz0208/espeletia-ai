"""Optimiza el grafo de un modelo ONNX una sola vez, en el computador, para que el celular no lo haga
en cada carga (la app crea las sesiones con graphOptimizationLevel 'disabled').

Nivel «extended» de ONNX Runtime: fusiona operaciones (p. ej. normalización y atención en el modelo
del chat). Se comprobó que las salidas son idénticas (diferencia 0) en Python y en el navegador.

Uso, desde la raíz de la app:
    python3 herramientas/optimizar.py entrada.onnx salida.onnx
    python3 herramientas/partir.py salida.onnx models/e5_small_latino.onnx
"""
import sys
import onnxruntime as ort

if len(sys.argv) != 3:
    sys.exit(__doc__)
so = ort.SessionOptions()
so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_EXTENDED
so.optimized_model_filepath = sys.argv[2]
ort.InferenceSession(sys.argv[1], so, providers=['CPUExecutionProvider'])
print('optimizado ->', sys.argv[2])
