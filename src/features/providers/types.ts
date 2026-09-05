import type { LanguageModel } from "ai";

export type LanguageModelV1 = LanguageModel;

export type ProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "groq"
  | "deepseek"
  | "ollama"
  | "openrouter"
  | "custom";

export interface ModelDescriptor {
  id: string;
  name: string;
  providerId: ProviderId;
  description?: string;
  contextWindow?: number;
  supportsReasoning?: boolean;
  supportsVision?: boolean;
  isCustom?: boolean;
}

export interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  defaultModel?: string;
  customHeaders?: Record<string, string>;
  enabled?: boolean;
  models?: string[];
}

export interface ProviderAdapter {
  readonly id: ProviderId;
  readonly name: string;
  getLanguageModel(modelId: string, config?: ProviderConfig): LanguageModelV1;
  listModels(config?: ProviderConfig): Promise<ModelDescriptor[]>;
}
