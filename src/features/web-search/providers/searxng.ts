import type { SearchOptions, SearchConfig, SearchResult, SearchProviderId } from "../types";
import { BaseSearchProvider, getFaviconUrl } from "./base";

interface SearxngResultItem {
  title: string;
  url: string;
  content?: string;
  score?: number;
  publishedDate?: string;
  engine?: string;
}

interface SearxngSearchResponse {
  query: string;
  results?: SearxngResultItem[];
}

export class SearxngSearchProvider extends BaseSearchProvider {
  readonly id: SearchProviderId = "searxng";
  readonly name = "SearXNG (Self-Hosted)";

  async search(
    query: string,
    options?: SearchOptions,
    config?: SearchConfig
  ): Promise<SearchResult[]> {
    const rawBase =
      config?.baseURL || process.env["SEARXNG_BASE_URL"] || "http://localhost:8080";
    const endpoint = rawBase.replace(/\/+$/, "");
    const searchUrl = endpoint.endsWith("/search") ? endpoint : `${endpoint}/search`;

    const url = new URL(searchUrl);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (config?.apiKey) {
      headers["Authorization"] = `Bearer ${config.apiKey}`;
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SearXNG API returned ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as SearxngSearchResponse;
    const items = data.results || [];
    const maxResults = options?.maxResults ?? 5;

    return items.slice(0, maxResults).map((item) => ({
      title: item.title || item.url,
      url: item.url,
      snippet: item.content || "",
      score: item.score,
      publishedDate: item.publishedDate,
      favicon: getFaviconUrl(item.url),
    }));
  }
}
