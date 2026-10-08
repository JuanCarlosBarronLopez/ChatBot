/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the AI service layer (route -> generate). This tests HTTP semantics:
// validation, status codes, safe errors, success shape.
vi.mock("@/lib/ai/generate", () => ({
  generate: vi.fn(),
  ProviderError: class ProviderError extends Error {
    status?: number;
    kind: string;
    constructor(message: string, kind: string, status?: number) {
      super(message);
      this.kind = kind;
      this.status = status;
    }
  },
}));

vi.mock("@/lib/ai/client", () => ({
  MissingApiKeyError: class MissingApiKeyError extends Error {
    constructor() {
      super("missing");
      this.name = "MissingApiKeyError";
    }
  },
}));

import { POST } from "@/app/api/chat/route";
import { generate } from "@/lib/ai/generate";
import { DEFAULT_MODEL_KEY } from "@/lib/ai/models";

function req(body: unknown): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function validBody() {
  return {
    messages: [{ role: "user", content: "Hola, ¿quién eres?" }],
    config: {
      model: DEFAULT_MODEL_KEY,
      systemInstruction: "Sé breve.",
      temperature: 0.7,
      maxOutputTokens: 256,
      topP: 0.9,
      topK: 40,
    },
  };
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.mocked(generate).mockReset();
  });

  it("returns 400 on invalid JSON", async () => {
    const res = await POST(new Request("http://localhost/api/chat", { method: "POST", body: "{nope" }));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { code: string };
    expect(data.code).toBe("INVALID_JSON");
  });

  it("returns 400 + details on invalid payload", async () => {
    const res = await POST(req({ messages: [], config: {} }));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { code: string; details: unknown[] };
    expect(data.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(data.details)).toBe(true);
  });

  it("rejects unknown model with 400 and never calls the provider", async () => {
    const body = validBody();
    (body.config as Record<string, unknown>)["model"] = "gemini-evil-injected";
    const res = await POST(req(body));
    expect(res.status).toBe(400);
    expect(vi.mocked(generate)).not.toHaveBeenCalled();
  });

  it("returns 500 with safe message when API key is missing", async () => {
    const { MissingApiKeyError } = await import("@/lib/ai/client");
    vi.mocked(generate).mockRejectedValue(new MissingApiKeyError());
    const res = await POST(req(validBody()));
    expect(res.status).toBe(500);
    const data = (await res.json()) as { error: string; code: string };
    expect(data.code).toBe("MISSING_API_KEY");
    expect(data.error).not.toMatch(/GEMINI_API_KEY=.+/);
  });

  it("maps rate limits to 429", async () => {
    const { ProviderError } = await import("@/lib/ai/generate");
    vi.mocked(generate).mockRejectedValue(new ProviderError("quota", "rate_limit", 429));
    const res = await POST(req(validBody()));
    expect(res.status).toBe(429);
  });

  it("maps provider outage to 503 (not 500)", async () => {
    const { ProviderError } = await import("@/lib/ai/generate");
    vi.mocked(generate).mockRejectedValue(new ProviderError("overload", "unavailable", 503));
    const res = await POST(req(validBody()));
    expect(res.status).toBe(503);
  });

  it("returns reply + model + usage + latency on success", async () => {
    vi.mocked(generate).mockResolvedValue({
      text: "Hola, soy Gemini.",
      providerModelId: "gemini-3.5-flash",
      usage: { inputTokens: 12, outputTokens: 8, totalTokens: 20 },
    });
    const res = await POST(req(validBody()));
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      reply: string;
      model: string;
      usage: { totalTokens: number };
      latencyMs: number;
    };
    expect(data.reply).toContain("Gemini");
    expect(data.model).toBe("gemini-3.5-flash");
    expect(data.usage.totalTokens).toBe(20);
    expect(typeof data.latencyMs).toBe("number");
  });

  it("does not leak stack traces", async () => {
    vi.mocked(generate).mockRejectedValue(new Error("secret stack\n at foo.ts:1:1"));
    const res = await POST(req(validBody()));
    const text = await res.text();
    expect(text).not.toContain("at foo.ts");
    expect(text).not.toContain("secret stack");
  });
});
