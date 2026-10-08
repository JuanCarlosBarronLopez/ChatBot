/**
 * Centralized runtime limits. Server is the source of truth;
 * the client only proposes values which are validated + clamped here.
 *
 * Ranges are aligned with the official Gemini generation docs:
 * - temperature: 0.0 – 2.0 (default 1.0)
 * - topP: 0.0 – 1.0
 * - topK: 1 – 100 (provider uses e.g. 40 as a typical value)
 * - maxOutputTokens: 1 – 8192 (safe cap for this app; models support more,
 *   but we cap to avoid accidental huge responses)
 */
export const LIMITS = {
  MAX_MESSAGES: 50,
  MAX_MESSAGE_CHARS: 12_000,
  MAX_SYSTEM_INSTRUCTION_CHARS: 8_000,
  MAX_TOTAL_CHARS: 100_000,

  TEMPERATURE_MIN: 0,
  TEMPERATURE_MAX: 2,
  TEMPERATURE_DEFAULT: 1,

  TOP_P_MIN: 0,
  TOP_P_MAX: 1,
  TOP_P_DEFAULT: 0.95,

  TOP_K_MIN: 1,
  TOP_K_MAX: 100,
  TOP_K_DEFAULT: 40,

  MAX_OUTPUT_TOKENS_MIN: 1,
  MAX_OUTPUT_TOKENS_MAX: 8192,
  MAX_OUTPUT_TOKENS_DEFAULT: 1024,
} as const;

export const DEFAULT_SYSTEM_INSTRUCTION =
  "Eres un asistente útil, preciso y conciso. Respondes en el idioma del usuario salvo que te pidan otro. Usas Markdown cuando ayuda a la legibilidad.";
