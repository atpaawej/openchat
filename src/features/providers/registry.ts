import { loadSettings, type OpenChatSettings } from "@/features/settings/config-file";
import type {
  ModelDescriptor,
  ProviderAdapter,
  ProviderConfig,
  ProviderId,
  LanguageModelV1,
} from "./types";
import {
  OpenAIAdapter,
  AnthropicAdapter,
  GoogleAdapter,
  GroqAdapter,
  DeepSeekAdapter,
  OllamaAdapter,
  OpenRouterAdapter,
  CustomOpenAIAdapter,
} from "./adapters";

export class ProviderRegistry {
  private adapters = new Map<ProviderId, ProviderAdapter>();

  constructor() {
    this.registerDefaultAdapters();
  }

  private registerDefaultAdapters(): void {
    this.registerAdapter(new OpenAIAdapter());
    this.registerAdapter(new AnthropicAdapter());
    this.registerAdapter(new GoogleAdapter());
    this.registerAdapter(new GroqAdapter());
    this.registerAdapter(new DeepSeekAdapter());
    this.registerAdapter(new OllamaAdapter());
    this.registerAdapter(new OpenRouterAdapter());
    this.registerAdapter(new CustomOpenAIAdapter());
  }

  registerAdapter(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  getAdapter(id: ProviderId): ProviderAdapter | undefined {
    return this.adapters.get(id);
  }

  listAdapters(): ProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Resolves an AI SDK LanguageModelV1 for the given provider and model ID.
   * If providerId is not recognized, falls back to the Custom OpenAI-compatible adapter.
   * Arbitrary model IDs are passed through to the resolved adapter.
   */
  resolveLanguageModel(
    providerId: ProviderId | string,
    modelId: string,
    settings?: OpenChatSettings
  ): LanguageModelV1 {
    const currentSettings = settings ?? loadSettings();

    // 1. Try matching registered adapter
    const adapter = this.getAdapter(providerId as ProviderId);
    if (adapter) {
      const config = currentSettings.providers?.[
        providerId as keyof typeof currentSettings.providers
      ] as ProviderConfig | undefined;
      return adapter.getLanguageModel(modelId, config);
    }

    // 2. Fallback to custom OpenAI-compatible adapter for arbitrary providers/models
    const customAdapter = this.getAdapter("custom");
    if (customAdapter) {
      const customConfig = currentSettings.providers?.custom as ProviderConfig | undefined;
      return customAdapter.getLanguageModel(modelId, customConfig);
    }

    // 3. Fallback to first available adapter
    const firstAdapter = this.listAdapters()[0];
    if (firstAdapter) {
      return firstAdapter.getLanguageModel(modelId);
    }

    throw new Error(
      `Unable to resolve language model for provider "${providerId}" and model "${modelId}". No adapters available.`
    );
  }

  /**
   * Retrieves all available models across all registered adapters,
   * merging any custom models defined in settings.json.
   */
  async getAllModels(settings?: OpenChatSettings): Promise<ModelDescriptor[]> {
    const currentSettings = settings ?? loadSettings();
    const allModels: ModelDescriptor[] = [];

    for (const adapter of this.listAdapters()) {
      const config = currentSettings.providers?.[
        adapter.id as keyof typeof currentSettings.providers
      ] as ProviderConfig | undefined;

      try {
        const adapterModels = await adapter.listModels(config);
        allModels.push(...adapterModels);

        // Include any user-defined custom models from settings
        if (config?.models && Array.isArray(config.models)) {
          for (const customModelId of config.models) {
            const alreadyExists = allModels.some(
              (m) => m.id === customModelId && m.providerId === adapter.id
            );
            if (!alreadyExists) {
              allModels.push({
                id: customModelId,
                name: customModelId,
                providerId: adapter.id,
                description: `Custom model for ${adapter.name}`,
                isCustom: true,
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Failed to list models for provider ${adapter.id}:`, err);
      }
    }

    return allModels;
  }
}

// Global singleton instance
export const providerRegistry = new ProviderRegistry();
