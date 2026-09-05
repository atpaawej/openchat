import type { SearchOptions, SearchConfig, SearchResult, SearchProviderId } from "../types";
import { BaseSearchProvider, getFaviconUrl } from "./base";

interface ExaResultItem {
  id?: string;
  title?: string;
  url: string;
  text?: string;
  summary?: string;
  publishedDate?: string;
  score?: number;
}

interface ExaSearchResponse {
  results?: ExaResultItem[];
}

export class ExaSearchProvider extends BaseSearchProvider {
  readonly id: SearchProviderId = "exa";
  readonly name = "Exa Neural Search";

  async search(
    query: string,
    options?: SearchOptions,
    config?: SearchConfig
  ): Promise<SearchResult[]> {
    const apiKey = config?.apiKey || process.env["EXA_API_KEY"];
    if (!apiKey) {
      throw new Error("Exa API key is missing. Configure it in settings or set EXA_API_KEY.");
    }

    const endpoint = config?.baseURL?.replace(/\/+$/, "") || "https://api.exa.ai";
    const url = endpoint.endsWith("/search") ? endpoint : `${endpoint}/search`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query,
        numResults: options?.maxResults ?? 5,
        useAutoprompt: true,
        contents: {
          text: {
            maxCharacters: 1000,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Exa API returned ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as ExaSearchResponse;
    const items = data.results || [];

    return items.map((item) => ({
      title: item.title || item.url,
      url: item.url,
      snippet: item.text || item.summary || "",
      score: item.score,
      publishedDate: item.publishedDate,
      favicon: getFaviconUrl(item.url),
    }));
  }
}
