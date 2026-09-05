import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { SETTINGS_FILE, ensureOpenChatDirs } from "@/lib/paths";

export const ProviderConfigSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  enabled: z.boolean().default(false),
  models: z.array(z.string()).default([]),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

export const SearchProviderConfigSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  enabled: z.boolean().default(false),
});

export type SearchProviderConfig = z.infer<typeof SearchProviderConfigSchema>;

export const McpServerConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  transport: z.enum(["stdio", "sse"]).default("stdio"),
  type: z.enum(["stdio", "sse"]).optional(),
  command: z.string().optional(),
  args: z.array(z.string()).default([]),
  env: z.record(z.string(), z.string()).default({}),
  url: z.string().optional(),
  enabled: z.boolean().default(true),
});

export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;

export const DEFAULT_PROVIDERS = {
  openai: {
    apiKey: undefined,
    baseURL: undefined,
    enabled: true,
    models: ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini"],
  },
  anthropic: {
    apiKey: undefined,
    baseURL: undefined,
    enabled: false,
    models: [
      "claude-3-7-sonnet-latest",
      "claude-3-5-sonnet-latest",
      "claude-3-5-haiku-latest",
    ],
  },
  google: {
    apiKey: undefined,
    baseURL: undefined,
    enabled: false,
    models: ["gemini-2.0-flash", "gemini-2.0-pro-exp-02-05", "gemini-1.5-pro"],
  },
  groq: {
    apiKey: undefined,
    baseURL: undefined,
    enabled: false,
    models: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "deepseek-r1-distill-llama-70b",
    ],
  },
  deepseek: {
    apiKey: undefined,
    baseURL: "https://api.deepseek.com",
    enabled: false,
    models: ["deepseek-chat", "deepseek-reasoner"],
  },
  mistral: {
    apiKey: undefined,
    baseURL: "https://api.mistral.ai/v1",
    enabled: false,
    models: ["mistral-large-latest", "mistral-small-latest", "codestral-latest"],
  },
  ollama: {
    apiKey: undefined,
    baseURL: "http://localhost:11434",
    enabled: false,
    models: ["llama3.2", "deepseek-r1:latest", "mistral"],
  },
  openrouter: {
    apiKey: undefined,
    baseURL: "https://openrouter.ai/api/v1",
    enabled: false,
    models: ["openai/gpt-4o", "anthropic/claude-3.5-sonnet"],
  },
  custom: {
    apiKey: undefined,
    baseURL: "http://localhost:8000/v1",
    enabled: false,
    models: [] as string[],
  },
};

export const DEFAULT_SEARCH_PROVIDERS = {
  duckduckgo: {
    apiKey: undefined,
    baseURL: undefined,
    enabled: true,
  },
  tavily: {
    apiKey: undefined,
    baseURL: undefined,
    enabled: false,
  },
  brave: {
    apiKey: undefined,
    baseURL: undefined,
    enabled: false,
  },
  serper: {
    apiKey: undefined,
    baseURL: undefined,
    enabled: false,
  },
  exa: {
    apiKey: undefined,
    baseURL: undefined,
    enabled: false,
  },
  searxng: {
    apiKey: undefined,
    baseURL: "http://localhost:8080",
    enabled: false,
  },
};

