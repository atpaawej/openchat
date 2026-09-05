import type { SearchOptions, SearchConfig, SearchResult, SearchProviderId } from "../types";
import { BaseSearchProvider, getFaviconUrl, stripHtml } from "./base";

export class DuckDuckGoSearchProvider extends BaseSearchProvider {
  readonly id: SearchProviderId = "duckduckgo";
  readonly name = "DuckDuckGo";

  async search(
    query: string,
    options?: SearchOptions,
    _config?: SearchConfig
  ): Promise<SearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const maxResults = options?.maxResults ?? 5;

    // 1. Primary approach: Scrape DuckDuckGo HTML search results (zero API key needed)
    try {
      const htmlResults = await this.searchHtml(trimmed, maxResults);
      if (htmlResults.length > 0) {
        return htmlResults.slice(0, maxResults);
      }
    } catch {
      // Fallback to Instant Answers API below
    }

    // 2. Secondary fallback: DuckDuckGo Instant Answer API
    try {
      const apiResults = await this.searchApi(trimmed, maxResults);
      if (apiResults.length > 0) {
        return apiResults.slice(0, maxResults);
      }
    } catch {
      // Return empty if both fail
    }

    return [];
  }

  /**
   * Scrapes DuckDuckGo HTML results endpoint
   */
  async searchHtml(query: string, maxResults: number): Promise<SearchResult[]> {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo HTML returned HTTP ${response.status}`);
    }

    const html = await response.text();
    const results: SearchResult[] = [];

    // Split HTML by web-result blocks
    const sections = html.split(/<div class="[^"]*web-result[^"]*"/i);

    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];
      if (!section) continue;

      const linkMatch = section.match(
        /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
      );
      if (!linkMatch || !linkMatch[1] || !linkMatch[2]) continue;

      const rawHref = linkMatch[1];
      const titleRaw = linkMatch[2];

      // Extract real target URL from uddg parameter
      const uddgMatch = rawHref.match(/[?&]uddg=([^&]+)/);
      let targetUrl =
        uddgMatch && uddgMatch[1] ? decodeURIComponent(uddgMatch[1]) : rawHref;
      if (targetUrl.startsWith("//")) {
        targetUrl = `https:${targetUrl}`;
      }

      // Ignore sponsored / ad redirects
      if (
        targetUrl.includes("duckduckgo.com/y.js") ||
        targetUrl.includes("ad_provider=") ||
        targetUrl.includes("ad_domain=")
      ) {
        continue;
      }

      const snippetMatch = section.match(
        /<(?:a|div)[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|div)>/i
      );

      const title = stripHtml(titleRaw);
      const snippet = snippetMatch && snippetMatch[1] ? stripHtml(snippetMatch[1]) : "";

      if (title && targetUrl) {
        results.push({
          title,
          url: targetUrl,
          snippet,
          favicon: getFaviconUrl(targetUrl),
        });
      }

      if (results.length >= maxResults) {
        break;
      }
    }

    return results;
  }

  /**
   * Fallback using DuckDuckGo Instant Answer JSON API
   */
  async searchApi(query: string, maxResults: number): Promise<SearchResult[]> {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=0`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo API returned HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      Heading?: string;
      AbstractText?: string;
      AbstractURL?: string;
      Results?: Array<{ FirstURL?: string; Text?: string }>;
      RelatedTopics?: Array<{
        FirstURL?: string;
        Text?: string;
        Topics?: Array<{ FirstURL?: string; Text?: string }>;
      }>;
    };

    const results: SearchResult[] = [];

    // Abstract
    if (data.AbstractText && data.AbstractURL) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL,
        snippet: data.AbstractText,
        favicon: getFaviconUrl(data.AbstractURL),
      });
    }

    // Results array
    if (Array.isArray(data.Results)) {
      for (const r of data.Results) {
        if (r.FirstURL && r.Text) {
          const parts = r.Text.split(" - ");
          const title = parts[0] || r.Text;
          results.push({
            title,
            url: r.FirstURL,
            snippet: r.Text,
            favicon: getFaviconUrl(r.FirstURL),
          });
        }
      }
    }

    // Related topics
    if (Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics) {
        if (topic.FirstURL && topic.Text) {
          const parts = topic.Text.split(" - ");
          const title = parts[0] || topic.Text;
          results.push({
            title,
            url: topic.FirstURL,
            snippet: topic.Text,
            favicon: getFaviconUrl(topic.FirstURL),
          });
        } else if (Array.isArray(topic.Topics)) {
          for (const sub of topic.Topics) {
            if (sub.FirstURL && sub.Text) {
              const parts = sub.Text.split(" - ");
              const title = parts[0] || sub.Text;
              results.push({
                title,
                url: sub.FirstURL,
                snippet: sub.Text,
                favicon: getFaviconUrl(sub.FirstURL),
              });
            }
          }
        }
      }
    }

    return results.slice(0, maxResults);
  }
}
