import { createOpenAI } from "@ai-sdk/openai";
import { BaseProviderAdapter } from "./base";
import type { ModelDescriptor, ProviderConfig, ProviderId, LanguageModelV1 } from "../types";

export const OLLAMA_DEFAULT_MODELS: ModelDescriptor[] = [
  {
    id: "llama3.2",
    name: "Llama 3.2",
    providerId: "ollama",
    description: "Local Meta Llama 3.2 via Ollama",
    contextWindow: 8192,
    supportsVision: false,
    supportsReasoning: false,
  },
  {
    id: "deepseek-r1:latest",
    name: "DeepSeek R1 (Local)",
    providerId: "ollama",
    description: "Local DeepSeek R1 reasoning model via Ollama",
    contextWindow: 8192,
    supportsVision: false,
    supportsReasoning: true,
  },
  {
    id: "mistral",
    name: "Mistral 7B",
    providerId: "ollama",
    description: "Local Mistral 7B model via Ollama",
    contextWindow: 8192,
    supportsVision: false,
    supportsReasoning: false,
  },
  {
    id: "qwen2.5-coder",
    name: "Qwen 2.5 Coder",
    providerId: "ollama",
    description: "Local coding assistant model via Ollama",
    contextWindow: 32768,
    supportsVision: false,
    supportsReasoning: false,
  },
];

export class OllamaAdapter extends BaseProviderAdapter {
  readonly id: ProviderId = "ollama";
  readonly name = "Ollama";

  getLanguageModel(modelId: string, config?: ProviderConfig): LanguageModelV1 {
    const rawBase = config?.baseURL || process.env["OLLAMA_BASE_URL"] || "http://localhost:11434";
    const cleanBase = rawBase.replace(/\/$/, "");
    const baseURL = cleanBase.endsWith("/v1") ? cleanBase : `${cleanBase}/v1`;

    const client = createOpenAI({
      name: "ollama",
      apiKey: config?.apiKey || "ollama",
      baseURL,
      headers: config?.customHeaders,
    });
    return client.chat(modelId);
  }

  async listModels(config?: ProviderConfig): Promise<ModelDescriptor[]> {
    const rawBase = config?.baseURL || process.env["OLLAMA_BASE_URL"] || "http://localhost:11434";
    const host = rawBase.replace(/\/v1\/?$/, "").replace(/\/$/, "");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${host}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json()) as {
          models?: Array<{
            name: string;
            model?: string;
            details?: {
              parameter_size?: string;
              family?: string;
              format?: string;
            };
          }>;
        };

        if (data?.models && Array.isArray(data.models) && data.models.length > 0) {
          return data.models.map((m) => {
            const id = m.name;
            const paramSize = m.details?.parameter_size ? ` (${m.details.parameter_size})` : "";
            const isReasoning =
              id.toLowerCase().includes("r1") || id.toLowerCase().includes("reason");
            const isVision =
              id.toLowerCase().includes("vision") || id.toLowerCase().includes("llava");

            return {
              id,
              name: id,
              providerId: "ollama" as const,
              description: `Local Ollama model${paramSize}`,
              contextWindow: 8192,
              supportsReasoning: isReasoning,
              supportsVision: isVision,
              isCustom: false,
            };
          });
        }
      }
    } catch {
      // Offline fallback: when Ollama daemon is not responding, return defaults
    }

    return OLLAMA_DEFAULT_MODELS;
  }
}
