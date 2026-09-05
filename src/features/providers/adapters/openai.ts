import { createOpenAI } from "@ai-sdk/openai";
import { BaseProviderAdapter } from "./base";
import type { ModelDescriptor, ProviderConfig, ProviderId, LanguageModelV1 } from "../types";

export const OPENAI_MODELS: ModelDescriptor[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    providerId: "openai",
    description: "Flagship multimodal intelligence for high-complexity tasks",
    contextWindow: 128000,
    supportsVision: true,
    supportsReasoning: false,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    providerId: "openai",
    description: "Fast, cost-efficient model for everyday lightweight tasks",
    contextWindow: 128000,
    supportsVision: true,
    supportsReasoning: false,
  },
  {
    id: "o1",
    name: "o1",
    providerId: "openai",
    description: "Advanced reasoning model designed to solve complex multi-step problems",
    contextWindow: 200000,
    supportsVision: true,
    supportsReasoning: true,
  },
  {
    id: "o3-mini",
    name: "o3-mini",
    providerId: "openai",
    description: "High-speed reasoning model with exceptional STEM performance",
    contextWindow: 200000,
    supportsVision: false,
    supportsReasoning: true,
  },
  {
    id: "gpt-4.5",
    name: "GPT-4.5",
    providerId: "openai",
    description: "OpenAI's largest and most capable frontier model",
    contextWindow: 128000,
    supportsVision: true,
    supportsReasoning: false,
  },
];

export class OpenAIAdapter extends BaseProviderAdapter {
  readonly id: ProviderId = "openai";
  readonly name = "OpenAI";

  getLanguageModel(modelId: string, config?: ProviderConfig): LanguageModelV1 {
    const client = createOpenAI({
      apiKey: config?.apiKey || process.env["OPENAI_API_KEY"] || "dummy-key",
      baseURL: config?.baseURL || process.env["OPENAI_BASE_URL"],
      headers: config?.customHeaders,
    });
    return client(modelId);
  }

  async listModels(config?: ProviderConfig): Promise<ModelDescriptor[]> {
    return OPENAI_MODELS;
  }
}
