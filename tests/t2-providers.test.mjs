import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

// Isolate test environment
const testHome = fs.mkdtempSync(path.join(os.tmpdir(), "openchat-p-test-"));
process.env["OPENCHAT_HOME"] = path.join(testHome, ".openchat");

test("adapters instantiate and return LanguageModel with correct models", async () => {
  const {
    OpenAIAdapter,
    AnthropicAdapter,
    GoogleAdapter,
    GroqAdapter,
    DeepSeekAdapter,
    OllamaAdapter,
    OpenRouterAdapter,
    CustomOpenAIAdapter,
  } = await import("../src/features/providers/adapters/index.js");

  // 1. OpenAI
  const openai = new OpenAIAdapter();
  assert.equal(openai.id, "openai");
  const openaiModels = await openai.listModels();
  const openaiIds = openaiModels.map((m) => m.id);
  assert.ok(openaiIds.includes("gpt-4o"));
  assert.ok(openaiIds.includes("gpt-4o-mini"));
  assert.ok(openaiIds.includes("o1"));
  assert.ok(openaiIds.includes("o3-mini"));
  assert.ok(openaiIds.includes("gpt-4.5"));
  const mOpenAI = openai.getLanguageModel("gpt-4o");
  assert.equal(mOpenAI.modelId, "gpt-4o");

  // 2. Anthropic
  const anthropic = new AnthropicAdapter();
  assert.equal(anthropic.id, "anthropic");
  const anthropicModels = await anthropic.listModels();
  const anthropicIds = anthropicModels.map((m) => m.id);
  assert.ok(anthropicIds.includes("claude-3-7-sonnet-20250219"));
  assert.ok(anthropicIds.includes("claude-3-5-sonnet-20241022"));
  assert.ok(anthropicIds.includes("claude-3-5-haiku-20241022"));
  const mAnthropic = anthropic.getLanguageModel("claude-3-7-sonnet-20250219");
  assert.equal(mAnthropic.modelId, "claude-3-7-sonnet-20250219");

  // 3. Google Gemini
  const google = new GoogleAdapter();
  assert.equal(google.id, "google");
  const googleModels = await google.listModels();
  const googleIds = googleModels.map((m) => m.id);
  assert.ok(googleIds.includes("gemini-2.5-flash"));
  assert.ok(googleIds.includes("gemini-2.5-pro"));
  assert.ok(googleIds.includes("gemini-2.0-flash-thinking-exp-01-21"));
  const mGoogle = google.getLanguageModel("gemini-2.5-flash");
  assert.equal(mGoogle.modelId, "gemini-2.5-flash");

  // 4. Groq
  const groq = new GroqAdapter();
  assert.equal(groq.id, "groq");
  const groqModels = await groq.listModels();
  const groqIds = groqModels.map((m) => m.id);
  assert.ok(groqIds.includes("llama-3.3-70b-versatile"));
  assert.ok(groqIds.includes("llama-3.1-8b-instant"));
  assert.ok(groqIds.includes("mixtral-8x7b-32768"));
  const mGroq = groq.getLanguageModel("llama-3.3-70b-versatile");
  assert.equal(mGroq.modelId, "llama-3.3-70b-versatile");

  // 5. DeepSeek
  const deepseek = new DeepSeekAdapter();
  assert.equal(deepseek.id, "deepseek");
  const deepseekModels = await deepseek.listModels();
  const deepseekIds = deepseekModels.map((m) => m.id);
  assert.ok(deepseekIds.includes("deepseek-chat"));
  assert.ok(deepseekIds.includes("deepseek-reasoner"));
  const mDeepseek = deepseek.getLanguageModel("deepseek-chat");
  assert.equal(mDeepseek.modelId, "deepseek-chat");

  // 6. Ollama (offline fallback)
  const ollama = new OllamaAdapter();
  assert.equal(ollama.id, "ollama");
  const ollamaModels = await ollama.listModels({ baseURL: "http://127.0.0.1:59999" });
  assert.ok(ollamaModels.length > 0);
  assert.ok(ollamaModels.some((m) => m.id === "llama3.2"));
  const mOllama = ollama.getLanguageModel("llama3.2");
  assert.equal(mOllama.modelId, "llama3.2");

  // 7. OpenRouter
  const openrouter = new OpenRouterAdapter();
  assert.equal(openrouter.id, "openrouter");
  const openrouterModels = await openrouter.listModels();
  assert.ok(openrouterModels.some((m) => m.id === "anthropic/claude-3.7-sonnet"));
  const mOpenRouter = openrouter.getLanguageModel("anthropic/claude-3.7-sonnet");
  assert.equal(mOpenRouter.modelId, "anthropic/claude-3.7-sonnet");

  // 8. Custom OpenAI
  const custom = new CustomOpenAIAdapter();
  assert.equal(custom.id, "custom");
  const customModels = await custom.listModels({
    models: ["local-llama-finetune", "mistral-7b-custom"],
  });
  assert.equal(customModels.length, 2);
  assert.equal(customModels[0]?.id, "local-llama-finetune");
  assert.equal(customModels[0]?.isCustom, true);
  const mCustom = custom.getLanguageModel("local-llama-finetune", {
    baseURL: "http://localhost:8000/v1",
    apiKey: "test-token",
  });
  assert.equal(mCustom.modelId, "local-llama-finetune");
});

