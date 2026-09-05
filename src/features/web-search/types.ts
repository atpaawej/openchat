import type { SearchProviderConfig, OpenChatSettings } from "@/features/settings/config-file";

export type SearchProviderId =
  | "duckduckgo"
  | "tavily"
  | "brave"
  | "serper"
  | "exa"
  | "searxng";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
  publishedDate?: string;
  favicon?: string;
}

export interface SearchOptions {
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
  includeAnswer?: boolean;
}

export type SearchConfig = SearchProviderConfig;

export interface WebSearchProvider {
  readonly id: SearchProviderId;
  readonly name: string;
  search(
    query: string,
    options?: SearchOptions,
    config?: SearchConfig
  ): Promise<SearchResult[]>;
}

export { type OpenChatSettings };
