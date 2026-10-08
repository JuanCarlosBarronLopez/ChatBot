export interface ModelMeta {
  /** Stable key used by the UI + API. Never exposed as provider id directly. */
  key: string;
  label: string;
  providerModelId: string;
  description: string;
  /** False when the provider ignores sampling params for this model. */
  supportsSamplingParams: boolean;
  tier: "recommended" | "fast" | "capable" | "reasoning";
}

export interface GenerateInput {
  messages: Array<{ role: "user" | "model"; content: string }>;
  systemInstruction: string;
  modelKey: string;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  topK: number;
}

export interface GenerateResult {
  text: string;
  providerModelId: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}
