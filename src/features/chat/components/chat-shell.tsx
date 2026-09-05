"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  PanelLeft,
  SquarePen,
  Share2,
  Settings,
  Sparkles,
  Check,
} from "lucide-react";
import { AppSidebar } from "@/features/sidebar/components/app-sidebar";
import { SettingsDialog } from "@/features/settings/components/settings-dialog";
import { McpManagerDialog } from "@/features/mcp/components/mcp-manager-dialog";
import { ProjectModal } from "@/features/projects/components/project-modal";
import { ModelSelector } from "@/features/providers/components/model-selector";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/lib/ui/tooltip";
import type { ProviderId } from "@/features/providers/types";

export interface ChatShellProps {
  children: React.ReactNode;
  threadTitle?: string;
  selectedModelId?: string;
  selectedProviderId?: string;
  onModelChange?: (model: string, provider: string) => void;
  sessionId?: string;
  projectId?: string;
}

export function ChatShell({
  children,
  threadTitle = "OpenChat",
  selectedModelId = "gpt-4o",
  selectedProviderId = "openai",
  onModelChange,
  sessionId,
}: ChatShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  // Dialog states
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsTab, setSettingsTab] = React.useState("general");
  const [mcpOpen, setMcpOpen] = React.useState(false);
  const [projectModalOpen, setProjectModalOpen] = React.useState(false);

  // Tools & Share state
  const [activeMcpCount, setActiveMcpCount] = React.useState(0);
  const [copiedShare, setCopiedShare] = React.useState(false);

  // Refresh active MCP tools count
  React.useEffect(() => {
    fetch("/api/mcp")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.tools && Array.isArray(data.tools)) {
          setActiveMcpCount(data.tools.length);
        }
      })
      .catch(() => {});
  }, []);

  // Keyboard Shortcuts:
  // - Cmd/Ctrl + K: New Chat
  // - Cmd/Ctrl + Shift + S: Toggle Sidebar
  // - Cmd/Ctrl + ,: Open Settings
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/");
      } else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      } else if (isCmdOrCtrl && e.key === ",") {
        e.preventDefault();
        setSettingsTab("general");
        setSettingsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const handleShare = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleNewChat = () => {
    router.push("/");
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full overflow-hidden bg-zinc-50 dark:bg-[#212121] text-zinc-900 dark:text-zinc-100 font-sans">
        {/* Left Sidebar */}
        <AppSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          isMobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
          onOpenSettings={() => {
            setSettingsTab("general");
            setSettingsOpen(true);
          }}
          onOpenMcp={() => setMcpOpen(true)}
          onNewProject={() => setProjectModalOpen(true)}
          activeMcpCount={activeMcpCount}
        />

        {/* Center / Right Content Canvas */}
        <div className="relative flex flex-1 flex-col h-full overflow-hidden min-w-0">
          {/* Top Bar Header */}
          <header className="flex h-14 shrink-0 items-center justify-between px-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md z-10 select-none">
            {/* Left Controls */}
            <div className="flex items-center gap-2 overflow-hidden pr-2">
              {/* Sidebar toggle button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        setMobileSidebarOpen(true);
                      } else {
                        setSidebarOpen(!sidebarOpen);
                      }
                    }}
                    aria-label="Toggle sidebar"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Toggle sidebar (Ctrl+Shift+S)
                </TooltipContent>
              </Tooltip>

              {/* New Chat shortcut button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleNewChat}
                    aria-label="New chat"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <SquarePen className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  New chat (Ctrl+K)
                </TooltipContent>
              </Tooltip>

              {/* Thread Title */}
              <div className="ml-1 flex items-center gap-2 truncate">
                <span className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {threadTitle}
                </span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Model Selector Pill */}
              {onModelChange ? (
                <ModelSelector
                  currentModelId={selectedModelId}
                  currentProviderId={selectedProviderId as ProviderId}
                  onSelectModel={(model, provider) => onModelChange(model, provider)}
                />
              ) : (
                <div className="flex items-center gap-1.5 rounded-full border border-zinc-200/80 dark:border-zinc-800 bg-white/60 dark:bg-zinc-850/80 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-xs">
                  <Sparkles className="h-3 w-3 text-zinc-500" />
                  <span>{selectedModelId}</span>
                </div>
              )}

              {/* Share Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleShare}
                    aria-label="Share chat"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {copiedShare ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {copiedShare ? "Link copied!" : "Share chat"}
                </TooltipContent>
              </Tooltip>

              {/* Settings Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsTab("general");
                      setSettingsOpen(true);
                    }}
                    aria-label="Settings"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Settings
                </TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Main Body */}
          <main className="relative flex flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>

        {/* Global Modals */}
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          defaultTab={settingsTab}
          onOpenMcpFull={() => setMcpOpen(true)}
        />

        <McpManagerDialog
          open={mcpOpen}
          onOpenChange={setMcpOpen}
          onToolsUpdated={(count) => setActiveMcpCount(count)}
        />

        <ProjectModal
          open={projectModalOpen}
          onOpenChange={setProjectModalOpen}
        />
      </div>
    </TooltipProvider>
  );
}