test("Ollama discovers models dynamically via /api/tags", async () => {
  const { OllamaAdapter } = await import("../src/features/providers/adapters/index.js");
  const ollama = new OllamaAdapter();

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("/api/tags")) {
      return {
        ok: true,
        json: async () => ({
          models: [
            {
              name: "qwen2.5:32b",
              details: { parameter_size: "32B" },
            },
            {
              name: "deepseek-r1:70b",
              details: { parameter_size: "70B" },
            },
            {
              name: "llava:13b",
              details: { parameter_size: "13B" },
            },
          ],
        }),
      };
    }
    return originalFetch(url);
  };

  try {
    const discovered = await ollama.listModels({ baseURL: "http://localhost:11434" });
    assert.equal(discovered.length, 3);
    assert.equal(discovered[0]?.id, "qwen2.5:32b");
    assert.equal(discovered[0]?.providerId, "ollama");

    const reasoningModel = discovered.find((m) => m.id === "deepseek-r1:70b");
    assert.equal(reasoningModel?.supportsReasoning, true);

    const visionModel = discovered.find((m) => m.id === "llava:13b");
    assert.equal(visionModel?.supportsVision, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("ProviderRegistry manages adapters and lists all models", async () => {
  const { providerRegistry, ProviderRegistry } = await import(
    "../src/features/providers/registry.js"
  );

  const registry = new ProviderRegistry();
  const adapters = registry.listAdapters();
  assert.equal(adapters.length, 8);

  const openaiAdapter = registry.getAdapter("openai");
  assert.ok(openaiAdapter);
  assert.equal(openaiAdapter.id, "openai");

  const groqAdapter = registry.getAdapter("groq");
  assert.ok(groqAdapter);
  assert.equal(groqAdapter.id, "groq");

  const allModels = await registry.getAllModels();
  assert.ok(allModels.length >= 20);

  // Check custom model merging from settings
  const customModels = await registry.getAllModels({
    version: 1,
    theme: "system",
    defaultModel: "gpt-4o",
    defaultProvider: "openai",
    activeSearchProvider: "duckduckgo",
    searchProviders: {},
    mcpServers: {},
    providers: {
      openai: { enabled: true, models: ["gpt-4o-custom-ft"] },
      anthropic: { enabled: false, models: [] },
      google: { enabled: false, models: [] },
      groq: { enabled: false, models: [] },
      deepseek: { enabled: false, models: [] },
      mistral: { enabled: false, models: [] },
      ollama: { enabled: false, models: [] },
      openrouter: { enabled: false, models: [] },
      custom: { enabled: false, models: ["vllm-mistral-32k"] },
    },
  });

  assert.ok(customModels.some((m) => m.id === "gpt-4o-custom-ft" && m.isCustom === true));
  assert.ok(customModels.some((m) => m.id === "vllm-mistral-32k" && m.isCustom === true));
});

test("ProviderRegistry resolves models and supports arbitrary custom model fallbacks", async () => {
  const { providerRegistry } = await import("../src/features/providers/registry.js");

  // 1. Standard resolution
  const m1 = providerRegistry.resolveLanguageModel("openai", "gpt-4o");
  assert.equal(m1.modelId, "gpt-4o");

  const m2 = providerRegistry.resolveLanguageModel("anthropic", "claude-3-7-sonnet-20250219");
  assert.equal(m2.modelId, "claude-3-7-sonnet-20250219");

  // 2. Arbitrary custom model on known provider
  const mCustomOpenAI = providerRegistry.resolveLanguageModel("openai", "ft:gpt-4o:my-team:fine-tune-01");
  assert.equal(mCustomOpenAI.modelId, "ft:gpt-4o:my-team:fine-tune-01");

  // 3. Fallback to custom adapter for unknown provider ID
  const mUnknownProvider = providerRegistry.resolveLanguageModel(
    "vllm-cluster-99",
    "meta-llama/Llama-3-70B-Instruct"
  );
  assert.equal(mUnknownProvider.modelId, "meta-llama/Llama-3-70B-Instruct");

  // 4. Custom provider resolution
  const mCustomDirect = providerRegistry.resolveLanguageModel(
    "custom",
    "local-phi-4"
  );
  assert.equal(mCustomDirect.modelId, "local-phi-4");
});

test("API route GET /api/models returns available models and defaults", async () => {
  const { GET } = await import("../src/app/api/models/route.js");

  const response = await GET();
  assert.equal(response.status, 200);

  const json = await response.json();
  assert.ok(Array.isArray(json.models));
  assert.ok(json.models.length > 0);
  assert.ok(json.defaultModel);
  assert.ok(json.defaultProvider);

  // Verify models contains expected entries
  const modelIds = json.models.map((m) => m.id);
  assert.ok(modelIds.includes("gpt-4o"));
  assert.ok(modelIds.includes("claude-3-7-sonnet-20250219"));
  assert.ok(modelIds.includes("gemini-2.5-flash"));
});
