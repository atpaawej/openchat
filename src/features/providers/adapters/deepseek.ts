import { createOpenAI } from "@ai-sdk/openai";
import { BaseProviderAdapter } from "./base";
import type { ModelDescriptor, ProviderConfig, ProviderId, LanguageModelV1 } from "../types";

export const DEEPSEEK_MODELS: ModelDescriptor[] = [
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat (V3)",
    providerId: "deepseek",
    description: "DeepSeek-V3 general purpose conversational and coding model",
    contextWindow: 64000,
    supportsVision: false,
    supportsReasoning: false,
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek Reasoner (R1)",
    providerId: "deepseek",
    description: "DeepSeek-R1 frontier reasoning model with chain-of-thought traces",
    contextWindow: 64000,
    supportsVision: false,
    supportsReasoning: true,
  },
];

export class DeepSeekAdapter extends BaseProviderAdapter {
  readonly id: ProviderId = "deepseek";
  readonly name = "DeepSeek";

  getLanguageModel(modelId: string, config?: ProviderConfig): LanguageModelV1 {
    const client = createOpenAI({
      name: "deepseek",
      apiKey: config?.apiKey || process.env["DEEPSEEK_API_KEY"] || "dummy-key",
      baseURL: config?.baseURL || process.env["DEEPSEEK_BASE_URL"] || "https://api.deepseek.com",
      headers: config?.customHeaders,
    });
    return client.chat(modelId);
  }

  async listModels(config?: ProviderConfig): Promise<ModelDescriptor[]> {
    return DEEPSEEK_MODELS;
  }
}
