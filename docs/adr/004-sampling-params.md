# ADR-004 — Sampling configurable aunque Gemini 3.x lo desaconseje

- Estado: aceptado.
- Contexto: Google recomienda defaults y en algunos modelos 3.x ignora `temperature/topP/topK`. La práctica exige enseñarlos experimentalmente (casos 2 y 3).
- Decisión: mantenerlos configurables con rangos oficiales, avisar en UI/docs que el comportamiento depende del modelo, y marcar `supportsSamplingParams` en el registry. Recomendar `flash-latest`/`flash-lite` para experimentar.
- Consecuencias: cumplimiento académico honesto sin afirmar que un valor sea universalmente mejor.
