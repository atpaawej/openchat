"use client";

import * as React from "react";
import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/lib/ui/tooltip";

export interface ReasonToggleProps {
  enabled: boolean;
  onToggle: (nextState: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function ReasonToggle({
  enabled,
  onToggle,
  className,
  disabled = false,
}: ReasonToggleProps) {
  const button = (
    <button
      type="button"
      onClick={() => !disabled && onToggle(!enabled)}
      disabled={disabled}
      aria-pressed={enabled}
      aria-label={`Toggle deep reasoning mode. Currently ${enabled ? "enabled" : "disabled"}.`}
      className={cn(
        "group relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none",
        enabled
          ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-xs shadow-purple-500/20 hover:bg-purple-500/20"
          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 border border-transparent",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Brain
        className={cn(
          "h-3.5 w-3.5 transition-transform duration-200",
          enabled && "scale-110 text-purple-500 animate-pulse"
        )}
      />
      <span>Think</span>
      {enabled && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping"
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
            {enabled ? "Deep Reasoning Active" : "Deep Reasoning"}
          </p>
          <p className="text-zinc-400 text-[11px]">
            {enabled
              ? "Model will reason step-by-step before answering"
              : "Enable to reveal thinking steps and inner monologue"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
