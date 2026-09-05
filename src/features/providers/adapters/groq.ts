import { createGroq } from "@ai-sdk/groq";
import { BaseProviderAdapter } from "./base";
import type { ModelDescriptor, ProviderConfig, ProviderId, LanguageModelV1 } from "../types";

export const GROQ_MODELS: ModelDescriptor[] = [
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    providerId: "groq",
    description: "Meta's flagship open-weights 70B model with ultra-fast Groq LPU inference",
    contextWindow: 128000,
    supportsVision: false,
    supportsReasoning: false,
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B",
    providerId: "groq",
    description: "Sub-second ultra-fast inference for rapid queries and chat",
    contextWindow: 128000,
    supportsVision: false,
    supportsReasoning: false,
  },
  {
    id: "mixtral-8x7b-32768",
    name: "Mixtral 8x7B",
    providerId: "groq",
    description: "High-speed Mixture of Experts model with 32k context",
    contextWindow: 32768,
    supportsVision: false,
    supportsReasoning: false,
  },
];

export class GroqAdapter extends BaseProviderAdapter {
  readonly id: ProviderId = "groq";
  readonly name = "Groq";

  getLanguageModel(modelId: string, config?: ProviderConfig): LanguageModelV1 {
    const client = createGroq({
      apiKey: config?.apiKey || process.env["GROQ_API_KEY"] || "dummy-key",
      baseURL: config?.baseURL || process.env["GROQ_BASE_URL"],
      headers: config?.customHeaders,
    });
    return client(modelId);
  }

  async listModels(config?: ProviderConfig): Promise<ModelDescriptor[]> {
    return GROQ_MODELS;
  }
}
