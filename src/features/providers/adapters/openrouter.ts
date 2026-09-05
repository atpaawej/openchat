import { createOpenAI } from "@ai-sdk/openai";
import { BaseProviderAdapter } from "./base";
import type { ModelDescriptor, ProviderConfig, ProviderId, LanguageModelV1 } from "../types";

export const OPENROUTER_MODELS: ModelDescriptor[] = [
  {
    id: "anthropic/claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet (OpenRouter)",
    providerId: "openrouter",
    description: "Anthropic Claude 3.7 Sonnet via OpenRouter gateway",
    contextWindow: 200000,
    supportsVision: true,
    supportsReasoning: true,
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o (OpenRouter)",
    providerId: "openrouter",
    description: "OpenAI flagship model via OpenRouter gateway",
    contextWindow: 128000,
    supportsVision: true,
    supportsReasoning: false,
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1 (OpenRouter)",
    providerId: "openrouter",
    description: "DeepSeek R1 reasoning model routed through OpenRouter",
    contextWindow: 64000,
    supportsVision: false,
    supportsReasoning: true,
  },
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash (OpenRouter)",
    providerId: "openrouter",
    description: "Google Gemini 2.0 Flash via OpenRouter gateway",
    contextWindow: 1048576,
    supportsVision: true,
    supportsReasoning: false,
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B (OpenRouter)",
    providerId: "openrouter",
    description: "Meta Llama 3.3 70B Instruct via OpenRouter gateway",
    contextWindow: 128000,
    supportsVision: false,
    supportsReasoning: false,
  },
];

export class OpenRouterAdapter extends BaseProviderAdapter {
  readonly id: ProviderId = "openrouter";
  readonly name = "OpenRouter";

  getLanguageModel(modelId: string, config?: ProviderConfig): LanguageModelV1 {
    const client = createOpenAI({
      name: "openrouter",
      apiKey: config?.apiKey || process.env["OPENROUTER_API_KEY"] || "dummy-key",
      baseURL: config?.baseURL || process.env["OPENROUTER_BASE_URL"] || "https://openrouter.ai/api/v1",
      headers: {
        "HTTP-Referer": "https://openchat.dev",
        "X-Title": "OpenChat",
        ...config?.customHeaders,
      },
    });
    return client.chat(modelId);
  }

  async listModels(config?: ProviderConfig): Promise<ModelDescriptor[]> {
    return OPENROUTER_MODELS;
  }
}
