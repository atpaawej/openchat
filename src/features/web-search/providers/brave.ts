import type { SearchOptions, SearchConfig, SearchResult, SearchProviderId } from "../types";
import { BaseSearchProvider, getFaviconUrl } from "./base";

interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  page_age?: string;
  profile?: {
    name?: string;
    img?: string;
  };
}

interface BraveSearchResponse {
  web?: {
    results?: BraveWebResult[];
  };
}

export class BraveSearchProvider extends BaseSearchProvider {
  readonly id: SearchProviderId = "brave";
  readonly name = "Brave Search";

  async search(
    query: string,
    options?: SearchOptions,
    config?: SearchConfig
  ): Promise<SearchResult[]> {
    const apiKey = config?.apiKey || process.env["BRAVE_API_KEY"];
    if (!apiKey) {
      throw new Error("Brave Search API key is missing. Configure it in settings or set BRAVE_API_KEY.");
    }

    const maxResults = options?.maxResults ?? 5;
    const base = config?.baseURL?.replace(/\/+$/, "") || "https://api.search.brave.com/res/v1/web/search";
    const url = new URL(base);
    url.searchParams.set("q", query);
    url.searchParams.set("count", String(Math.min(maxResults, 20)));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brave Search API returned ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as BraveSearchResponse;
    const results = data.web?.results || [];

    return results.map((item) => ({
      title: item.title || item.url,
      url: item.url,
      snippet: item.description || "",
      publishedDate: item.page_age,
      favicon: item.profile?.img || getFaviconUrl(item.url),
    }));
  }
}
