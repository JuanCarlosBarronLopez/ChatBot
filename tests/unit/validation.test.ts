import { describe, it, expect } from "vitest";
import { validateChatRequest } from "@/lib/validation/chat";
import { LIMITS } from "@/lib/constants/limits";
import { DEFAULT_MODEL_KEY } from "@/lib/ai/models";

function baseBody(overrides: Record<string, unknown> = {}) {
  return {
    messages: [{ role: "user", content: "Hola" }],
    config: {
      model: DEFAULT_MODEL_KEY,
      systemInstruction: "Sé breve.",
      temperature: 1,
      maxOutputTokens: 512,
      topP: 0.95,
      topK: 40,
      ...((overrides["config"] as Record<string, unknown>) ?? {}),
    },
    ...overrides,
  };
}

describe("validateChatRequest", () => {
  it("accepts a valid request", () => {
    const r = validateChatRequest(baseBody());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.messages).toHaveLength(1);
      expect(r.data.config.model).toBe(DEFAULT_MODEL_KEY);
    }
  });

  it("rejects non-object body", () => {
    expect(validateChatRequest(null).ok).toBe(false);
    expect(validateChatRequest([]).ok).toBe(false);
    expect(validateChatRequest("x").ok).toBe(false);
  });

  it("rejects empty messages", () => {
    const r = validateChatRequest(baseBody({ messages: [] }));
    expect(r.ok).toBe(false);
  });

  it("rejects invalid roles", () => {
    const r = validateChatRequest(
      baseBody({ messages: [{ role: "system", content: "hi" }] }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues[0]?.field).toContain("role");
  });

  it("rejects empty content", () => {
    const r = validateChatRequest(baseBody({ messages: [{ role: "user", content: "   " }] }));
    expect(r.ok).toBe(false);
  });

  it("rejects oversized message", () => {
    const r = validateChatRequest(
      baseBody({ messages: [{ role: "user", content: "x".repeat(LIMITS.MAX_MESSAGE_CHARS + 1) }] }),
    );
    expect(r.ok).toBe(false);
  });

  it("requires last message to be user", () => {
    const r = validateChatRequest(
      baseBody({
        messages: [
          { role: "user", content: "hi" },
          { role: "model", content: "hello" },
        ],
      }),
    );
    expect(r.ok).toBe(false);
  });

  it("rejects unknown model keys (no arbitrary provider ids)", () => {
    const r = validateChatRequest(
      baseBody({ config: { model: "gemini-2.0-flash", systemInstruction: "", temperature: 1, maxOutputTokens: 100, topP: 0.9, topK: 40 } }),
    );
    expect(r.ok).toBe(false);
  });

  it("rejects out-of-range temperature/topP/topK/maxTokens", () => {
    for (const patch of [
      { temperature: 5 },
      { temperature: -0.1 },
      { topP: 1.5 },
      { topP: -1 },
      { topK: 0 },
      { topK: 101 },
      { topK: 1.5 },
      { maxOutputTokens: 0 },
      { maxOutputTokens: 99999 },
      { maxOutputTokens: 10.5 },
    ]) {
      const cfg = {
        model: DEFAULT_MODEL_KEY,
        systemInstruction: "",
        temperature: 1,
        maxOutputTokens: 512,
        topP: 0.95,
        topK: 40,
        ...patch,
      };
      expect(validateChatRequest(baseBody({ config: cfg })).ok, JSON.stringify(patch)).toBe(false);
    }
  });

  it("rejects oversized systemInstruction", () => {
    const r = validateChatRequest(
      baseBody({
        config: {
          model: DEFAULT_MODEL_KEY,
          systemInstruction: "x".repeat(LIMITS.MAX_SYSTEM_INSTRUCTION_CHARS + 1),
          temperature: 1,
          maxOutputTokens: 100,
          topP: 0.9,
          topK: 10,
        },
      }),
    );
    expect(r.ok).toBe(false);
  });

  it("rejects too many messages", () => {
    const msgs = Array.from({ length: LIMITS.MAX_MESSAGES + 1 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "model",
      content: "hola",
    }));
    // ensure last is user
    msgs[msgs.length - 1] = { role: "user", content: "hola" };
    expect(validateChatRequest(baseBody({ messages: msgs })).ok).toBe(false);
  });
});