export const OpenChatSettingsSchema = z.object({
  version: z.number().default(1),
  theme: z.enum(["system", "light", "dark"]).default("system"),
  defaultModel: z.string().default("gpt-4o"),
  defaultProvider: z.string().default("openai"),
  activeSearchProvider: z
    .enum(["duckduckgo", "tavily", "brave", "serper", "exa", "searxng"])
    .default("duckduckgo"),
  providers: z
    .object({
      openai: ProviderConfigSchema.default(DEFAULT_PROVIDERS.openai),
      anthropic: ProviderConfigSchema.default(DEFAULT_PROVIDERS.anthropic),
      google: ProviderConfigSchema.default(DEFAULT_PROVIDERS.google),
      groq: ProviderConfigSchema.default(DEFAULT_PROVIDERS.groq),
      deepseek: ProviderConfigSchema.default(DEFAULT_PROVIDERS.deepseek),
      mistral: ProviderConfigSchema.default(DEFAULT_PROVIDERS.mistral),
      ollama: ProviderConfigSchema.default(DEFAULT_PROVIDERS.ollama),
      openrouter: ProviderConfigSchema.default(DEFAULT_PROVIDERS.openrouter),
      custom: ProviderConfigSchema.default(DEFAULT_PROVIDERS.custom),
    })
    .default(DEFAULT_PROVIDERS),
  searchProviders: z
    .object({
      duckduckgo: SearchProviderConfigSchema.default(DEFAULT_SEARCH_PROVIDERS.duckduckgo),
      tavily: SearchProviderConfigSchema.default(DEFAULT_SEARCH_PROVIDERS.tavily),
      brave: SearchProviderConfigSchema.default(DEFAULT_SEARCH_PROVIDERS.brave),
      serper: SearchProviderConfigSchema.default(DEFAULT_SEARCH_PROVIDERS.serper),
      exa: SearchProviderConfigSchema.default(DEFAULT_SEARCH_PROVIDERS.exa),
      searxng: SearchProviderConfigSchema.default(DEFAULT_SEARCH_PROVIDERS.searxng),
    })
    .default(DEFAULT_SEARCH_PROVIDERS),
  mcpServers: z.record(z.string(), McpServerConfigSchema).default({}),
});

export type OpenChatSettings = z.infer<typeof OpenChatSettingsSchema>;

/**
 * Returns default OpenChat settings
 */
export function getDefaultSettings(): OpenChatSettings {
  const defaults = OpenChatSettingsSchema.parse({});
  if (process.env["OPENCHAT_DEFAULT_MODEL"]) {
    defaults.defaultModel = process.env["OPENCHAT_DEFAULT_MODEL"];
  }
  return defaults;
}

/**
 * Merges environment variables as fallback defaults into the settings object.
 */
