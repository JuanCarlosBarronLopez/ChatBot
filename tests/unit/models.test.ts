import { describe, it, expect } from "vitest";
import {
  MODEL_REGISTRY,
  MODEL_KEYS,
  DEFAULT_MODEL_KEY,
  isAllowedModelKey,
  resolveProviderModelId,
} from "@/lib/ai/models";

describe("model registry", () => {
  it("has at least 2 models and a valid default", () => {
    expect(MODEL_KEYS.length).toBeGreaterThanOrEqual(2);
    expect(isAllowedModelKey(DEFAULT_MODEL_KEY)).toBe(true);
  });

  it("maps keys to real provider ids (not equal to the key)", () => {
    for (const key of MODEL_KEYS) {
      const meta = MODEL_REGISTRY[key];
      expect(meta.providerModelId).toMatch(/^gemini-/);
      expect(resolveProviderModelId(key)).toBe(meta.providerModelId);
    }
  });

  it("rejects raw provider ids and retired academic ids", () => {
    expect(isAllowedModelKey("gemini-3.5-flash")).toBe(false);
    expect(isAllowedModelKey("gemini-2.0-flash")).toBe(false);
    expect(isAllowedModelKey("gemini-1.5-flash")).toBe(false);
    expect(isAllowedModelKey("")).toBe(false);
    expect(isAllowedModelKey(undefined)).toBe(false);
  });

  it("default points to a currently-supported GA model", () => {
    // 2.0 is shut down (2026); default must not be a retired id.
    expect(MODEL_REGISTRY[DEFAULT_MODEL_KEY]?.providerModelId).not.toMatch(/gemini-(1\.5|2\.0)-/);
  });
});
