"use client";

import * as React from "react";
import {
  Sparkles,
  Database,
  Settings as SettingsIcon,
  Search,
  Bot,
  ChevronDown,
  CheckCircle2,
  Plus,
  Terminal,
  Layers,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/lib/ui";

interface StarterViewProps {
  defaultModel: string;
  activeSearchProvider: string;
  configuredProviders: string[];
  sessionCount: number;
  dbStatus: string;
  theme: string;
}

export function StarterView({
  defaultModel,
  activeSearchProvider,
  configuredProviders,
  sessionCount,
  dbStatus,
  theme,
}: StarterViewProps) {
  const [selectedModel, setSelectedModel] = React.useState(defaultModel);
  const [promptText, setPromptText] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 selection:bg-zinc-800">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white text-zinc-950 flex items-center justify-center font-bold text-sm shadow-sm">
              <Sparkles className="h-4 w-4 text-zinc-950" />
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-white">
                OpenChat
              </span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                v0.1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="pill" size="sm" className="gap-1.5 font-medium">
                  <Bot className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{selectedModel}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setSelectedModel("gpt-4o")}>
                  gpt-4o
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedModel("claude-3-7-sonnet-latest")}>
                  claude-3-7-sonnet-latest
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedModel("gemini-2.0-flash")}>
                  gemini-2.0-flash
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedModel("llama-3.3-70b-versatile")}>
                  llama-3.3-70b-versatile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedModel("deepseek-chat")}>
                  deepseek-chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Diagnostics Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <SettingsIcon className="h-4 w-4 text-zinc-400" />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>System Diagnostics</TooltipContent>
              </Tooltip>

              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    System Architecture Status
                  </DialogTitle>
                  <DialogDescription>
                    Ticket 1 Foundation verification for OpenChat
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-zinc-800">
                    <span className="text-zinc-400">Database Engine:</span>
                    <span className="font-mono text-zinc-200">SQLite (WAL mode)</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-800">
                    <span className="text-zinc-400">Database Status:</span>
                    <span className="font-mono text-emerald-400">{dbStatus}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-800">
                    <span className="text-zinc-400">Storage Root:</span>
                    <span className="font-mono text-zinc-200">~/.openchat</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-800">
                    <span className="text-zinc-400">Config File:</span>
                    <span className="font-mono text-zinc-200">settings.json</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-800">
                    <span className="text-zinc-400">Web Search Engine:</span>
                    <span className="font-mono text-zinc-200">{activeSearchProvider}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-400">Total TypeScript:</span>
                    <span className="font-mono text-emerald-400">Strict Mode</span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Hero & Verification workspace */}
        <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-3">
              What can I help you with today?
            </h1>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              OpenChat is running with Next.js 15, Vercel AI SDK, and hybrid storage (`~/.openchat`).
            </p>
          </div>

          {/* Assistant UI Style Composer Staging Area */}
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-3 shadow-xl mb-10 transition-all focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700">
            <Textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Ask anything..."
              className="border-0 bg-transparent p-1 text-base placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[70px] shadow-none resize-none"
            />
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
              <div className="flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attach files</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                      <Search className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Web Search ({activeSearchProvider})</TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-mono">{selectedModel}</span>
                <Button
                  size="sm"
                  disabled={!promptText.trim()}
                  className="h-8 rounded-lg px-3 text-xs"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>

          {/* Subsystem status tabs */}
          <div className="w-full max-w-2xl">
            <Tabs defaultValue="architecture" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-zinc-900 border border-zinc-800">
                <TabsTrigger value="architecture" className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Architecture</span>
                </TabsTrigger>
                <TabsTrigger value="storage" className="flex items-center gap-2">
                  <Database className="h-3.5 w-3.5" />
                  <span>Storage & DB</span>
                </TabsTrigger>
                <TabsTrigger value="cli" className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>CLI & Config</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="architecture"
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 mt-3"
              >
                <h3 className="font-semibold text-sm text-zinc-200 mb-2">
                  Vertical Slice Architecture (VSA)
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Ticket 1 foundation has established strict typing, atomic UI primitives,
                  clean directory seams, Drizzle ORM SQLite schemas, and cross-platform home directory
                  storage. Next tickets will plug directly into `features/providers`, `features/web-search`,
                  and `features/mcp`.
                </p>
              </TabsContent>

              <TabsContent
                value="storage"
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 mt-3"
              >
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Database Status:</span>
                    <span className="text-emerald-400 font-medium">{dbStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Existing Sessions:</span>
                    <span className="text-zinc-200 font-mono">{sessionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">SQLite Tables:</span>
                    <span className="text-zinc-200 font-mono">
                      sessions, messages, projects, project_files
                    </span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="cli"
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 mt-3"
              >
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">CLI Binary:</span>
                    <span className="text-zinc-200 font-mono">bin/openchat.js</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Config Path:</span>
                    <span className="text-zinc-200 font-mono">~/.openchat/settings.json</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Active Providers:</span>
                    <span className="text-zinc-200 font-mono">
                      {configuredProviders.length > 0
                        ? configuredProviders.join(", ")
                        : "openai (default)"}
                    </span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
