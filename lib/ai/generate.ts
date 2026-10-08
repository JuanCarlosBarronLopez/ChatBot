import { getGeminiClient } from "@/lib/ai/client";
import { resolveProviderModelId, isAllowedModelKey } from "@/lib/ai/models";
import type { GenerateInput, GenerateResult } from "@/types/ai";

export class ProviderError extends Error {
  status?: number;
  kind: "rate_limit" | "unavailable" | "bad_request" | "unknown";
  constructor(message: string, kind: ProviderError["kind"], status?: number) {
    super(message);
    this.name = "ProviderError";
    this.kind = kind;
    this.status = status;
  }
}

/**
 * AI service layer. The API route calls generate(), never the SDK directly.
 * Swapping Gemini for another provider later means replacing this file only.
 */
export async function generate(input: GenerateInput): Promise<GenerateResult> {
  if (!isAllowedModelKey(input.modelKey)) {
    throw new ProviderError(`Unknown model key: ${input.modelKey}`, "bad_request", 400);
  }
  const providerModelId = resolveProviderModelId(input.modelKey);
  const client = getGeminiClient();

  // Gemini roles: "user" | "model". Our history already uses those.
  const contents = input.messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  let response: Awaited<ReturnType<typeof client.models.generateContent>>;
  try {
    response = await client.models.generateContent({
      model: providerModelId,
      contents,
      config: {
        systemInstruction: input.systemInstruction || undefined,
        temperature: input.temperature,
        maxOutputTokens: input.maxOutputTokens,
        topP: input.topP,
        topK: input.topK,
      },
    });
  } catch (err: unknown) {
    throw toProviderError(err);
  }

  const text = extractText(response);
  const usage = extractUsage(response);

  return { text, providerModelId, usage };
}

function extractText(response: unknown): string {
  // The SDK exposes `.text` as a convenience getter; fall back to
  // candidates traversal so we never crash on shape drift.
  try {
    const r = response as {
      text?: unknown;
      candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
    };
    if (typeof r.text === "string" && r.text.trim().length > 0) return r.text;
    // Some SDK versions make `text` a getter property — access reflectively.
    const getter = (response as { text?: string })?.text;
    if (typeof getter === "string" && getter.trim()) return getter;
    const parts = r.candidates?.[0]?.content?.parts ?? [];
    const joined = parts
      .map((p) => (typeof p.text === "string" ? p.text : ""))
      .join("")
      .trim();
    return joined;
  } catch {
    return "";
  }
}

function extractUsage(response: unknown): GenerateResult["usage"] | undefined {
  try {
    const r = response as {
      usageMetadata?: {
        promptTokenCount?: unknown;
        candidatesTokenCount?: unknown;
        totalTokenCount?: unknown;
      };
    };
    const u = r.usageMetadata;
    if (!u) return undefined;
    const pick = (v: unknown): number | undefined =>
      typeof v === "number" && Number.isFinite(v) ? v : undefined;
    const usage = {
      inputTokens: pick(u.promptTokenCount),
      outputTokens: pick(u.candidatesTokenCount),
      totalTokens: pick(u.totalTokenCount),
    };
    if (
      usage.inputTokens === undefined &&
      usage.outputTokens === undefined &&
      usage.totalTokens === undefined
    ) {
      return undefined;
    }
    return usage;
  } catch {
    return undefined;
  }
}

export function toProviderError(err: unknown): ProviderError {
  const message = err instanceof Error ? err.message : String(err);
  const status = extractStatus(err) ?? extractStatusFromMessage(message);

  if (status === 429) {
    return new ProviderError(`Provider rate limited: ${message}`, "rate_limit", 429);
  }
  if (status === 400 || status === 404) {
    return new ProviderError(`Provider rejected request: ${message}`, "bad_request", status);
  }
  if (status !== undefined && status >= 500) {
    return new ProviderError(`Provider unavailable: ${message}`, "unavailable", status);
  }
  if (/quota|rate|429|resource.?exhausted/i.test(message)) {
    return new ProviderError(`Provider rate limited: ${message}`, "rate_limit", 429);
  }
  if (/overload|unavailable|503|502|timeout|fetch failed/i.test(message)) {
    return new ProviderError(`Provider unavailable: ${message}`, "unavailable", 503);
  }
  return new ProviderError(`Provider error: ${message}`, "unknown", undefined);
}

function extractStatus(err: unknown): number | undefined {
  const e = err as { status?: unknown; statusCode?: unknown };
  if (typeof e?.status === "number") return e.status;
  if (typeof e?.statusCode === "number") return e.statusCode;
  return undefined;
}

function extractStatusFromMessage(message: string): number | undefined {
  const m = message.match(/\b(429|5\d\d|400|404)\b/);
  return m?.[1] ? Number(m[1]) : undefined;
}
