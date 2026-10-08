# ADR-001 — SDK oficial `@google/genai` y default `gemini-3.5-flash`

- Estado: aceptado.
- Contexto: la práctica menciona modelos antiguos; en 2026 `gemini-2.0-flash` está apagado y `2.5` limitado a usuarios previos. Google recomienda `3.5-flash`/`3.1-flash-lite` para proyectos nuevos. El paquete antiguo `@google/generative-ai` está reemplazado por `@google/genai`.
- Decisión: usar `@google/genai` (`ai.models.generateContent` + `config.systemInstruction`) y defaultear el registry a `gemini-3.5-flash` (GA), con `3.1-flash-lite`, `3.8-flash` y `3.1-pro-preview` como alternativas.
- Consecuencias: los ids antiguos se documentan pero no se permiten (allowlist). Si Google retira un id, se cambia una línea en `lib/ai/models.ts`.
