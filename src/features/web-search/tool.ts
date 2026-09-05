import { tool } from "ai";
import { z } from "zod";
import { searchRegistry } from "./registry";
import type { SearchProviderId, SearchResult } from "./types";
import type { OpenChatSettings } from "@/features/settings/config-file";

export interface WebSearchToolResult {
  query: string;
  provider: SearchProviderId;
  results: SearchResult[];
  formatted: string;
}

export function createWebSearchTool(
  providerId: SearchProviderId = "duckduckgo",
  settings?: OpenChatSettings
) {
  return tool({
    description:
      "Search the live web for up-to-date information, current news, technical documentation, or real-time facts.",
    inputSchema: z.object({
      query: z
        .string()
        .describe("The web search query to execute on search engines."),
      maxResults: z
        .number()
        .optional()
        .describe("Maximum number of search results to return (default 5)."),
    }),
    execute: async ({ query, maxResults }): Promise<WebSearchToolResult> => {
      const results = await searchRegistry.search(
        providerId,
        query,
        { maxResults: maxResults ?? 5 },
        settings
      );

      const formatted =
        results.length === 0
          ? `No search results found for: "${query}"`
          : results
              .map(
                (r, i) =>
                  `[${i + 1}] "${r.title}"\nURL: ${r.url}\nSummary: ${r.snippet}`
              )
              .join("\n\n");

      return {
        query,
        provider: providerId,
        results,
        formatted,
      };
    },
  });
}
