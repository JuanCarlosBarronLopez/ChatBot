# Gemini Chat Lab — Laboratorio profesional de interacción con LLM

Un pequeño laboratorio profesional de interacción con LLM presentado como chatbot.
Next.js (App Router) + TypeScript estricto + Tailwind + SDK oficial `@google/genai`.
El navegador nunca toca la API key: toda la generación ocurre en `POST /api/chat`.

> **Práctica académica:** “Chatbot Inteligente con Next.js y la API de Google Gemini”.
> Este README incluye al final la sección **Academic Requirements Mapping**.

---

## Características

- Chat full-stack con historial, timestamps, Markdown + GFM, bloques de código y copiar respuesta.
- Panel de parámetros: modelo (registry), System Instruction, temperature, maxOutputTokens, top-P, top-K — cada uno con label, valor, rango y explicación.
- **Experiment Lab**: ejecuta el mismo prompt con Config A vs Config B y compara respuesta, modelo, parámetros, tokens y latencia.
- Observabilidad discreta: input/output/total tokens (cuando el proveedor los reporta), modelo y latencia. Nada se inventa.
- Estados: vacío con sugerencias, typing indicator, loading, error con retry/regenerar, limpiar conversación, detener generación.
- Atajos: `Enter` envía, `Shift+Enter` salto de línea. Textarea accesible, foco visible, `prefers-reduced-motion`.
- Responsive: en desktop el panel es sidebar; en mobile/tablet es drawer. Tabs Chat / Experiment Lab.

## Stack

| Capa | Elección |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Lenguaje | TypeScript `strict` + `noUncheckedIndexedAccess`, sin `any` |
| Estilos | Tailwind CSS v4, dark-first graphite + acento violeta/azul |
| LLM | `@google/genai` v2 (oficial vigente), solo en servidor |
| Iconos | lucide-react |
| Markdown | react-markdown + remark-gfm |
| Tests | Vitest + Testing Library + jsdom (32 tests) |
| Lint | ESLint flat + `eslint-config-next` |

## Arquitectura

```
UI (components/chat, settings, lab)
  ↓  useChat (hooks/useChat.ts — único controlador de estado)
POST /api/chat  (app/api/chat/route.ts — parsea, valida, delega, mapea errores)
  ↓  validateChatRequest (lib/validation/chat.ts — runtime validation real)
  ↓  generate() (lib/ai/generate.ts — servicio/adaptador, única capa que conoce el SDK)
  ↓  getGeminiClient() (lib/ai/client.ts — singleton server-only, GEMINI_API_KEY)
  ↓  GoogleGenAI.models.generateContent (providerModelId resuelto desde MODEL_REGISTRY)
```

Reglas:
- Los componentes no contienen lógica de negocio: delegan a `useChat`.
- `route.ts` no llama al SDK directamente: llama a `generate()`.
- El cliente propone `config`; el servidor valida y normaliza. Los valores fuera de rango se rechazan con `400 + details`.
- El navegador envía **claves** del registry (`flash-latest`), jamás ids del proveedor. El servidor mapea clave → `providerModelId`.

Estructura:

```
app/  api/chat/route.ts  layout.tsx  page.tsx  globals.css
components/  chat/  settings/  lab/  layout/  ui/
hooks/  useChat.ts
lib/  ai/{client,generate,models,config}  validation/chat  constants/limits  utils/format
types/  chat  ai  api
tests/  unit  integration  ui
docs/  architecture.md  security.md  adr/
```

## Seguridad

- `GEMINI_API_KEY` solo en servidor (`process.env` en `lib/ai/client.ts`). No existe ninguna variable `NEXT_PUBLIC_*`.
- `.env.local` en `.gitignore`; `.env.example` sin secretos.
- Validación server-side de body, roles, longitudes, tamaño de historial, system instruction, modelo (allowlist) y los 4 parámetros numéricos.
- Límites centralizados en `lib/constants/limits.ts`.
- Errores seguros: el cliente recibe mensajes genéricos; el detalle interno solo va a logs del servidor. Nunca se devuelven stack traces ni keys.
- Status codes: `400` inválida, `429` rate/quota, `502/503` proveedor, `500` interna. Nunca todo es 500.

