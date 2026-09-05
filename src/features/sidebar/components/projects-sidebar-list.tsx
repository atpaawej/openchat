"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Folder, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/features/projects/types";

export interface ProjectsSidebarListProps {
  projects: Project[];
  onNewProject: () => void;
}

export function ProjectsSidebarList({
  projects,
  onNewProject,
}: ProjectsSidebarListProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-3 py-1 text-[11px] font-medium tracking-wider uppercase text-zinc-500 select-none">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <span>Projects</span>
          {projects.length > 0 && (
            <span className="ml-1 rounded bg-zinc-800 px-1 py-0.2 text-[10px] text-zinc-400">
              {projects.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onNewProject}
          title="New Project"
          className="flex h-5 w-5 items-center justify-center rounded hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-0.5 pt-0.5">
          {projects.length === 0 ? (
            <button
              type="button"
              onClick={onNewProject}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 hover:bg-zinc-850 hover:text-zinc-300 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create first project</span>
            </button>
          ) : (
            projects.map((proj) => {
              const isActive = pathname === `/p/${proj.id}`;
              return (
                <Link
                  key={proj.id}
                  href={`/p/${proj.id}`}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors",
                    isActive
                      ? "bg-zinc-800 text-zinc-100 font-medium"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                  )}
                >
                  <Folder className="h-3.5 w-3.5 shrink-0 text-amber-500/80" />
                  <span className="truncate">{proj.name}</span>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
