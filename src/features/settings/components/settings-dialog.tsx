"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/lib/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/lib/ui/tabs";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import { Textarea } from "@/lib/ui/textarea";
import {
  Settings,
  Sliders,
  Cpu,
  Globe,
  Server,
  Database,
  Sun,
  Moon,
  Laptop,
  Check,
  Loader2,
  Trash2,
  Download,
  Eye,
  EyeOff,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OpenChatSettings } from "../config-file";

export interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
  onSettingsSaved?: (settings: OpenChatSettings) => void;
  onOpenMcpFull?: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  defaultTab = "general",
  onSettingsSaved,
  onOpenMcpFull,
}: SettingsDialogProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab);
  const [settings, setSettings] = React.useState<OpenChatSettings | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [showKeys, setShowKeys] = React.useState<Record<string, boolean>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [isClearing, setIsClearing] = React.useState(false);
  const [clearMessage, setClearMessage] = React.useState<string | null>(null);

  // MCP Servers local list
  const [mcpServers, setMcpServers] = React.useState<any[]>([]);

  // Load settings whenever dialog opens
  React.useEffect(() => {
    if (open) {
      setIsLoading(true);
      fetch("/api/settings")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.settings) {
            setSettings(data.settings);
          }
        })
        .catch((err) => console.error("Failed to load settings:", err))
        .finally(() => setIsLoading(false));

      // Query MCP
      fetch("/api/mcp")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.servers) {
            setMcpServers(data.servers);
          }
        })
        .catch(() => {});
    }
  }, [open]);

  React.useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        onSettingsSaved?.(data.settings);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    window.location.href = "/api/settings/export";
  };

  const handleClearData = async (clearProjects = false) => {
    setIsClearing(true);
    setClearMessage(null);
    try {
      const res = await fetch("/api/settings/clear-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearProjects }),
      });
      if (res.ok) {
        setClearMessage("All chat history successfully cleared.");
        setDeleteConfirmOpen(false);
        window.dispatchEvent(new CustomEvent("openchat-refresh-sidebar"));
      } else {
        setClearMessage("Failed to clear chat data.");
      }
    } catch (err) {
      setClearMessage("Error clearing chat data.");
    } finally {
      setIsClearing(false);
    }
  };

  if (!settings && isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl bg-zinc-900 border-zinc-800 text-zinc-100 p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </DialogContent>
      </Dialog>
    );
  }

  if (!settings) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 px-6 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-zinc-400" />
            <DialogTitle className="text-base font-semibold text-zinc-100">
              Settings
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-400">
            Customize models, providers, web search, MCP servers, and data preferences.
          </DialogDescription>
        </DialogHeader>

        {/* Tabbed Navigation */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="px-6 border-b border-zinc-800/80 bg-zinc-950/40">
            <TabsList className="bg-transparent p-0 gap-2 h-11 border-none justify-start">
              <TabsTrigger
                value="general"
                className="gap-2 text-xs py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 rounded-lg text-zinc-400"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>General</span>
              </TabsTrigger>
              <TabsTrigger
                value="providers"
                className="gap-2 text-xs py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 rounded-lg text-zinc-400"
              >
                <Cpu className="h-3.5 w-3.5" />
                <span>Providers</span>
              </TabsTrigger>
              <TabsTrigger
                value="search"
                className="gap-2 text-xs py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 rounded-lg text-zinc-400"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Web Search</span>
              </TabsTrigger>
              <TabsTrigger
                value="mcp"
                className="gap-2 text-xs py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 rounded-lg text-zinc-400"
              >
                <Server className="h-3.5 w-3.5" />
                <span>MCP Servers</span>
              </TabsTrigger>
              <TabsTrigger
                value="data"
                className="gap-2 text-xs py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 rounded-lg text-zinc-400"
              >
                <Database className="h-3.5 w-3.5" />
                <span>Data Controls</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Scrollable Tab Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TAB 1: GENERAL */}
            <TabsContent value="general" className="m-0 space-y-5">
              {/* Theme Switcher */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-200">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "dark", label: "Dark", icon: Moon },
                      { id: "light", label: "Light", icon: Sun },
                      { id: "system", label: "System", icon: Laptop },
                    ] as const
                  ).map((themeOption) => {
                    const Icon = themeOption.icon;
                    const isSelected = settings.theme === themeOption.id;
                    return (
                      <button
                        key={themeOption.id}
                        type="button"
                        onClick={() => {
                          setSettings({ ...settings, theme: themeOption.id });
                          if (themeOption.id === "dark") {
                            document.documentElement.classList.add("dark");
                          } else if (themeOption.id === "light") {
                            document.documentElement.classList.remove("dark");
                          }
                        }}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all",
                          isSelected
                            ? "border-zinc-500 bg-zinc-800 text-zinc-100 shadow-xs"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{themeOption.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Model */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-200">
                  Default Model
                </label>
                <Input
                  value={settings.defaultModel}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultModel: e.target.value })
                  }
                  placeholder="e.g. gpt-4o, claude-3-5-sonnet-latest, gemini-2.0-flash"
                  className="bg-zinc-800/80 border-zinc-700 text-zinc-100 text-xs"
                />
                <p className="text-[11px] text-zinc-500">
                  Fallback model when starting fresh chats.
                </p>
              </div>

              {/* Default Provider */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-200">
                  Default Provider
                </label>
                <select
                  value={settings.defaultProvider}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultProvider: e.target.value })
                  }
                  className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google Gemini</option>
                  <option value="groq">Groq</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="mistral">Mistral</option>
                  <option value="ollama">Ollama</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="custom">Custom (OpenAI-compatible)</option>
                </select>
              </div>

              {/* Global System Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-200">
                  Global System Instructions
                </label>
                <Textarea
                  value={settings.systemPrompt || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, systemPrompt: e.target.value })
                  }
                  placeholder="Custom instructions applied across all your chats (e.g. 'Always respond concisely with code examples', 'Prefer TypeScript')."
                  rows={4}
                  className="bg-zinc-800/80 border-zinc-700 text-zinc-100 text-xs placeholder:text-zinc-500"
                />
              </div>
            </TabsContent>

            {/* TAB 2: PROVIDERS */}
            <TabsContent value="providers" className="m-0 space-y-4">
              <p className="text-xs text-zinc-400 mb-2">
                Configure your API keys and custom endpoints. Keys are stored locally in <code className="text-zinc-300">~/.openchat/settings.json</code>.
              </p>

              {(
                [
                  { id: "openai", name: "OpenAI", env: "OPENAI_API_KEY", noKey: false },
                  { id: "anthropic", name: "Anthropic", env: "ANTHROPIC_API_KEY", noKey: false },
                  { id: "google", name: "Google Gemini", env: "GEMINI_API_KEY", noKey: false },
                  { id: "groq", name: "Groq", env: "GROQ_API_KEY", noKey: false },
                  { id: "deepseek", name: "DeepSeek", env: "DEEPSEEK_API_KEY", noKey: false },
                  { id: "mistral", name: "Mistral", env: "MISTRAL_API_KEY", noKey: false },
                  { id: "ollama", name: "Ollama (Local)", env: "OLLAMA_BASE_URL", noKey: true },
                  { id: "openrouter", name: "OpenRouter", env: "OPENROUTER_API_KEY", noKey: false },
                  { id: "custom", name: "Custom Endpoint", env: "CUSTOM_API_KEY", noKey: false },
                ] as const
              ).map((prov) => {
                const provConfig = (settings.providers as any)[prov.id] || {
                  enabled: false,
                  apiKey: "",
                  baseURL: "",
                  models: [],
                };
                const isKeyVisible = showKeys[prov.id];

                return (
                  <div
                    key={prov.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3.5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-200">
                          {prov.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          ({prov.env})
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={provConfig.enabled}
                          onChange={(e) => {
                            const newProviders = { ...settings.providers };
                            (newProviders as any)[prov.id] = {
                              ...provConfig,
                              enabled: e.target.checked,
                            };
                            setSettings({ ...settings, providers: newProviders });
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {!prov.noKey && (
                        <div className="space-y-1">
                          <label className="text-[11px] text-zinc-400">
                            API Key
                          </label>
                          <div className="relative flex items-center">
                            <Input
                              type={isKeyVisible ? "text" : "password"}
                              value={provConfig.apiKey || ""}
                              onChange={(e) => {
                                const newProviders = { ...settings.providers };
                                (newProviders as any)[prov.id] = {
                                  ...provConfig,
                                  apiKey: e.target.value,
                                  enabled: e.target.value.length > 0 ? true : provConfig.enabled,
                                };
                                setSettings({ ...settings, providers: newProviders });
                              }}
                              placeholder={`sk-... or env ${prov.env}`}
                              className="bg-zinc-900 border-zinc-800 text-xs pr-8"
                            />
                            <button
                              type="button"
                              onClick={() => toggleShowKey(prov.id)}
                              className="absolute right-2 text-zinc-500 hover:text-zinc-300"
                            >
                              {isKeyVisible ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[11px] text-zinc-400">
                          Custom Base URL
                        </label>
                        <Input
                          type="text"
                          value={provConfig.baseURL || ""}
                          onChange={(e) => {
                            const newProviders = { ...settings.providers };
                            (newProviders as any)[prov.id] = {
                              ...provConfig,
                              baseURL: e.target.value,
                            };
                            setSettings({ ...settings, providers: newProviders });
                          }}
                          placeholder={
                            prov.id === "ollama"
                              ? "http://localhost:11434"
                              : "https://api.openai.com/v1"
                          }
                          className="bg-zinc-900 border-zinc-800 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            {/* TAB 3: WEB SEARCH */}
            <TabsContent value="search" className="m-0 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-200">
                  Active Web Search Engine
                </label>
                <select
                  value={settings.activeSearchProvider}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      activeSearchProvider: e.target.value as any,
                    })
                  }
                  className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                >
                  <option value="duckduckgo">DuckDuckGo (Free, Zero-key required)</option>
                  <option value="tavily">Tavily AI Search (Recommended for LLMs)</option>
                  <option value="brave">Brave Search</option>
                  <option value="serper">Serper (Google Search API)</option>
                  <option value="exa">Exa Neural Search</option>
                  <option value="searxng">SearXNG (Self-Hosted Privacy Search)</option>
                </select>
                <p className="text-[11px] text-zinc-500">
                  DuckDuckGo requires no API keys and works out-of-the-box.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-xs font-medium text-zinc-300">
                  Search Engine Credentials
                </div>

                {(
                  [
                    { id: "tavily", name: "Tavily API Key", env: "TAVILY_API_KEY" },
                    { id: "brave", name: "Brave Search API Key", env: "BRAVE_API_KEY" },
                    { id: "serper", name: "Serper API Key", env: "SERPER_API_KEY" },
                    { id: "exa", name: "Exa API Key", env: "EXA_API_KEY" },
                  ] as const
                ).map((sProv) => {
                  const pConfig = (settings.searchProviders as any)[sProv.id] || {
                    apiKey: "",
                  };
                  return (
                    <div key={sProv.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">{sProv.name}</span>
                        <span className="text-zinc-500 font-mono text-[10px]">
                          {sProv.env}
                        </span>
                      </div>
                      <Input
                        type="password"
                        value={pConfig.apiKey || ""}
                        onChange={(e) => {
                          const newSearch = { ...settings.searchProviders };
                          (newSearch as any)[sProv.id] = {
                            ...pConfig,
                            apiKey: e.target.value,
                            enabled: e.target.value.length > 0,
                          };
                          setSettings({ ...settings, searchProviders: newSearch });
                        }}
                        placeholder="Enter API key..."
                        className="bg-zinc-800/80 border-zinc-700 text-xs"
                      />
                    </div>
                  );
                })}

                {/* SearXNG Base URL */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">SearXNG Base URL</span>
                    <span className="text-zinc-500 font-mono text-[10px]">
                      SEARXNG_BASE_URL
                    </span>
                  </div>
                  <Input
                    type="text"
                    value={settings.searchProviders.searxng.baseURL || ""}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        searchProviders: {
                          ...settings.searchProviders,
                          searxng: {
                            ...settings.searchProviders.searxng,
                            baseURL: e.target.value,
                          },
                        },
                      });
                    }}
                    placeholder="http://localhost:8080"
                    className="bg-zinc-800/80 border-zinc-700 text-xs"
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: MCP SERVERS */}
            <TabsContent value="mcp" className="m-0 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200">
                    Model Context Protocol (MCP)
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Connect STDIO child processes or remote SSE tool servers.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenMcpFull?.();
                  }}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Configure MCP Servers</span>
                </Button>
              </div>

              {/* MCP Servers List */}
              <div className="space-y-2 pt-2">
                {mcpServers.length === 0 ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 text-center text-xs text-zinc-500">
                    No MCP servers configured yet. Click above to add STDIO or SSE servers.
                  </div>
                ) : (
                  mcpServers.map((srv) => (
                    <div
                      key={srv.name}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
                          <Server className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="font-medium text-zinc-200">{srv.name}</div>
                          <div className="text-[10px] text-zinc-500">
                            Transport: {srv.transport}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            srv.enabled
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/80"
                              : "bg-zinc-800 text-zinc-500"
                          )}
                        >
                          {srv.enabled ? "Active" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* TAB 5: DATA CONTROLS */}
            <TabsContent value="data" className="m-0 space-y-4">
              <p className="text-xs text-zinc-400">
                Manage your conversation history and local SQLite database (<code className="text-zinc-300">~/.openchat/openchat.db</code>).
              </p>

              {clearMessage && (
                <div className="rounded-lg bg-emerald-950/40 border border-emerald-800/80 p-3 text-xs text-emerald-300">
                  {clearMessage}
                </div>
              )}

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">
                      Export Chat History
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Download all chats, messages, and projects as a single JSON backup.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleExportData}
                    className="gap-2 text-xs border-zinc-700 hover:bg-zinc-800 text-zinc-200"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export JSON</span>
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-red-950/40 bg-red-950/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-red-300">
                      Clear Chat History
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Permanently wipe all conversation sessions and messages from SQLite.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="gap-2 text-xs bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete All Chats</span>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-zinc-800 p-4 px-6 bg-zinc-950/60 shrink-0">
          <div>
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <Check className="h-3.5 w-3.5" />
                Settings saved!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-zinc-100 text-zinc-900 hover:bg-white text-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Delete All Chats Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Clear all conversation history?</DialogTitle>
            </div>
            <DialogDescription className="text-zinc-400 pt-2">
              This action cannot be undone. All your chat sessions and messages will be permanently deleted from local SQLite.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => handleClearData(false)}
              disabled={isClearing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isClearing ? "Clearing..." : "Yes, Delete All"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
