import type { ProviderAdapter, ProviderConfig, ProviderId, ModelDescriptor, LanguageModelV1 } from "../types";

export abstract class BaseProviderAdapter implements ProviderAdapter {
  abstract readonly id: ProviderId;
  abstract readonly name: string;

  abstract getLanguageModel(modelId: string, config?: ProviderConfig): LanguageModelV1;
  abstract listModels(config?: ProviderConfig): Promise<ModelDescriptor[]>;
}
