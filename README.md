# OpenChat

A self-hostable, extensible, open-source ChatGPT alternative built with Next.js, Vercel AI SDK, Total TypeScript, and Vertical Slice Architecture (VSA).

## Features
- **All Major LLM Providers**: OpenAI, Anthropic, Google Gemini, Groq, Mistral, DeepSeek, Ollama, OpenRouter, and custom OpenAI-compatible endpoints.
- **Multiple Web Search Engines**: DuckDuckGo, Tavily, Brave Search, Serper, Exa, SearXNG.
- **Model Context Protocol (MCP)**: Native support for STDIO and SSE MCP servers.
- **Custom Composer UI**: Assistant-UI style input with floating pills, auto-expanding textarea, reasoning toggle, and search toggle.
- **Hybrid Storage**: `~/.openchat/settings.json` for human-editable configurations and `~/.openchat/openchat.db` (SQLite) for high-performance message trees & branching.
- **Install & Run via CLI**: `npm i -g openchat` and launch with `openchat`.
