# Security

## Threat model (this scope)

- Attacker: anyone who can reach `POST /api/chat` (no auth in scope).
- Assets: `GEMINI_API_KEY`, provider quota, server logs.
- Non-goals (documented, not implemented): auth, per-user rate limiting, PII redaction.

## Controls

1. **Key stays server-side.** `lib/ai/client.ts` is only imported by server code (`route.ts` → `generate.ts`). No `NEXT_PUBLIC_GEMINI_API_KEY` exists anywhere (`grep -r NEXT_PUBLIC_GEMINI` → nothing). `.env.local` is gitignored.
2. **Client is untrusted.** Every field is re-validated at runtime (`lib/validation/chat.ts`): body shape, `messages[]` roles/content/lengths/count/total size, `systemInstruction` length, `model` ∈ allowlist, numeric ranges + integerness for `maxOutputTokens`/`topK`.
3. **Allowlisted models.** Raw provider ids are rejected; only registry keys map to a real id server-side. Prevents model-string injection and silent provider switching.
4. **Centralized limits** (`lib/constants/limits.ts`): 50 msgs, 12k chars/msg, 100k total, 8k system, T 0–2, topP 0–1, topK 1–100, maxTokens 1–8192.
5. **Safe errors.** Public messages are generic (`docs` in `route.ts: SAFE_MESSAGES`). Internal detail (`ProviderError.message` with status/quota text) is `console.error`-only. Tests assert no stack leaks.
6. **Correct status codes.** 400 validation/JSON, 429 quota/rate, 503 provider outage, 502 provider rejection/empty, 500 missing key/internal. Never a blanket 500.
7. **No secret logging.** Logs contain kind/status/model only — never the key, never full prompts (only lengths implicitly via validation).

## Residual risks

- No per-IP rate limiting: a public deployment should add it (e.g. middleware + KV) to protect quota.
- Prompts are sent to Google; do not paste secrets into the chat. A future improvement is client-side secret-pattern warning.
- `AbortController` cancels the browser fetch, not the provider call (cost may still incur).

## Verification

- `npm test` (integration asserts 400/429/503/500 + no-leak).
- `grep -r "NEXT_PUBLIC_GEMINI" .` → empty.
- `git status` shows no `.env.local`; `.env.example` has no real secret.