Ver `docs/security.md`.

## Variables de entorno

```bash
cp .env.example .env.local   # luego edita GEMINI_API_KEY
```

| Variable | Requerida | Descripción |
|---|---|---|
| `GEMINI_API_KEY` | sí | Key de [Google AI Studio](https://aistudio.google.com/apikey). Solo servidor. |

## Instalación y ejecución

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción (Turbopack)
npm start
npm run typecheck
npm run lint
npm test
```

## Configuración y parámetros LLM

| Parámetro | Rango validado | Default | Notas |
|---|---|---|---|
| modelo | claves del registry | `flash-latest` → `gemini-3.5-flash` | Allowlist; el id real puede cambiar sin tocar la UI |
| systemInstruction | 0–8000 chars | asistente útil/conciso | Caso 1: cambia rol/tono y re-ejecuta |
| temperature | 0.0–2.0 | 1.0 | Caso 3: `0.0` vs `1.5`, mismo prompt |
| maxOutputTokens | 1–8192 int | 1024 | Caso 2: `64` + prompt largo = corte visible |
| topP | 0.0–1.0 | 0.95 | No mover T/top-P/top-K a la vez (recomendación Google) |
| topK | 1–100 int | 40 | `1` = greedy decoding |

> **Gemini 3.x:** Google recomienda dejar sampling en defaults y documenta que en algunos modelos recientes (`3.7-flash`, `3.6-flash`, `3.5-flash-lite`) temperature/top-P/top-K son ignorados. Por eso el registry marca `supportsSamplingParams` y la UI lo avisa. Para experimentar con sampling se recomienda `flash-latest` (`gemini-3.5-flash`) o `flash-lite`. El comportamiento exacto depende del modelo — no se afirma que un valor sea universalmente “mejor”.

### Model registry

```ts
// lib/ai/models.ts
"flash-latest"  → gemini-3.5-flash       (recomendado, GA May-2026)
"flash-lite"    → gemini-3.1-flash-lite  (rápido y económico)
"flash-max"     → gemini-3.8-flash       (más capaz; muestreo automático)
"pro-reasoning" → gemini-3.1-pro-preview (razonamiento, preview)
```

Ids académicos antiguos (`gemini-1.5-flash`, `gemini-2.0-flash`) están **retirados** (2.0 apagado en 2026) y por eso **no** están en el allowlist. Se documentan aquí como referencia y el default usa el reemplazo GA recomendado por Google.

## Experiment Lab

Pestaña junto al chat. Flujo:
1. Escribe un prompt común (o usa un preset).
2. Define System A/B y Temperature A/B (el resto hereda del panel).
3. “Ejecutar comparación A/B” → dos llamadas `POST /api/chat` en paralelo.
4. Compara lado a lado: respuesta renderizada, modelo real, params, latencia, tokens (`usageMetadata` cuando existe) y system usada.

Presets para los casos académicos: *Temperature 0.0*, *Temperature 1.5*, *Max tokens 64*.

## Testing

```bash
npm test
```

- **Unit (20):** `tests/unit/validation.test.ts` (roles, longitudes, historial, rangos, allowlist), `models.test.ts` (registry, default GA, rechazo de ids crudos/retirados), `config.test.ts` (normalización, clamp, redondeo, truncado).
- **Integración (8):** `tests/integration/api-chat.test.ts` — JSON inválido→400, payload inválido→400+details, modelo desconocido→400 sin llamar al proveedor, key ausente→500 `MISSING_API_KEY`, rate→429, outage→503, éxito con `reply/model/usage/latencyMs`, sin fuga de stacks.
- **UI (4):** `tests/ui/chat.test.tsx` — Enter envía, Shift+Enter no envía, empty→envío→clear, slider de temperatura accesible.

## Decisiones técnicas

- Sin `zod`/`yup`: validación manual pequeña, sin dependencias, totalmente testeada. (Ver ADR-002.)
- Sin streaming: se priorizó estabilidad y cumplimiento académico; la arquitectura (`generate()` aislado) permite añadir SSE/chunks después sin tocar la UI. (Ver ADR-003.)
- Sin persistencia/BD/auth/RAG: fuera del alcance; no se añadió sobreingeniería.
- `temperature/topP/topK` configurables aunque Google los desaconseje en 3.x, porque la práctica exige enseñarlos experimentalmente — con aviso honesto en UI y docs.

Ver `docs/adr/`.

## Limitaciones

- Sin streaming (respuesta completa; typing indicator cubre la espera).
- Sin persistencia: limpiar/recargar pierde el historial.
- Sin cancelación del lado del proveedor (`AbortSignal` del SDK no se propaga; el botón Detener cancela el fetch).
- Tokens/latencia solo si el proveedor los reporta; si no, se muestra “no reportado”.
- Algunos modelos ignoran sampling params (avisado en UI).

## Roadmap (no implementado a propósito)

- Streaming vía `generateContentStream` + fallback.
- Historial persistente local (localStorage) con export/import.
- Comparación A/B con más de 2 configs y seed fijo para reproducibilidad.
- Límites de tasa por IP cuando haya despliegue público.

---

## Academic Requirements Mapping

| Requisito de la práctica | Implementación | Cómo demostrarlo |
|---|---|---|
| Full-stack Next.js App Router + TS + Tailwind | `app/`, `strict`, Tailwind v4 | `npm run dev/build`, `typecheck` |
| SDK oficial solo en backend | `lib/ai/*` server-only; ningún `NEXT_PUBLIC_GEMINI_API_KEY` | Buscar `NEXT_PUBLIC` → 0 resultados; `getGeminiClient` solo importado en servidor |
| Parametrizar modelo | `ModelSelector` + `MODEL_REGISTRY` | Cambiar modelo y ver `model` en la respuesta |
| System Instructions | textarea + `config.systemInstruction` en `generate()` | Caso 1: Lab con sys A formal vs sys B pirata |
| Temperature | slider 0–2 | Caso 3: Lab `0.0` vs `1.5`, mismo prompt |
| Max Output Tokens | slider 64–8192 | Caso 2: `64` + “historia larga” → corte visible |
| Top-P | slider 0–1 | Mover y comparar diversidad |
| Top-K | slider 1–100 | `1` vs `40` y comparar |
| Separación de responsabilidades | UI → `useChat` → route → validation → `generate()` → SDK | `docs/architecture.md` |
| Tipado estricto | `types/`, `strict`, `noUncheckedIndexedAccess`, sin `any` | `npm run typecheck`, grep `any` |
| Validación de inputs | `lib/validation/chat.ts` | Tests unit + `400 + details` con payload malo |
| Manejo robusto de excepciones | `ProviderError`/`MissingApiKeyError`, errores seguros, status correctos | Tests integración; forzar sin key / prompt inválido |
| Historial de mensajes | `useChat.messages` + render | Enviar varios mensajes |
| Panel de parámetros | `ConfigPanel` lateral + drawer móvil | Abrir en desktop y móvil |
| Endpoint `/api/chat` | `app/api/chat/route.ts` | `curl -X POST /api/chat` |
| Integración Gemini | `ai.models.generateContent` con `config` | Respuesta real con `GEMINI_API_KEY` |
| Manejo de errores | banner con retry, 400/429/502/503/500 | Probar sin key, con JSON malo, con rate |
| Interfaz responsive | grid + drawer, Tailwind breakpoints | DevTools 360px / 768px / 1440px |

### Casos de prueba reproducibles

1. **System Instruction:** Lab → prompt “¿por qué el cielo es azul?” → sys A “asistente formal” vs sys B “pirata entusiasta” → tono/rol distintos, mismo modelo.
2. **Max tokens:** panel o Lab → `maxOutputTokens=64` → “Escribe una historia larga…” → respuesta cortada; subir a `1024` → completa.
3. **Temperature:** Lab → mismo prompt “microcuento de ciencia ficción” → A `T=0.0` (estable, repetible) vs B `T=1.5` (variado/creativo). Repetir B muestra variación; A es casi determinista.
