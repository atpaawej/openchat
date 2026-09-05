"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, Code, BookOpen, Compass, Lightbulb } from "lucide-react";
import { Composer } from "@/features/composer/components/composer";
import type { ComposerSubmitPayload } from "@/features/composer/types";
import { ChatContainer } from "./chat-container";
import { MessageList } from "./message-list";
import { useChatSession } from "../hooks/use-chat-session";
import type { ChatMessage } from "../types";
import { cn } from "@/lib/utils";

export interface ChatInterfaceProps {
  initialSessionId?: string;
  initialMessages?: ChatMessage[];
  defaultModel?: string;
  defaultProvider?: string;
  activeSearchProvider?: string;
}

const STARTER_PROMPTS = [
  {
    icon: Code,
    title: "Write a script",
    prompt: "Write a TypeScript function to debounce an async search input with rate-limiting.",
  },
  {
    icon: Lightbulb,
    title: "Explain a concept",
    prompt: "Explain how large language models generate tokens and what temperature does.",
  },
  {
    icon: Compass,
    title: "Explore ideas",
    prompt: "What are 5 innovative web applications you could build using Model Context Protocol (MCP)?",
  },
  {
    icon: BookOpen,
    title: "Math & Reasoning",
    prompt: "Solve the quadratic equation $ax^2 + bx + c = 0$ using the quadratic formula and explain the discriminant.",
  },
];

export function ChatInterface({
  initialSessionId,
  initialMessages = [],
  defaultModel = "gpt-4o",
  defaultProvider = "openai",
  activeSearchProvider = "duckduckgo",
}: ChatInterfaceProps) {
  const router = useRouter();

  const [modelId, setModelId] = React.useState(defaultModel);
  const [providerId, setProviderId] = React.useState(defaultProvider);
  const [webSearchEnabled, setWebSearchEnabled] = React.useState(false);
  const [reasoningEnabled, setReasoningEnabled] = React.useState(false);
  const [activeMcpCount, setActiveMcpCount] = React.useState(0);

  const {
    sessionId,
    activeBranchMessages,
    isGenerating,
    sendMessage,
    editMessage,
    regenerateMessage,
    stopGeneration,
    getBranchInfo,
    switchBranch,
  } = useChatSession({
    initialSessionId,
    initialMessages,
  });

  // Query active MCP tool count
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

  const handleComposerSubmit = async (payload: ComposerSubmitPayload) => {
    // If starting a fresh chat on root page, update the browser URL smoothly to /c/[id]
    if (!initialSessionId && window.location.pathname === "/") {
      window.history.pushState(null, "", `/c/${sessionId}`);
    }

    await sendMessage({
      prompt: payload.prompt,
      attachments: payload.attachments,
      modelId: payload.modelId || modelId,
      providerId: payload.providerId || providerId,
      webSearchEnabled: payload.webSearchEnabled,
      searchEngine: payload.searchEngine || activeSearchProvider,
      reasoningEnabled: payload.reasoningEnabled,
    });
  };

  const handleNewChat = () => {
    router.push("/");
  };

  const isEmpty = activeBranchMessages.length === 0;

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-50 dark:bg-[#212121] text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      {/* Top Header */}
      <header className="flex h-14 shrink-0 items-center justify-between px-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-semibold hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80 transition-colors"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span>OpenChat</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNewChat}
            aria-label="New chat"
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New chat</span>
          </button>
        </div>
      </header>

      {/* Main Chat Workspace */}
      <main className="relative flex flex-col flex-1 h-[calc(100vh-3.5rem)] overflow-hidden">
        {isEmpty ? (
          /* Empty / Welcome State */
          <div className="flex flex-col flex-1 items-center justify-center px-4 pb-28 text-center max-w-3xl mx-auto w-full">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xl mb-6">
              <Sparkles className="h-7 w-7" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-zinc-100">
              How can I help you today?
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-md leading-relaxed">
              Open-source, self-hosted chat with web search, Model Context Protocol (MCP), and reasoning models.
            </p>

            {/* Quick Starters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl text-left">
              {STARTER_PROMPTS.map((starter) => {
                const StarterIcon = starter.icon;
                return (
                  <button
                    key={starter.title}
                    type="button"
                    onClick={() => {
                      handleComposerSubmit({
                        prompt: starter.prompt,
                        attachments: [],
                        modelId,
                        providerId,
                        webSearchEnabled,
                        searchEngine: activeSearchProvider,
                        reasoningEnabled,
                      });
                    }}
                    className={cn(
                      "flex flex-col p-3 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90",
                      "bg-white/80 dark:bg-zinc-900/60 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/80 shadow-xs",
                      "text-xs transition-all duration-200 cursor-pointer text-left"
                    )}
                  >
                    <div className="flex items-center gap-2 font-medium text-zinc-800 dark:text-zinc-200 mb-1">
                      <StarterIcon className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{starter.title}</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {starter.prompt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Message Stream Feed */
          <ChatContainer isStreaming={isGenerating}>
            <MessageList
              messages={activeBranchMessages}
              getBranchInfo={getBranchInfo}
              onSwitchBranch={switchBranch}
              onEdit={(msgId, newText) =>
                editMessage(msgId, newText, {
                  modelId,
                  providerId,
                  webSearchEnabled,
                  reasoningEnabled,
                })
              }
              onRegenerate={(msgId) =>
                regenerateMessage(msgId, {
                  modelId,
                  providerId,
                  webSearchEnabled,
                  reasoningEnabled,
                })
              }
              isStreaming={isGenerating}
            />
          </ChatContainer>
        )}

        {/* Floating Bottom Composer Dock */}
        <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none p-4 pb-6 bg-gradient-to-t from-zinc-50 via-zinc-50/90 to-transparent dark:from-[#212121] dark:via-[#212121]/90 dark:to-transparent">
          <div className="pointer-events-auto max-w-3xl mx-auto w-full">
            <Composer
              selectedModelId={modelId}
              selectedProviderId={providerId}
              onModelChange={(newModel, newProvider) => {
                setModelId(newModel);
                setProviderId(newProvider);
              }}
              onSubmit={handleComposerSubmit}
              onStop={stopGeneration}
              isGenerating={isGenerating}
              webSearchEnabled={webSearchEnabled}
              onWebSearchToggle={setWebSearchEnabled}
              activeSearchEngine={activeSearchProvider}
              reasoningEnabled={reasoningEnabled}
              onReasoningToggle={setReasoningEnabled}
              activeMcpToolCount={activeMcpCount}
              placeholder="Message OpenChat..."
            />
          </div>
        </div>
      </main>
    </div>
  );
}
