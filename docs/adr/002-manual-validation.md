# ADR-002 — Validación runtime manual (sin zod)

- Estado: aceptado.
- Contexto: TypeScript no valida en runtime. Se necesita validar body/roles/longitudes/rangos/allowlist con errores por campo (`details[]`).
- Decisión: validador manual en `lib/validation/chat.ts`, con límites centralizados y 11+ tests unitarios, en vez de añadir `zod`.
- Consecuencias: cero dependencias nuevas; el validador es explícito y auditable. Si el schema crece (streaming, imágenes), re-evaluar `zod`.
