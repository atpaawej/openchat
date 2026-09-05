"use client";

import React from "react";
import { Blocks } from "lucide-react";
import { cn } from "@/lib/utils";

export interface McpToolPillProps {
  count?: number;
  serverCount?: number;
  onClick?: () => void;
  className?: string;
}

export function McpToolPill({
  count = 0,
  serverCount,
  onClick,
  className,
}: McpToolPillProps) {
  const hasTools = count > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
        hasTools
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/60 hover:bg-zinc-200/60 dark:hover:bg-zinc-800",
        onClick ? "cursor-pointer" : "cursor-default",
        className
      )}
      title={
        hasTools
          ? `${count} active MCP tool${count === 1 ? "" : "s"}${
              serverCount !== undefined ? ` across ${serverCount} server${serverCount === 1 ? "" : "s"}` : ""
            }`
          : "No active MCP tools"
      }
    >
      <Blocks className="w-3.5 h-3.5" />
      <span>
        {count} {count === 1 ? "tool" : "tools"}
      </span>
    </button>
  );
}
