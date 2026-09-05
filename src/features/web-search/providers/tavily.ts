import type { SearchOptions, SearchConfig, SearchResult, SearchProviderId } from "../types";
import { BaseSearchProvider, getFaviconUrl } from "./base";

interface TavilyResultItem {
  title: string;
  url: string;
  content: string;
  score?: number;
  published_date?: string;
}

interface TavilySearchResponse {
  query: string;
  answer?: string;
  results: TavilyResultItem[];
}

export class TavilySearchProvider extends BaseSearchProvider {
  readonly id: SearchProviderId = "tavily";
  readonly name = "Tavily AI Search";

  async search(
    query: string,
    options?: SearchOptions,
    config?: SearchConfig
  ): Promise<SearchResult[]> {
    const apiKey = config?.apiKey || process.env["TAVILY_API_KEY"];
    if (!apiKey) {
      throw new Error("Tavily API key is missing. Configure it in settings or set TAVILY_API_KEY.");
    }

    const endpoint = config?.baseURL?.replace(/\/+$/, "") || "https://api.tavily.com";
    const url = endpoint.endsWith("/search") ? endpoint : `${endpoint}/search`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: options?.maxResults ?? 5,
        search_depth: options?.searchDepth === "advanced" ? "advanced" : "basic",
        include_answer: options?.includeAnswer ?? false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavily API returned ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as TavilySearchResponse;
    const items = data.results || [];

    return items.map((item) => ({
      title: item.title || item.url,
      url: item.url,
      snippet: item.content || "",
      score: item.score,
      publishedDate: item.published_date,
      favicon: getFaviconUrl(item.url),
    }));
  }
}
