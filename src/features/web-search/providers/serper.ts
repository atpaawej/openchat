import type { SearchOptions, SearchConfig, SearchResult, SearchProviderId } from "../types";
import { BaseSearchProvider, getFaviconUrl } from "./base";

interface SerperOrganicItem {
  title: string;
  link: string;
  snippet?: string;
  date?: string;
  position?: number;
}

interface SerperSearchResponse {
  organic?: SerperOrganicItem[];
  knowledgeGraph?: {
    title?: string;
    type?: string;
    description?: string;
    website?: string;
  };
}

export class SerperSearchProvider extends BaseSearchProvider {
  readonly id: SearchProviderId = "serper";
  readonly name = "Google Serper";

  async search(
    query: string,
    options?: SearchOptions,
    config?: SearchConfig
  ): Promise<SearchResult[]> {
    const apiKey = config?.apiKey || process.env["SERPER_API_KEY"];
    if (!apiKey) {
      throw new Error("Serper API key is missing. Configure it in settings or set SERPER_API_KEY.");
    }

    const endpoint = config?.baseURL?.replace(/\/+$/, "") || "https://google.serper.dev";
    const url = endpoint.endsWith("/search") ? endpoint : `${endpoint}/search`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        q: query,
        num: options?.maxResults ?? 5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Serper API returned ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as SerperSearchResponse;
    const results: SearchResult[] = [];

    // Optional knowledge graph top card
    if (data.knowledgeGraph?.title && data.knowledgeGraph?.website) {
      results.push({
        title: data.knowledgeGraph.title,
        url: data.knowledgeGraph.website,
        snippet: data.knowledgeGraph.description || "",
        favicon: getFaviconUrl(data.knowledgeGraph.website),
      });
    }

    if (Array.isArray(data.organic)) {
      for (const item of data.organic) {
        if (item.title && item.link) {
          results.push({
            title: item.title,
            url: item.link,
            snippet: item.snippet || "",
            publishedDate: item.date,
            favicon: getFaviconUrl(item.link),
          });
        }
      }
    }

    return results.slice(0, options?.maxResults ?? 5);
  }
}
