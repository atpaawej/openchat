# OpenChat Implementation Task Graph & Tickets

## Task Graph & Dependency Frontier

```
[T1: Scaffolding, CLI, Storage, Schema & Base UI]
                   │
    ┌──────────────┼──────────────┐
    ▼              ▼              ▼
[T2: Providers] [T3: Search &   [T4: MCP
 Registry]       Plugins]        Slice]
    │              │              │
    └──────────────┼──────────────┘
                   ▼
    [T5: Composer & Chat Turn Engine]
                   │
                   ▼
    [T6: Sidebar, Projects, Settings Modal & Polish]
```

### Ticket 1: Scaffolding, CLI, Storage, Schema & Base UI
- **Dependencies**: None (Root)
- **Status**: Ready
- **Scope**:
  - Initialize Next.js 15 App Router, TypeScript, Tailwind CSS, Lucide icons, Radix UI.
  - Setup CLI `bin/openchat.js` executable with port finder (`get-port` or standard net probe) and browser launcher (`open`).
  - Implement `lib/paths.ts` for managing `~/.openchat/` across platforms.
  - Implement `features/settings/config-file.ts` for `settings.json` reading/writing with safe defaults and env fallbacks.
  - Setup SQLite via `better-sqlite3` and Drizzle ORM schema: `sessions`, `messages` (with `parent_id` for tree branching), `projects`, `project_files`.
  - Build base UI primitives (`lib/ui`): Button, Dialog, Dropdown, Tooltip, Input, Textarea, Tabs.

### Ticket 2: LLM Providers Slice (`features/providers`)
- **Dependencies**: T1
- **Status**: Blocked by T1
- **Scope**:
  - Universal `ProviderRegistry` and `ProviderAdapter` interface.
  - Adapters: OpenAI (`@ai-sdk/openai`), Anthropic (`@ai-sdk/anthropic`), Google Gemini (`@ai-sdk/google`), Groq (`@ai-sdk/groq`), DeepSeek, Ollama (with automated `/api/tags` discovery), OpenRouter, and Custom OpenAI-compatible endpoints.
  - Allow arbitrary custom model names in UI and API.
  - API endpoint `/api/models` to query active models across configured providers.

### Ticket 3: Web Search Slice (`features/web-search`) & Plugins (`features/plugins`)
- **Dependencies**: T1
- **Status**: Blocked by T1
- **Scope**:
  - `SearchRegistry` and `WebSearchProvider` interface.
  - Adapters: DuckDuckGo (zero-key fallback), Tavily, Brave Search, Serper, Exa, SearXNG.
  - AI SDK `webSearchTool` converting search results into structured citations with titles, favicons, URLs, and snippets.
  - Built-in Plugins: URL reader/scraper and Calculator.

### Ticket 4: Model Context Protocol (`features/mcp`)
- **Dependencies**: T1
- **Status**: Blocked by T1
- **Scope**:
  - `McpClientManager` using `@modelcontextprotocol/sdk` supporting both STDIO child processes and SSE endpoints.
  - Dynamic tool adapter mapping MCP tool JSONSchemas to AI SDK `tool()` instances.
  - MCP inspection API and tool runner bridge.

### Ticket 5: Custom Composer Input & Chat Turn Engine (`features/composer`, `features/chat`)
- **Dependencies**: T2, T3, T4
- **Status**: Blocked by T2, T3, T4
- **Scope**:
  - Custom Assistant-UI style Composer input: floating bottom dock, auto-resizing textarea, model switcher pill, reasoning `<think>` toggle, web search toggle, staged attachment chips.
  - API route `/api/chat` using AI SDK `streamText` coordinating LLMs, web search tool, and MCP tools.
  - Message rendering: streaming markdown, code blocks with syntax highlighting and copy button, LaTeX math formulas via KaTeX, collapsible thinking block (`<think>`), citation chips.
  - Message Tree Branching: edit previous prompt, branch creation, version navigator (`< 1/2 >`).

### Ticket 6: Sidebar, Projects Slice (`features/projects`), Settings Dialog (`features/settings`) & Polish
- **Dependencies**: T1, T5
- **Status**: Blocked by T5
- **Scope**:
  - ChatGPT-style collapsible left sidebar: time-bucketed sessions (Today, Yesterday, 7 Days, 30 Days), pinning, renaming, deleting.
  - Projects: Custom instructions, project knowledge documents, project chat threads (`/p/[id]`).
  - Full Settings modal with tabs: General, Providers, Web Search, MCP Servers, Data Controls.
  - End-to-end integration and smoke verification.
