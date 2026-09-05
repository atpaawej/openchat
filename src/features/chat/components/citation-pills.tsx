"use client";

import * as React from "react";
import { CitationBadgeList } from "@/features/web-search/components/citation-badge";
import type { CitationItem } from "../types";

export interface CitationPillsProps {
  citations: CitationItem[] | string | null | undefined;
  className?: string;
  variant?: "pill" | "card";
}

export function CitationPills({
  citations,
  className,
  variant = "pill",
}: CitationPillsProps) {
  if (!citations) return null;

  let parsedList: CitationItem[] = [];
  if (typeof citations === "string") {
    try {
      parsedList = JSON.parse(citations);
    } catch {
      return null;
    }
  } else if (Array.isArray(citations)) {
    parsedList = citations;
  }

  if (parsedList.length === 0) return null;

  // Convert CitationItem to SearchResult shape
  const results = parsedList.map((c) => ({
    title: c.title,
    url: c.url,
    snippet: c.snippet || "",
    favicon: c.favicon,
  }));

  return <CitationBadgeList results={results} className={className} variant={variant} />;
}
