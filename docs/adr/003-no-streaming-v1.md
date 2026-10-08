# ADR-003 — Sin streaming en v1

- Estado: aceptado.
- Contexto: el streaming mejora la UX pero añade estados parciales, cancelación real y complejidad en Experiment Lab (dos streams concurrentes).
- Decisión: generación normal con `generateContent` + typing indicator; `generate()` queda como seam para `generateContentStream` + fallback más adelante.
- Consecuencias: UX correcta y estable para la práctica; el roadmap documenta el streaming como mejora futura sin romper el contrato `/api/chat`.
