import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { BaseProviderAdapter } from "./base";
import type { ModelDescriptor, ProviderConfig, ProviderId, LanguageModelV1 } from "../types";

export const GOOGLE_MODELS: ModelDescriptor[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    providerId: "google",
    description: "Next-gen lightning-fast multimodal reasoning model with 1M context",
    contextWindow: 1048576,
    supportsVision: true,
    supportsReasoning: false,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    providerId: "google",
    description: "Frontier multimodal reasoning and coding model with 2M context",
    contextWindow: 2097152,
    supportsVision: true,
    supportsReasoning: true,
  },
  {
    id: "gemini-2.0-flash-thinking-exp-01-21",
    name: "Gemini 2.0 Flash Thinking",
    providerId: "google",
    description: "Experimental model with explicit reasoning traces and deep thought",
    contextWindow: 1048576,
    supportsVision: true,
    supportsReasoning: true,
  },
];

export class GoogleAdapter extends BaseProviderAdapter {
  readonly id: ProviderId = "google";
  readonly name = "Google Gemini";

  getLanguageModel(modelId: string, config?: ProviderConfig): LanguageModelV1 {
    const apiKey =
      config?.apiKey ||
      process.env["GEMINI_API_KEY"] ||
      process.env["GOOGLE_GENERATIVE_AI_API_KEY"] ||
      process.env["GOOGLE_API_KEY"] ||
      "dummy-key";

    const client = createGoogleGenerativeAI({
      apiKey,
      baseURL: config?.baseURL,
      headers: config?.customHeaders,
    });
    return client(modelId);
  }

  async listModels(config?: ProviderConfig): Promise<ModelDescriptor[]> {
    return GOOGLE_MODELS;
  }
}
