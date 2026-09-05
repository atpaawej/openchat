"use client";

import React, { useState } from "react";
import { Globe, ExternalLink } from "lucide-react";
import type { SearchResult } from "../types";
import { cn } from "@/lib/utils";

export interface CitationBadgeProps {
  result: SearchResult;
  index?: number;
  className?: string;
  variant?: "pill" | "card";
}

export function CitationBadge({
  result,
  index,
  className,
  variant = "pill",
}: CitationBadgeProps) {
  const [imageError, setImageError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  let hostname = "";
  try {
    hostname = new URL(result.url).hostname.replace(/^www\./, "");
  } catch {
    hostname = result.url;
  }

  if (variant === "card") {
    return (
      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "group flex flex-col justify-between p-3 rounded-xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-colors text-left text-xs w-64 max-w-full space-y-2",
          className
        )}
      >
        <div className="flex items-center space-x-2 text-muted-foreground">
          {result.favicon && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.favicon}
              alt=""
              width={14}
              height={14}
              className="rounded-sm object-contain size-3.5"
              onError={() => setImageError(true)}
            />
          ) : (
            <Globe className="size-3.5" />
          )}
          <span className="truncate font-medium">{hostname}</span>
          {index !== undefined && (
            <span className="ml-auto text-[10px] bg-secondary px-1.5 py-0.5 rounded-full text-foreground/80 font-mono">
              {index}
            </span>
          )}
        </div>

        <div className="font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {result.title}
        </div>

        {result.snippet && (
          <p className="text-muted-foreground line-clamp-3 text-[11px] leading-relaxed">
            {result.snippet}
          </p>
        )}

        <div className="pt-1 flex items-center text-[10px] text-muted-foreground group-hover:text-foreground">
          <span>Read source</span>
          <ExternalLink className="size-2.5 ml-1 opacity-70" />
        </div>
      </a>
    );
  }

  // Pill variant (compact inline chip with hover preview)
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
      onFocus={() => setShowPreview(true)}
      onBlur={() => setShowPreview(false)}
    >
      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Source: ${result.title} (${hostname})`}
        className={cn(
          "inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border transition-all text-muted-foreground hover:text-foreground max-w-[200px] truncate",
          className
        )}
      >
        {result.favicon && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.favicon}
            alt=""
            width={12}
            height={12}
            className="rounded-sm object-contain size-3 shrink-0"
            onError={() => setImageError(true)}
          />
        ) : (
          <Globe className="size-3 shrink-0" />
        )}
        <span className="truncate">{hostname}</span>
        {index !== undefined && (
          <span className="font-mono text-[10px] opacity-70">[{index}]</span>
        )}
      </a>

      {showPreview && (
        <div
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg bg-popover text-popover-foreground shadow-lg border border-border text-xs pointer-events-none animate-in fade-in-0 zoom-in-95 duration-100"
        >
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            {result.favicon && !imageError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.favicon}
                alt=""
                width={12}
                height={12}
                className="size-3 object-contain rounded-sm"
              />
            ) : (
              <Globe className="size-3" />
            )}
            <span className="font-medium text-[11px] truncate">{hostname}</span>
          </div>
          <div className="font-semibold text-[12px] line-clamp-2 mb-1">
            {result.title}
          </div>
          {result.snippet && (
            <p className="text-muted-foreground text-[11px] line-clamp-3">
              {result.snippet}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function CitationBadgeList({
  results,
  className,
  variant = "pill",
}: {
  results: SearchResult[];
  className?: string;
  variant?: "pill" | "card";
}) {
  if (!results || results.length === 0) return null;

  return (
    <div
      className={cn(
        variant === "card"
          ? "flex flex-wrap gap-2.5 my-3"
          : "flex flex-wrap items-center gap-1.5 my-2",
        className
      )}
    >
      {results.map((r, i) => (
        <CitationBadge
          key={`${r.url}-${i}`}
          result={r}
          index={i + 1}
          variant={variant}
        />
      ))}
    </div>
  );
}
