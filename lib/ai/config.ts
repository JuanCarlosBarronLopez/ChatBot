import { LIMITS, DEFAULT_SYSTEM_INSTRUCTION } from "@/lib/constants/limits";
import { DEFAULT_MODEL_KEY } from "@/lib/ai/models";
import type { ModelConfig } from "@/types/chat";

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  model: DEFAULT_MODEL_KEY,
  systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
  temperature: LIMITS.TEMPERATURE_DEFAULT,
  maxOutputTokens: LIMITS.MAX_OUTPUT_TOKENS_DEFAULT,
  topP: LIMITS.TOP_P_DEFAULT,
  topK: LIMITS.TOP_K_DEFAULT,
};

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

/**
 * Server-side normalization. The client proposes config; the server
 * clamps + sanitizes. Never trust frontend values.
 */
export function normalizeModelConfig(input: Partial<ModelConfig>): ModelConfig {
  return {
    model: typeof input.model === "string" ? input.model : DEFAULT_MODEL_KEY,
    systemInstruction:
      typeof input.systemInstruction === "string"
        ? input.systemInstruction.slice(0, LIMITS.MAX_SYSTEM_INSTRUCTION_CHARS)
        : DEFAULT_SYSTEM_INSTRUCTION,
    temperature: clamp(
      toFiniteNumber(input.temperature, LIMITS.TEMPERATURE_DEFAULT),
      LIMITS.TEMPERATURE_MIN,
      LIMITS.TEMPERATURE_MAX,
    ),
    maxOutputTokens: Math.round(
      clamp(
        toFiniteNumber(input.maxOutputTokens, LIMITS.MAX_OUTPUT_TOKENS_DEFAULT),
        LIMITS.MAX_OUTPUT_TOKENS_MIN,
        LIMITS.MAX_OUTPUT_TOKENS_MAX,
      ),
    ),
    topP: clamp(
      toFiniteNumber(input.topP, LIMITS.TOP_P_DEFAULT),
      LIMITS.TOP_P_MIN,
      LIMITS.TOP_P_MAX,
    ),
    topK: Math.round(
      clamp(
        toFiniteNumber(input.topK, LIMITS.TOP_K_DEFAULT),
        LIMITS.TOP_K_MIN,
        LIMITS.TOP_K_MAX,
      ),
    ),
  };
}

export function describeConfig(c: ModelConfig): string {
  return `${c.model} · T=${c.temperature} · maxTok=${c.maxOutputTokens} · topP=${c.topP} · topK=${c.topK}`;
}
