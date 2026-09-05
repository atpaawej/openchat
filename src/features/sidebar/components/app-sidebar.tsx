"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  PanelLeftClose,
  SquarePen,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatHistoryList } from "./chat-history-list";
import { ProjectsSidebarList } from "./projects-sidebar-list";
import { UserProfilePill } from "./user-profile-pill";
import type { GroupedSessions, SessionSummary } from "../types";
import type { Project } from "@/features/projects/types";

export interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  onOpenSettings: () => void;
  onOpenMcp: () => void;
  onNewProject: () => void;
  activeMcpCount?: number;
}

export function AppSidebar({
  isOpen,
  onToggle,
  isMobileOpen = false,
  onMobileClose,
  onOpenSettings,
  onOpenMcp,
  onNewProject,
  activeMcpCount = 0,
}: AppSidebarProps) {
  const router = useRouter();
  const [groupedSessions, setGroupedSessions] = React.useState<GroupedSessions[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  const refreshSessions = React.useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setGroupedSessions(data.grouped || []);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  }, []);

  const refreshProjects = React.useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  }, []);

  React.useEffect(() => {
    refreshSessions();
    refreshProjects();
  }, [refreshSessions, refreshProjects]);

  // Listen for global custom events to refresh sidebar when a new session is created or project changed
  React.useEffect(() => {
    const handleRefresh = () => {
      refreshSessions();
      refreshProjects();
    };
    window.addEventListener("openchat-refresh-sidebar", handleRefresh);
    return () => {
      window.removeEventListener("openchat-refresh-sidebar", handleRefresh);
    };
  }, [refreshSessions, refreshProjects]);

  const handleNewChat = () => {
    onMobileClose?.();
    router.push("/");
  };

  // Filter sessions if search query is provided
  const displayedGroupedSessions = React.useMemo(() => {
    if (!searchQuery.trim()) return groupedSessions;
    const query = searchQuery.toLowerCase();

    return groupedSessions
      .map((g) => ({
        ...g,
        sessions: g.sessions.filter((s) => s.title.toLowerCase().includes(query)),
      }))
      .filter((g) => g.sessions.length > 0);
  }, [groupedSessions, searchQuery]);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-300 select-none">
      {/* Header Row */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-zinc-800/80 shrink-0">
        <Link
          href="/"
          onClick={() => onMobileClose?.()}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1 hover:bg-zinc-900 transition-colors"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-zinc-900 shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-100">
            OpenChat
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNewChat}
            title="New chat"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
          >
            <SquarePen className="h-4 w-4" />
          </button>

          {/* Desktop Toggle Button */}
          <button
            type="button"
            onClick={onToggle}
            title="Close sidebar"
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onMobileClose}
            title="Close sidebar"
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-3 pb-1 shrink-0">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-zinc-900/90 pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 border border-zinc-800/80 focus:outline-none focus:border-zinc-700 transition-colors"
          />
        </div>
      </div>

      {/* Scrollable Center: Projects + Chat History */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
        <ProjectsSidebarList
          projects={projects}
          onNewProject={onNewProject}
        />

        <div className="border-t border-zinc-850/80 pt-2">
          <ChatHistoryList
            grouped={displayedGroupedSessions}
            onSessionUpdated={refreshSessions}
            onSessionDeleted={refreshSessions}
          />
        </div>
      </div>

      {/* Bottom User Profile & Settings Pill */}
      <UserProfilePill
        onOpenSettings={onOpenSettings}
        onOpenMcp={onOpenMcp}
        activeMcpCount={activeMcpCount}
      />
    </div>
  );

  return (
    <>
      {/* Mobile slide-over drawer overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onMobileClose}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50 transition-transform duration-300 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop collapsible sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col shrink-0 border-r border-zinc-850/80 overflow-hidden transition-[width] duration-300 ease-in-out",
          isOpen ? "w-64" : "w-0 border-r-0"
        )}
      >
        <div className="w-64 h-full flex flex-col">{sidebarContent}</div>
      </aside>
    </>
  );
}
