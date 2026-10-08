export type MessageRole = "user" | "model";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  usage?: UsageMetadata;
  model?: string;
  latencyMs?: number;
}

export interface ModelConfig {
  /** Key into MODEL_REGISTRY (e.g. "flash-latest"), not a raw provider id. */
  model: string;
  systemInstruction: string;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  topK: number;
}

export interface ChatRequest {
  messages: Array<{ role: MessageRole; content: string }>;
  config: ModelConfig;
}

export interface UsageMetadata {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface ChatResponse {
  reply: string;
  model: string;
  usage?: UsageMetadata;
  latencyMs: number;
}
