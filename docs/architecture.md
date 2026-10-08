# Architecture

## Layers

```
components/*  (presentational, no business logic)
hooks/useChat.ts  (single chat controller: state, fetch, abort, autoscroll)
app/api/chat/route.ts  (HTTP boundary: parse → validate → generate → map errors)
lib/validation/chat.ts  (runtime gate; TypeScript types are not validation)
lib/ai/generate.ts  (provider adapter; only file that knows @google/genai)
lib/ai/client.ts  (server-only singleton; throws MissingApiKeyError)
lib/ai/models.ts  (allowlist key → providerModelId)
lib/ai/config.ts  (defaults + server-side normalization)
```

## Request lifecycle (`POST /api/chat`)

1. `started = Date.now()` for latency.
2. `await req.json()` in try/catch → `400 INVALID_JSON`.
3. `validateChatRequest(raw)` → `400 VALIDATION_ERROR + details[]` or clean `{messages, config}`.
4. `generate({messages, systemInstruction, modelKey, temperature, maxOutputTokens, topP, topK})`:
   - allowlist check → `ProviderError(bad_request)`.
   - `contents = messages.map(role/parts)` (Gemini roles `user|model`).
   - `config = {systemInstruction, temperature, maxOutputTokens, topP, topK}`.
   - SDK errors → `toProviderError()` (status sniffing + message patterns → rate_limit/unavailable/bad_request/unknown).
5. Empty text → `502 PROVIDER_ERROR` (logged server-side).
6. Success → `{reply, model: providerModelId, usage?, latencyMs}`.
7. Catch: `MissingApiKeyError → 500 MISSING_API_KEY`, `rate_limit → 429`, `unavailable → 503`, else `502/500` with safe messages.

## Why this shape

- Swapping Gemini for another provider = replace `lib/ai/generate.ts` only (route + UI untouched).
- Swapping model ids = edit `MODEL_REGISTRY` only (UI sends keys, never ids).
- Validation is manual (no zod) to keep the dependency surface minimal; it is fully unit-tested.
- No streaming yet: `generate()` is the seam where `generateContentStream` would plug in later without touching validation or UI state shape.
