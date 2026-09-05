"use client";

import * as React from "react";
import { Brain, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ThinkingBlockProps {
  thinking: string;
  isStreaming?: boolean;
  className?: string;
}

export function ThinkingBlock({
  thinking,
  isStreaming = false,
  className,
}: ThinkingBlockProps) {
  const [isOpen, setIsOpen] = React.useState(isStreaming);

  // If streaming begins, auto-open
  React.useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    }
  }, [isStreaming]);

  if (!thinking && !isStreaming) {
    return null;
  }

  return (
    <div
      className={cn(
        "my-2 rounded-2xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/10 overflow-hidden transition-all duration-200",
        className
      )}
    >
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between px-3.5 py-2 text-left cursor-pointer select-none",
          "hover:bg-purple-500/10 transition-colors"
        )}
      >
        <div className="flex items-center gap-2">
          <Brain
            className={cn(
              "h-4 w-4 text-purple-600 dark:text-purple-400",
              isStreaming && "animate-pulse"
            )}
          />
          <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
            {isStreaming ? "Thinking..." : "Thought process"}
          </span>
          {isStreaming && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
          )}
        </div>

        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-purple-500 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="border-t border-purple-500/15 px-3.5 py-2.5 text-xs text-zinc-600 dark:text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto scrollbar-thin">
          {thinking || (isStreaming ? "Gathering thoughts..." : "")}
        </div>
      )}
    </div>
  );
}
