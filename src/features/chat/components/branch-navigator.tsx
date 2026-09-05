"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BranchInfo } from "../types";

export interface BranchNavigatorProps {
  branchInfo: BranchInfo;
  onSwitchBranch: (direction: "prev" | "next") => void;
  className?: string;
  disabled?: boolean;
}

export function BranchNavigator({
  branchInfo,
  onSwitchBranch,
  className,
  disabled = false,
}: BranchNavigatorProps) {
  const { currentIndex, totalCount } = branchInfo;

  if (totalCount <= 1) {
    return null;
  }

  const canGoPrev = currentIndex > 1 && !disabled;
  const canGoNext = currentIndex < totalCount && !disabled;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md text-[11px] font-medium text-zinc-500 dark:text-zinc-400 select-none",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onSwitchBranch("prev")}
        disabled={!canGoPrev}
        aria-label="Previous version"
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
          canGoPrev ? "hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer" : "opacity-30 cursor-not-allowed"
        )}
      >
        <ChevronLeft className="h-3 w-3" />
      </button>

      <span className="tabular-nums px-0.5">
        {currentIndex} / {totalCount}
      </span>

      <button
        type="button"
        onClick={() => onSwitchBranch("next")}
        disabled={!canGoNext}
        aria-label="Next version"
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
          canGoNext ? "hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer" : "opacity-30 cursor-not-allowed"
        )}
      >
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}