export function mergeEnvironmentDefaults(settings: OpenChatSettings): OpenChatSettings {
  const merged: OpenChatSettings = structuredClone(settings);

  // OpenAI
  if (!merged.providers.openai.apiKey && process.env["OPENAI_API_KEY"]) {
    merged.providers.openai.apiKey = process.env["OPENAI_API_KEY"];
    merged.providers.openai.enabled = true;
  }
  if (!merged.providers.openai.baseURL && process.env["OPENAI_BASE_URL"]) {
    merged.providers.openai.baseURL = process.env["OPENAI_BASE_URL"];
  }

  // Anthropic
  if (!merged.providers.anthropic.apiKey && process.env["ANTHROPIC_API_KEY"]) {
    merged.providers.anthropic.apiKey = process.env["ANTHROPIC_API_KEY"];
    merged.providers.anthropic.enabled = true;
  }
  if (!merged.providers.anthropic.baseURL && process.env["ANTHROPIC_BASE_URL"]) {
    merged.providers.anthropic.baseURL = process.env["ANTHROPIC_BASE_URL"];
  }

  // Google Gemini
  const googleKey =
    process.env["GEMINI_API_KEY"] ||
    process.env["GOOGLE_GENERATIVE_AI_API_KEY"] ||
    process.env["GOOGLE_API_KEY"];
  if (!merged.providers.google.apiKey && googleKey) {
    merged.providers.google.apiKey = googleKey;
    merged.providers.google.enabled = true;
  }

  // Groq
  if (!merged.providers.groq.apiKey && process.env["GROQ_API_KEY"]) {
    merged.providers.groq.apiKey = process.env["GROQ_API_KEY"];
    merged.providers.groq.enabled = true;
  }

  // DeepSeek
  if (!merged.providers.deepseek.apiKey && process.env["DEEPSEEK_API_KEY"]) {
    merged.providers.deepseek.apiKey = process.env["DEEPSEEK_API_KEY"];
    merged.providers.deepseek.enabled = true;
  }

  // Mistral
  if (!merged.providers.mistral.apiKey && process.env["MISTRAL_API_KEY"]) {
    merged.providers.mistral.apiKey = process.env["MISTRAL_API_KEY"];
    merged.providers.mistral.enabled = true;
  }

  // Ollama
  if (process.env["OLLAMA_BASE_URL"]) {
    merged.providers.ollama.baseURL = process.env["OLLAMA_BASE_URL"];
    merged.providers.ollama.enabled = true;
  }

  // OpenRouter
  if (!merged.providers.openrouter.apiKey && process.env["OPENROUTER_API_KEY"]) {
    merged.providers.openrouter.apiKey = process.env["OPENROUTER_API_KEY"];
    merged.providers.openrouter.enabled = true;
  }

  // Search providers env fallbacks
  if (!merged.searchProviders.tavily.apiKey && process.env["TAVILY_API_KEY"]) {
    merged.searchProviders.tavily.apiKey = process.env["TAVILY_API_KEY"];
    merged.searchProviders.tavily.enabled = true;
  }
  if (!merged.searchProviders.brave.apiKey && process.env["BRAVE_API_KEY"]) {
    merged.searchProviders.brave.apiKey = process.env["BRAVE_API_KEY"];
    merged.searchProviders.brave.enabled = true;
  }
  if (!merged.searchProviders.serper.apiKey && process.env["SERPER_API_KEY"]) {
    merged.searchProviders.serper.apiKey = process.env["SERPER_API_KEY"];
    merged.searchProviders.serper.enabled = true;
  }
  if (!merged.searchProviders.exa.apiKey && process.env["EXA_API_KEY"]) {
    merged.searchProviders.exa.apiKey = process.env["EXA_API_KEY"];
    merged.searchProviders.exa.enabled = true;
  }
  if (process.env["SEARXNG_BASE_URL"]) {
    merged.searchProviders.searxng.baseURL = process.env["SEARXNG_BASE_URL"];
    merged.searchProviders.searxng.enabled = true;
  }

  // Global overrides (only if not already set)
  if (!merged.defaultModel && process.env["OPENCHAT_DEFAULT_MODEL"]) {
    merged.defaultModel = process.env["OPENCHAT_DEFAULT_MODEL"];
  }

  return merged;
}

/**
 * Loads settings from ~/.openchat/settings.json, merging environment variables.
 * Creates default settings if the file does not exist.
 */
export function loadSettings(): OpenChatSettings {
  ensureOpenChatDirs();

  if (!fs.existsSync(SETTINGS_FILE)) {
    const defaults = getDefaultSettings();
    const withEnv = mergeEnvironmentDefaults(defaults);
    return withEnv;
  }

  try {
    const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    const validated = OpenChatSettingsSchema.parse(parsed);
    return mergeEnvironmentDefaults(validated);
  } catch (error) {
    console.warn(`Failed to read settings from ${SETTINGS_FILE}, using defaults:`, error);
    return mergeEnvironmentDefaults(getDefaultSettings());
  }
}

/**
 * Saves settings to ~/.openchat/settings.json
 */
export function saveSettings(settings: Partial<OpenChatSettings>): OpenChatSettings {
  ensureOpenChatDirs();

  let existing: OpenChatSettings = getDefaultSettings();
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
      existing = OpenChatSettingsSchema.parse(JSON.parse(raw));
    } catch {
      // ignore parse errors and overwrite
    }
  }

  const merged = OpenChatSettingsSchema.parse({
    ...existing,
    ...settings,
  });

  const tmpFile = `${SETTINGS_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tmpFile, JSON.stringify(merged, null, 2), "utf-8");
  fs.renameSync(tmpFile, SETTINGS_FILE);

  return merged;
}
