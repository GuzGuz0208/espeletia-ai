---
estado: propuesta
fecha: 2026-11-24
decisores: R1, R2, R3
---
# Metodología: desarrollo guiado por specs con harness

## Contexto y problema
Tres personas y sus agentes de IA trabajan en paralelo dos días. Sin reglas comunes, los agentes pisan rutas ajenas e inventan.

## Opciones consideradas
1. SDD + harness: decisión → spec → contrato → eval → implementación → CI
2. Trabajo libre con revisión al final

## Decisión
Proponemos **SDD con harness**: cada cambio parte de una spec en `docs/specs/` con criterios verificables, contrato y eval; el agente del rol implementa en su rama; CI es la puerta. El harness son AGENTS.md, el contexto por rol, las specs, los contratos, las evals y los índices generados.

## Consecuencias
- Buenas: menos choques y menos invenciones; todo es trazable.
- Malas o riesgos: cuesta escribir specs; deben ser cortas.
- Cómo se verifica: cada PR cita su spec (plantilla de PR).
