import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchRegistry } from "@/features/web-search/registry";
import type { SearchProviderId, SearchOptions } from "@/features/web-search/types";
import { loadSettings } from "@/features/settings/config-file";

const SearchRequestBodySchema = z.object({
  query: z.string().min(1, "Query must not be empty"),
  provider: z
    .enum(["duckduckgo", "tavily", "brave", "serper", "exa", "searxng"])
    .optional(),
  options: z
    .object({
      maxResults: z.number().int().min(1).max(50).optional(),
      searchDepth: z.enum(["basic", "advanced"]).optional(),
      includeAnswer: z.boolean().optional(),
    })
    .optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q") || searchParams.get("query");
  const rawProvider = searchParams.get("provider");
  const rawMax = searchParams.get("maxResults") || searchParams.get("num");

  if (!rawQuery || !rawQuery.trim()) {
    return NextResponse.json(
      { error: "Query parameter 'q' or 'query' is required" },
      { status: 400 }
    );
  }

  const settings = loadSettings();
  const provider = (rawProvider ||
    settings.activeSearchProvider ||
    "duckduckgo") as SearchProviderId;
  const maxResults = rawMax ? parseInt(rawMax, 10) || 5 : 5;

  try {
    const results = await searchRegistry.search(
      provider,
      rawQuery,
      { maxResults },
      settings
    );

    return NextResponse.json({
      success: true,
      query: rawQuery,
      provider,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("[API /api/search GET] Search failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Search failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parseResult = SearchRequestBodySchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { query, provider: requestedProvider, options } = parseResult.data;
    const settings = loadSettings();
    const provider: SearchProviderId =
      requestedProvider || settings.activeSearchProvider || "duckduckgo";

    const searchOptions: SearchOptions = {
      maxResults: options?.maxResults ?? 5,
      searchDepth: options?.searchDepth,
      includeAnswer: options?.includeAnswer,
    };

    const results = await searchRegistry.search(
      provider,
      query,
      searchOptions,
      settings
    );

    return NextResponse.json({
      success: true,
      query,
      provider,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("[API /api/search POST] Search failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Search failed",
      },
      { status: 500 }
    );
  }
}
