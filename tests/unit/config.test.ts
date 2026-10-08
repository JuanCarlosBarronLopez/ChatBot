import { describe, it, expect } from "vitest";
import { normalizeModelConfig, DEFAULT_MODEL_CONFIG } from "@/lib/ai/config";
import { LIMITS } from "@/lib/constants/limits";

describe("normalizeModelConfig", () => {
  it("returns defaults for empty input", () => {
    expect(normalizeModelConfig({})).toEqual(DEFAULT_MODEL_CONFIG);
  });

  it("clamps temperature/topP/topK/maxTokens into range", () => {
    const hi = normalizeModelConfig({
      temperature: 99,
      topP: 5,
      topK: 9999,
      maxOutputTokens: 999999,
    });
    expect(hi.temperature).toBe(LIMITS.TEMPERATURE_MAX);
    expect(hi.topP).toBe(LIMITS.TOP_P_MAX);
    expect(hi.topK).toBe(LIMITS.TOP_K_MAX);
    expect(hi.maxOutputTokens).toBe(LIMITS.MAX_OUTPUT_TOKENS_MAX);

    const lo = normalizeModelConfig({
      temperature: -5,
      topP: -5,
      topK: -10,
      maxOutputTokens: -100,
    });
    expect(lo.temperature).toBe(LIMITS.TEMPERATURE_MIN);
    expect(lo.topP).toBe(LIMITS.TOP_P_MIN);
    expect(lo.topK).toBe(LIMITS.TOP_K_MIN);
    expect(lo.maxOutputTokens).toBe(LIMITS.MAX_OUTPUT_TOKENS_MIN);
  });

  it("rounds integer fields", () => {
    const c = normalizeModelConfig({ topK: 10.7, maxOutputTokens: 100.3 });
    expect(Number.isInteger(c.topK)).toBe(true);
    expect(Number.isInteger(c.maxOutputTokens)).toBe(true);
  });

  it("truncates systemInstruction to the limit", () => {
    const c = normalizeModelConfig({ systemInstruction: "x".repeat(20000) });
    expect(c.systemInstruction.length).toBe(LIMITS.MAX_SYSTEM_INSTRUCTION_CHARS);
  });

  it("falls back on NaN / garbage", () => {
    const c = normalizeModelConfig({
      temperature: Number.NaN,
      topP: "oops" as unknown as number,
    });
    expect(c.temperature).toBe(LIMITS.TEMPERATURE_DEFAULT);
    expect(c.topP).toBe(LIMITS.TOP_P_DEFAULT);
  });
});
