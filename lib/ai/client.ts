import { GoogleGenAI } from "@google/genai";

/**
 * Server-only Gemini client factory.
 * Never import this from a Client Component — the API key must stay
 * in the server runtime. The module throws a coded error when the
 * key is missing so the route can return a safe 500.
 */

let cached: GoogleGenAI | null = null;

export class MissingApiKeyError extends Error {
  constructor() {
    super("Server misconfigured: GEMINI_API_KEY is not set.");
    this.name = "MissingApiKeyError";
  }
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey || apiKey.trim().length === 0) {
    throw new MissingApiKeyError();
  }
  if (!cached) {
    cached = new GoogleGenAI({ apiKey });
  }
  return cached;
}

/** Test-only: reset the cached singleton between tests. */
export function __resetGeminiClientForTests(): void {
  cached = null;
}
