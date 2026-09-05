import { createAnthropic } from "@ai-sdk/anthropic";
import { BaseProviderAdapter } from "./base";
import type { ModelDescriptor, ProviderConfig, ProviderId, LanguageModelV1 } from "../types";

export const ANTHROPIC_MODELS: ModelDescriptor[] = [
  {
    id: "claude-3-7-sonnet-20250219",
    name: "Claude 3.7 Sonnet",
    providerId: "anthropic",
    description: "Hybrid frontier model with instant and extended thinking modes",
    contextWindow: 200000,
    supportsVision: true,
    supportsReasoning: true,
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    providerId: "anthropic",
    description: "Frontier model for coding, analysis, and multi-step reasoning",
    contextWindow: 200000,
    supportsVision: true,
    supportsReasoning: false,
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    providerId: "anthropic",
    description: "Ultra-fast, compact model with near-frontier coding performance",
    contextWindow: 200000,
    supportsVision: true,
    supportsReasoning: false,
  },
];

export class AnthropicAdapter extends BaseProviderAdapter {
  readonly id: ProviderId = "anthropic";
  readonly name = "Anthropic";

  getLanguageModel(modelId: string, config?: ProviderConfig): LanguageModelV1 {
    const client = createAnthropic({
      apiKey: config?.apiKey || process.env["ANTHROPIC_API_KEY"] || "dummy-key",
      baseURL: config?.baseURL || process.env["ANTHROPIC_BASE_URL"],
      headers: config?.customHeaders,
    });
    return client(modelId);
  }

  async listModels(config?: ProviderConfig): Promise<ModelDescriptor[]> {
    return ANTHROPIC_MODELS;
  }
}
