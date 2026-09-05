"use client";

import React from "react";
import { Globe } from "lucide-react";
import type { SearchProviderId } from "../types";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/lib/ui/tooltip";

export interface SearchToggleProps {
  enabled: boolean;
  onToggle: (nextState: boolean) => void;
  activeProvider?: SearchProviderId;
  className?: string;
  disabled?: boolean;
  showLabel?: boolean;
}

const PROVIDER_NAMES: Record<SearchProviderId, string> = {
  duckduckgo: "DuckDuckGo",
  tavily: "Tavily",
  brave: "Brave Search",
  serper: "Google Serper",
  exa: "Exa",
  searxng: "SearXNG",
};

export function SearchToggle({
  enabled,
  onToggle,
  activeProvider = "duckduckgo",
  className,
  disabled = false,
  showLabel = true,
}: SearchToggleProps) {
  const providerLabel = PROVIDER_NAMES[activeProvider] || activeProvider;

  const button = (
    <button
      type="button"
      onClick={() => !disabled && onToggle(!enabled)}
      disabled={disabled}
      aria-pressed={enabled}
      aria-label={`Toggle web search. Current status: ${enabled ? "enabled" : "disabled"}. Provider: ${providerLabel}.`}
      className={cn(
        "group relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none",
        enabled
          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/20"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/70 border border-transparent",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Globe
        className={cn(
          "size-3.5 transition-transform duration-200",
          enabled && "scale-110 rotate-12"
        )}
      />

      {showLabel && (
        <span className="truncate">
          {enabled ? `Search (${providerLabel})` : "Search"}
        </span>
      )}

      {enabled && (
        <span
          className="size-1.5 rounded-full bg-blue-500 animate-pulse"
          aria-hidden="true"
        />
      )}
    </button>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-semibold">
            {enabled ? "Web Search Enabled" : "Web Search Disabled"}
          </p>
          <p className="text-muted-foreground text-[11px]">
            Provider: {providerLabel}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
