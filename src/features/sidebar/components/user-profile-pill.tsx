"use client";

import * as React from "react";
import { Settings, Wrench, User } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/lib/ui/tooltip";

export interface UserProfilePillProps {
  onOpenSettings: () => void;
  onOpenMcp: () => void;
  activeMcpCount?: number;
}

export function UserProfilePill({
  onOpenSettings,
  onOpenMcp,
  activeMcpCount = 0,
}: UserProfilePillProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between border-t border-zinc-800/80 p-3 bg-zinc-950/60 dark:bg-zinc-900/60">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-zinc-700 to-zinc-600 text-zinc-100 font-semibold text-xs border border-zinc-600/50 shadow-xs">
            <User className="h-4 w-4 text-zinc-300" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-xs font-medium text-zinc-200">
              OpenChat User
            </span>
            <span className="truncate text-[10px] text-zinc-500">
              Local Self-Host
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onOpenMcp}
                aria-label="MCP Manager"
                className="relative flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              >
                <Wrench className="h-3.5 w-3.5" />
                {activeMcpCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-zinc-900" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs bg-zinc-800 border-zinc-700 text-zinc-200">
              MCP Tools ({activeMcpCount} active)
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="Settings"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs bg-zinc-800 border-zinc-700 text-zinc-200">
              Settings
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
