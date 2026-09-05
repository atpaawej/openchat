import type {
  SearchProviderId,
  SearchResult,
  SearchOptions,
  WebSearchProvider,
} from "./types";
import {
  DuckDuckGoSearchProvider,
  TavilySearchProvider,
  BraveSearchProvider,
  SerperSearchProvider,
  ExaSearchProvider,
  SearxngSearchProvider,
} from "./providers";
import {
  type OpenChatSettings,
  loadSettings,
} from "@/features/settings/config-file";

export class SearchRegistry {
  private providers = new Map<SearchProviderId, WebSearchProvider>();

  constructor() {
    this.registerProvider(new DuckDuckGoSearchProvider());
    this.registerProvider(new TavilySearchProvider());
    this.registerProvider(new BraveSearchProvider());
    this.registerProvider(new SerperSearchProvider());
    this.registerProvider(new ExaSearchProvider());
    this.registerProvider(new SearxngSearchProvider());
  }

  registerProvider(provider: WebSearchProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: SearchProviderId): WebSearchProvider | undefined {
    return this.providers.get(id);
  }

  listProviders(): WebSearchProvider[] {
    return Array.from(this.providers.values());
  }

  async search(
    providerId: SearchProviderId = "duckduckgo",
    query: string,
    options?: SearchOptions,
    settings?: OpenChatSettings
  ): Promise<SearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    let currentSettings = settings;
    if (!currentSettings && typeof window === "undefined") {
      try {
        currentSettings = loadSettings();
      } catch {
        // use default/env fallback
      }
    }

    const targetProviderId = this.providers.has(providerId) ? providerId : "duckduckgo";
    const provider = this.getProvider(targetProviderId);

    if (!provider) {
      // Fallback to duckduckgo provider
      const ddg = this.getProvider("duckduckgo");
      if (!ddg) return [];
      return ddg.search(trimmed, options);
    }

    const providerConfig = currentSettings?.searchProviders?.[targetProviderId];

    try {
      return await provider.search(trimmed, options, providerConfig);
    } catch (error) {
      // If a non-fallback provider fails (e.g. missing API key, rate limit),
      // gracefully fall back to zero-key DuckDuckGo
      if (targetProviderId !== "duckduckgo") {
        console.warn(
          `[SearchRegistry] Provider '${targetProviderId}' failed. Falling back to DuckDuckGo:`,
          error instanceof Error ? error.message : error
        );
        const ddg = this.getProvider("duckduckgo");
        if (ddg) {
          return await ddg.search(trimmed, options);
        }
      }
      throw error;
    }
  }
}

// Global singleton instance
export const searchRegistry = new SearchRegistry();
