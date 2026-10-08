import type { ModelMeta } from "@/types/ai";

/**
 * Allowlist of models the server may call.
 *
 * The browser only ever sends `key` (e.g. "flash-latest").
 * The server maps key -> providerModelId. Raw provider ids sent by
 * the client are rejected. This lets us swap provider ids without
 * touching the UI, and prevents model-string injection.
 *
 * Academic note: older guides mention `gemini-1.5-flash` /
 * `gemini-2.0-flash`. Those ids are retired (2.0 shut down in 2026;
 * see README "Academic Requirements Mapping"). They are intentionally
 * NOT in this allowlist. Current defaults use the GA Gemini 3.x
 * Flash family recommended by Google for new projects.
 */
export const MODEL_REGISTRY = {
  "flash-latest": {
    key: "flash-latest",
    label: "Flash · Equilibrado",
    providerModelId: "gemini-3.5-flash",
    description: "Recomendado. Casi-Pro a costo Flash. GA May-2026.",
    supportsSamplingParams: true,
    tier: "recommended",
  },
  "flash-lite": {
    key: "flash-lite",
    label: "Flash-Lite · Rápido",
    providerModelId: "gemini-3.1-flash-lite",
    description: "El más económico y de menor latencia. Ideal para iterar.",
    supportsSamplingParams: true,
    tier: "fast",
  },
  "flash-max": {
    key: "flash-max",
    label: "Flash Max · Capaz",
    providerModelId: "gemini-3.8-flash",
    description: "Workhorse más inteligente para tareas largas y código.",
    supportsSamplingParams: false,
    tier: "capable",
  },
  "pro-reasoning": {
    key: "pro-reasoning",
    label: "Pro · Razonamiento",
    providerModelId: "gemini-3.1-pro-preview",
    description: "Preview de razonamiento profundo. Más lento, más capaz.",
    supportsSamplingParams: true,
    tier: "reasoning",
  },
} satisfies Record<string, ModelMeta>;

export type ModelKey = keyof typeof MODEL_REGISTRY;

export const MODEL_KEYS = Object.keys(MODEL_REGISTRY) as ModelKey[];

export const DEFAULT_MODEL_KEY: ModelKey = "flash-latest";

export function isAllowedModelKey(value: unknown): value is ModelKey {
  return typeof value === "string" && value in MODEL_REGISTRY;
}

export function resolveProviderModelId(key: ModelKey): string {
  return MODEL_REGISTRY[key].providerModelId;
}

export function getModelMeta(key: string): ModelMeta | undefined {
  return (MODEL_REGISTRY as Record<string, ModelMeta>)[key];
}
