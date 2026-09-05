import { tool } from "ai";
import { z } from "zod";
import type { PluginDefinition } from "../types";
import { decodeHtmlEntities } from "@/features/web-search/providers/base";

export interface ReadWebpageResult {
  url: string;
  title: string;
  content: string;
  length: number;
  truncated: boolean;
}

export function htmlToReadableText(html: string): { title: string; content: string } {
  // 1. Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch && titleMatch[1] ? decodeHtmlEntities(titleMatch[1].trim()) : "";

  // 2. Remove script, style, noscript, svg, canvas, iframe, and comments
  let cleaned = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, " ");

  // 3. Convert headers to markdown
  cleaned = cleaned.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n\n# $1\n\n");
  cleaned = cleaned.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n\n## $1\n\n");
  cleaned = cleaned.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n\n### $1\n\n");
  cleaned = cleaned.replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, "\n\n#### $1\n\n");

  // 4. Convert links and lists
  cleaned = cleaned.replace(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
    const cleanText = text.replace(/<[^>]+>/g, "").trim();
    if (!cleanText) return "";
    return `[${cleanText}](${href})`;
  });

  cleaned = cleaned.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n* $1");
  cleaned = cleaned.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, "\n```\n$1\n```\n");
  cleaned = cleaned.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");
  cleaned = cleaned.replace(/<(?:p|div|br|tr|section|article)[^>]*>/gi, "\n");

  // 5. Strip all remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, " ");

  // 6. Decode entities and normalize whitespace
  cleaned = decodeHtmlEntities(cleaned)
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();

  return { title, content: cleaned };
}

export function createUrlReaderTool() {
  return tool({
    description:
      "Fetches the textual content of any webpage given its URL, stripping scripts, styles, and navigation clutter to produce readable text and markdown.",
    inputSchema: z.object({
      url: z
        .string()
        .url()
        .describe("The full HTTP or HTTPS URL of the webpage to read."),
      maxLength: z
        .number()
        .optional()
        .describe("Maximum number of characters of content to return (default 15,000)."),
    }),
    execute: async ({ url, maxLength = 15000 }): Promise<ReadWebpageResult> => {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error(`Unsupported protocol: ${parsed.protocol}. Only http and https URLs are allowed.`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (OpenChat/1.0)",
            Accept: "text/html,application/xhtml+xml,text/plain,application/json;q=0.9,*/*;q=0.8",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: HTTP status ${response.status} ${response.statusText}`);
        }

        const rawHtml = await response.text();
        const { title, content } = htmlToReadableText(rawHtml);

        const limit = Math.max(100, Math.min(maxLength, 50000));
        const truncated = content.length > limit;
        const finalContent = truncated
          ? `${content.slice(0, limit)}\n\n... [Content truncated at ${limit} characters]`
          : content;

        return {
          url,
          title: title || parsed.hostname,
          content: finalContent,
          length: finalContent.length,
          truncated,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    },
  });
}

export const urlReaderPlugin: PluginDefinition = {
  id: "url-reader",
  name: "Webpage Reader",
  description: "Reads, extracts, and summarizes text and markdown content from web URLs.",
  createTools: () => ({
    read_webpage: createUrlReaderTool(),
  }),
};
