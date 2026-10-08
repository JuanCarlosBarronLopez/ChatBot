import { LIMITS } from "@/lib/constants/limits";
import { isAllowedModelKey } from "@/lib/ai/models";
import type { MessageRole, ModelConfig } from "@/types/chat";

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidatedChatRequest {
  messages: Array<{ role: MessageRole; content: string }>;
  config: ModelConfig;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isValidRole(r: unknown): r is MessageRole {
  return r === "user" || r === "model";
}

/**
 * Strict runtime validation for POST /api/chat.
 * TypeScript types are erased at runtime — this is the real gate.
 */
export function validateChatRequest(body: unknown):
  | { ok: true; data: ValidatedChatRequest }
  | { ok: false; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  if (!isRecord(body)) {
    return { ok: false, issues: [{ field: "body", message: "Body must be a JSON object." }] };
  }

  // ---- messages ----
  const messages = body["messages"];
  if (!Array.isArray(messages)) {
    issues.push({ field: "messages", message: "messages must be an array." });
  }
  const cleanMessages: ValidatedChatRequest["messages"] = [];
  if (Array.isArray(messages)) {
    if (messages.length === 0) {
      issues.push({ field: "messages", message: "At least one message is required." });
    }
    if (messages.length > LIMITS.MAX_MESSAGES) {
      issues.push({
        field: "messages",
        message: `Too many messages (max ${LIMITS.MAX_MESSAGES}).`,
      });
    }
    let totalChars = 0;
    messages.slice(0, LIMITS.MAX_MESSAGES).forEach((m, i) => {
      const field = `messages[${i}]`;
      if (!isRecord(m)) {
        issues.push({ field, message: "Message must be an object." });
        return;
      }
      const role = m["role"];
      const content = m["content"];
      if (!isValidRole(role)) {
        issues.push({ field: `${field}.role`, message: 'role must be "user" or "model".' });
      }
      if (typeof content !== "string") {
        issues.push({ field: `${field}.content`, message: "content must be a string." });
        return;
      }
      const trimmed = content.trim();
      if (trimmed.length === 0) {
        issues.push({ field: `${field}.content`, message: "content must not be empty." });
        return;
      }
      if (content.length > LIMITS.MAX_MESSAGE_CHARS) {
        issues.push({
          field: `${field}.content`,
          message: `content too long (max ${LIMITS.MAX_MESSAGE_CHARS} chars).`,
        });
        return;
      }
      totalChars += content.length;
      if (isValidRole(role)) cleanMessages.push({ role, content });
    });
    if (totalChars > LIMITS.MAX_TOTAL_CHARS) {
      issues.push({
        field: "messages",
        message: `Conversation too large (max ${LIMITS.MAX_TOTAL_CHARS} chars total).`,
      });
    }
    // Last message must be from the user (the prompt to answer).
    if (cleanMessages.length > 0) {
      const last = cleanMessages[cleanMessages.length - 1];
      if (last && last.role !== "user") {
        issues.push({
          field: "messages",
          message: "The last message must have role 'user'.",
        });
      }
    }
  }

  // ---- config ----
  const rawConfig = body["config"];
  if (!isRecord(rawConfig)) {
    issues.push({ field: "config", message: "config must be an object." });
    return { ok: false, issues };
  }

  const { model, systemInstruction, temperature, maxOutputTokens, topP, topK } = rawConfig as Record<
    string,
    unknown
  >;

  let validModel = "";
  if (typeof model !== "string" || !isAllowedModelKey(model)) {
    issues.push({ field: "config.model", message: "Unknown model. Use a value from the model registry." });
  } else {
    validModel = model;
  }

  let validSystem = "";
  if (typeof systemInstruction !== "string") {
    issues.push({ field: "config.systemInstruction", message: "systemInstruction must be a string." });
  } else if (systemInstruction.length > LIMITS.MAX_SYSTEM_INSTRUCTION_CHARS) {
    issues.push({
      field: "config.systemInstruction",
      message: `systemInstruction too long (max ${LIMITS.MAX_SYSTEM_INSTRUCTION_CHARS} chars).`,
    });
  } else {
    validSystem = systemInstruction;
  }

  const num = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null;

  const t = num(temperature);
  if (t === null || t < LIMITS.TEMPERATURE_MIN || t > LIMITS.TEMPERATURE_MAX) {
    issues.push({
      field: "config.temperature",
      message: `temperature must be between ${LIMITS.TEMPERATURE_MIN} and ${LIMITS.TEMPERATURE_MAX}.`,
    });
  }
  const mt = num(maxOutputTokens);
  if (
    mt === null ||
    !Number.isInteger(mt) ||
    mt < LIMITS.MAX_OUTPUT_TOKENS_MIN ||
    mt > LIMITS.MAX_OUTPUT_TOKENS_MAX
  ) {
    issues.push({
      field: "config.maxOutputTokens",
      message: `maxOutputTokens must be an integer between ${LIMITS.MAX_OUTPUT_TOKENS_MIN} and ${LIMITS.MAX_OUTPUT_TOKENS_MAX}.`,
    });
  }
  const pp = num(topP);
  if (pp === null || pp < LIMITS.TOP_P_MIN || pp > LIMITS.TOP_P_MAX) {
    issues.push({
      field: "config.topP",
      message: `topP must be between ${LIMITS.TOP_P_MIN} and ${LIMITS.TOP_P_MAX}.`,
    });
  }
  const tk = num(topK);
  if (
    tk === null ||
    !Number.isInteger(tk) ||
    tk < LIMITS.TOP_K_MIN ||
    tk > LIMITS.TOP_K_MAX
  ) {
    issues.push({
      field: "config.topK",
      message: `topK must be an integer between ${LIMITS.TOP_K_MIN} and ${LIMITS.TOP_K_MAX}.`,
    });
  }

  if (issues.length > 0) return { ok: false, issues };

  return {
    ok: true,
    data: {
      messages: cleanMessages,
      config: {
        model: validModel,
        systemInstruction: validSystem,
        temperature: t as number,
        maxOutputTokens: mt as number,
        topP: pp as number,
        topK: tk as number,
      },
    },
  };
}
