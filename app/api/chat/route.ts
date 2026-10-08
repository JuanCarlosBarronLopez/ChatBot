import { NextResponse } from "next/server";
import { validateChatRequest } from "@/lib/validation/chat";
import { generate, ProviderError } from "@/lib/ai/generate";
import { MissingApiKeyError } from "@/lib/ai/client";
import type { ApiErrorBody } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAFE_MESSAGES = {
  INVALID_JSON: "Invalid JSON body.",
  MISSING_KEY:
    "The server is not configured with a Gemini API key. Set GEMINI_API_KEY and try again.",
  RATE_LIMIT: "The model is rate-limited right now. Please wait a moment and retry.",
  UNAVAILABLE: "The model provider is temporarily unavailable. Please retry shortly.",
  INTERNAL: "Could not generate a response. Please try again.",
} as const;

function err(body: ApiErrorBody, status: number): NextResponse<ApiErrorBody> {
  return NextResponse.json(body, { status });
}

/**
 * POST /api/chat
 * 1. check server config (lazy, via client factory)  2. parse JSON
 * 3. validate payload  4. call AI service  5. return reply + metadata
 */
export async function POST(req: Request): Promise<NextResponse> {
  const started = Date.now();

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return err({ error: SAFE_MESSAGES.INVALID_JSON, code: "INVALID_JSON" }, 400);
  }

  const validation = validateChatRequest(raw);
  if (!validation.ok) {
    return err(
      {
        error: "Invalid request.",
        code: "VALIDATION_ERROR",
        details: validation.issues,
      },
      400,
    );
  }

  const { messages, config } = validation.data;

  try {
    const result = await generate({
      messages,
      systemInstruction: config.systemInstruction,
      modelKey: config.model,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      topP: config.topP,
      topK: config.topK,
    });

    if (!result.text || result.text.trim().length === 0) {
      // Provider returned nothing usable — treat as a provider error, not a crash.
      console.error("[api/chat] empty provider response", {
        model: result.providerModelId,
      });
      return err({ error: SAFE_MESSAGES.INTERNAL, code: "PROVIDER_ERROR" }, 502);
    }

    return NextResponse.json(
      {
        reply: result.text,
        model: result.providerModelId,
        usage: result.usage,
        latencyMs: Date.now() - started,
      },
      { status: 200 },
    );
  } catch (e: unknown) {
    if (e instanceof MissingApiKeyError) {
      console.error("[api/chat] missing GEMINI_API_KEY");
      return err({ error: SAFE_MESSAGES.MISSING_KEY, code: "MISSING_API_KEY" }, 500);
    }
    if (e instanceof ProviderError) {
      // Log the internal detail server-side; return a safe message.
      console.error("[api/chat] provider error", { kind: e.kind, status: e.status });
      if (e.kind === "rate_limit") {
        return err({ error: SAFE_MESSAGES.RATE_LIMIT, code: "PROVIDER_RATE_LIMIT" }, 429);
      }
      if (e.kind === "unavailable") {
        return err({ error: SAFE_MESSAGES.UNAVAILABLE, code: "PROVIDER_UNAVAILABLE" }, 503);
      }
      if (e.kind === "bad_request") {
        return err({ error: SAFE_MESSAGES.INTERNAL, code: "PROVIDER_ERROR" }, 502);
      }
      return err({ error: SAFE_MESSAGES.INTERNAL, code: "PROVIDER_ERROR" }, 502);
    }
    console.error("[api/chat] unexpected error");
    return err({ error: SAFE_MESSAGES.INTERNAL, code: "INTERNAL_ERROR" }, 500);
  }
}
