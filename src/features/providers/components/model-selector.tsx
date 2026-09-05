"use client";

import * as React from "react";
import {
  Bot,
  Sparkles,
  Cpu,
  Zap,
  Eye,
  Brain,
  Check,
  ChevronDown,
  Search,
  Plus,
  Compass,
  Terminal,
  Globe,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import type { ModelDescriptor, ProviderId } from "../types";
import {
  OPENAI_MODELS,
  ANTHROPIC_MODELS,
  GOOGLE_MODELS,
  GROQ_MODELS,
  DEEPSEEK_MODELS,
  OLLAMA_DEFAULT_MODELS,
  OPENROUTER_MODELS,
} from "../adapters";

export interface ModelSelectorProps {
  currentModelId: string;
  currentProviderId?: ProviderId;
  onSelectModel: (modelId: string, providerId: ProviderId) => void;
  availableModels?: ModelDescriptor[];
  className?: string;
  disabled?: boolean;
}

const DEFAULT_ALL_MODELS: ModelDescriptor[] = [
  ...OPENAI_MODELS,
  ...ANTHROPIC_MODELS,
  ...GOOGLE_MODELS,
  ...GROQ_MODELS,
  ...DEEPSEEK_MODELS,
  ...OLLAMA_DEFAULT_MODELS,
  ...OPENROUTER_MODELS,
];

const PROVIDER_METADATA: Record<
  ProviderId,
  {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
  }
> = {
  openai: {
    name: "OpenAI",
    icon: Bot,
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  anthropic: {
    name: "Anthropic",
    icon: Sparkles,
    badgeClass:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  google: {
    name: "Google Gemini",
    icon: Cpu,
    badgeClass:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  groq: {
    name: "Groq",
    icon: Zap,
    badgeClass:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  deepseek: {
    name: "DeepSeek",
    icon: Compass,
    badgeClass:
      "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  },
  ollama: {
    name: "Ollama",
    icon: Terminal,
    badgeClass:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  openrouter: {
    name: "OpenRouter",
    icon: Globe,
    badgeClass:
      "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  },
  custom: {
    name: "Custom (OpenAI-compatible)",
    icon: Wrench,
    badgeClass:
      "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  },
};

function isFastModel(modelId: string): boolean {
  const lower = modelId.toLowerCase();
  return (
    lower.includes("mini") ||
    lower.includes("flash") ||
    lower.includes("haiku") ||
    lower.includes("instant") ||
    lower.includes("8b")
  );
}

export function ModelSelector({
  currentModelId,
  currentProviderId,
  onSelectModel,
  availableModels: propModels,
  className,
  disabled = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [models, setModels] = React.useState<ModelDescriptor[]>(
    propModels && propModels.length > 0 ? propModels : DEFAULT_ALL_MODELS
  );

  // Custom model state
  const [isCustomOpen, setIsCustomOpen] = React.useState(false);
  const [customModelId, setCustomModelId] = React.useState("");
  const [customProvider, setCustomProvider] = React.useState<ProviderId>(
    currentProviderId || "openai"
  );

  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch available models from /api/models on mount if not provided as props
  React.useEffect(() => {
    if (propModels && propModels.length > 0) {
      setModels(propModels);
      return;
    }

    let isMounted = true;
    fetch("/api/models")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch models");
      })
      .then((data) => {
        if (isMounted && data?.models && Array.isArray(data.models)) {
          setModels(data.models);
        }
      })
      .catch((err) => {
        // Fall back gracefully to default models
        console.warn("Could not load dynamic models from /api/models:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [propModels]);

  // Click outside to close dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsCustomOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
      setIsCustomOpen(false);
    }
  }, [isOpen]);

  // Find currently active model descriptor
  const activeModel = React.useMemo(() => {
    return (
      models.find(
        (m) =>
          m.id === currentModelId &&
          (!currentProviderId || m.providerId === currentProviderId)
      ) ||
      models.find((m) => m.id === currentModelId) || {
        id: currentModelId,
        name: currentModelId,
        providerId: currentProviderId || "openai",
      }
    );
  }, [models, currentModelId, currentProviderId]);

  const activeProviderMeta =
    PROVIDER_METADATA[activeModel.providerId as ProviderId] ||
    PROVIDER_METADATA.openai;
  const ActiveIcon = activeProviderMeta.icon;

  // Filter models based on search query
  const filteredModels = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return models;

    return models.filter((m) => {
      return (
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.providerId.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
      );
    });
  }, [models, searchQuery]);

  // Group models by provider
  const groupedModels = React.useMemo(() => {
    const groups: Record<ProviderId, ModelDescriptor[]> = {
      openai: [],
      anthropic: [],
      google: [],
      groq: [],
      deepseek: [],
      ollama: [],
      openrouter: [],
      custom: [],
    };

    for (const model of filteredModels) {
      const p = model.providerId as ProviderId;
      if (groups[p]) {
        groups[p].push(model);
      } else {
        if (!groups.custom) groups.custom = [];
        groups.custom.push(model);
      }
    }

    return groups;
  }, [filteredModels]);

  const handleSelect = (modelId: string, providerId: ProviderId) => {
    onSelectModel(modelId, providerId);
    setIsOpen(false);
    setIsCustomOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customModelId.trim();
    if (!trimmed) return;
    handleSelect(trimmed, customProvider);
    setCustomModelId("");
  };

  return (
    <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
      {/* ChatGPT-style Pill Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "group inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800",
          "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200",
          "shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="flex items-center justify-center h-4 w-4 rounded-full">
          <ActiveIcon className="h-3.5 w-3.5" />
        </span>
        <span className="max-w-[160px] truncate font-semibold">
          {activeModel.name || activeModel.id}
        </span>
        {activeModel.supportsReasoning && (
          <span className="flex items-center text-purple-600 dark:text-purple-400" title="Reasoning model">
            <Brain className="h-3 w-3" />
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-zinc-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu Modal / Popover */}
      {isOpen && (
        <div
          className={cn(
            "absolute left-0 top-full z-50 mt-2 w-84 sm:w-96 rounded-2xl border border-zinc-200 dark:border-zinc-800",
            "bg-white dark:bg-zinc-950 p-2 text-zinc-900 dark:text-zinc-100 shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95"
          )}
        >
          {/* Search Header */}
          <div className="relative mb-2 px-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Search models..."
              className={cn(
                "h-9 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 pl-8.5 pr-8 text-xs",
                "text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              )}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Grouped Model List */}
          <div className="max-h-[340px] overflow-y-auto space-y-3 px-1 py-1 scrollbar-thin">
            {filteredModels.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">
                No matching models found.
                <br />
                Use the custom model input below.
              </div>
            ) : (
              (Object.keys(groupedModels) as ProviderId[]).map((providerId) => {
                const group = groupedModels[providerId];
                if (!group || group.length === 0) return null;

                const meta = PROVIDER_METADATA[providerId] || PROVIDER_METADATA.custom;
                const ProviderIcon = meta.icon;

                return (
                  <div key={providerId} className="space-y-1">
                    {/* Provider Group Header */}
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      <ProviderIcon className="h-3 w-3" />
                      <span>{meta.name}</span>
                      <span className="ml-auto text-[10px] font-normal text-zinc-400">
                        {group.length}
                      </span>
                    </div>

                    {/* Model Items */}
                    <div className="space-y-0.5">
                      {group.map((model) => {
                        const isSelected =
                          model.id === currentModelId &&
                          (!currentProviderId || model.providerId === currentProviderId);
                        const fast = isFastModel(model.id);

                        return (
                          <button
                            key={`${model.providerId}-${model.id}`}
                            type="button"
                            onClick={() => handleSelect(model.id, model.providerId)}
                            className={cn(
                              "w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors cursor-pointer",
                              "hover:bg-zinc-100 dark:hover:bg-zinc-800/60",
                              isSelected
                                ? "bg-zinc-100 dark:bg-zinc-800/80 font-medium"
                                : "text-zinc-700 dark:text-zinc-300"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <span className="w-4 flex items-center justify-center shrink-0">
                                {isSelected ? (
                                  <Check className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
                                ) : (
                                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                )}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate text-xs text-zinc-900 dark:text-zinc-100">
                                  {model.name}
                                </div>
                                {model.id !== model.name && (
                                  <div className="truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                                    {model.id}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Capability Tags */}
                            <div className="flex items-center gap-1 shrink-0">
                              {model.supportsReasoning && (
                                <span className="inline-flex items-center gap-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 text-[10px] font-medium text-purple-600 dark:text-purple-400">
                                  <Brain className="h-2.5 w-2.5" />
                                  Reasoning
                                </span>
                              )}
                              {fast && (
                                <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                  <Zap className="h-2.5 w-2.5" />
                                  Fast
                                </span>
                              )}
                              {model.supportsVision && (
                                <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                  <Eye className="h-2.5 w-2.5" />
                                  Vision
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Custom Model Input Section */}
          <div className="mt-2 border-t border-zinc-200 dark:border-zinc-800 pt-2 px-1">
            {!isCustomOpen ? (
              <button
                type="button"
                onClick={() => setIsCustomOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Enter arbitrary custom model ID...</span>
              </button>
            ) : (
              <form onSubmit={handleCustomSubmit} className="space-y-2 py-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  <span>Custom Model</span>
                  <button
                    type="button"
                    onClick={() => setIsCustomOpen(false)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex gap-1.5">
                  <select
                    value={customProvider}
                    onChange={(e) => setCustomProvider(e.target.value as ProviderId)}
                    className="h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google</option>
                    <option value="groq">Groq</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="ollama">Ollama</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="custom">Custom</option>
                  </select>

                  <Input
                    type="text"
                    value={customModelId}
                    onChange={(e) => setCustomModelId(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="e.g. gpt-4o-custom, meta-llama/..."
                    className="h-8 text-xs"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCustomOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!customModelId.trim()}
                  >
                    Use Model
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
