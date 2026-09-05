import { createOpenAI } from "@ai-sdk/openai";
import { BaseProviderAdapter } from "./base";
import type { ModelDescriptor, ProviderConfig, ProviderId, LanguageModelV1 } from "../types";

export class CustomOpenAIAdapter extends BaseProviderAdapter {
  readonly id: ProviderId = "custom";
  readonly name = "Custom (OpenAI-compatible)";

  getLanguageModel(modelId: string, config?: ProviderConfig): LanguageModelV1 {
    const baseURL =
      config?.baseURL ||
      process.env["CUSTOM_OPENAI_BASE_URL"] ||
      "http://localhost:8000/v1";
    const apiKey =
      config?.apiKey ||
      process.env["CUSTOM_OPENAI_API_KEY"] ||
      "dummy-key";

    const client = createOpenAI({
      name: "custom",
      apiKey,
      baseURL,
      headers: config?.customHeaders,
    });
    return client.chat(modelId);
  }

  async listModels(config?: ProviderConfig): Promise<ModelDescriptor[]> {
    if (config?.models && config.models.length > 0) {
      return config.models.map((modelId) => ({
        id: modelId,
        name: modelId,
        providerId: "custom" as const,
        description: "User configured custom model",
        isCustom: true,
      }));
    }

    return [
      {
        id: "custom-model",
        name: "Custom Model",
        providerId: "custom" as const,
        description: "Custom OpenAI-compatible endpoint (vLLM, LM Studio, LocalAI)",
        isCustom: true,
      },
    ];
  }
}
