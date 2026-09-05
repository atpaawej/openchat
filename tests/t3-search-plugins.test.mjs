import test from "node:test";
import assert from "node:assert/strict";

// Test 1: Web Search Types and Base Provider Utilities
test("web-search/providers/base correctly derives favicons, decodes entities, and strips HTML", async () => {
  const { getFaviconUrl, decodeHtmlEntities, stripHtml } = await import(
    "../src/features/web-search/providers/base.js"
  );

  const favicon = getFaviconUrl("https://example.com/some/deep/page?query=1");
  assert.equal(
    favicon,
    "https://www.google.com/s2/favicons?domain=example.com&sz=32"
  );

  const decoded = decodeHtmlEntities("Hello &amp; welcome &lt;world&gt; &quot;quotes&#39;");
  assert.equal(decoded, 'Hello & welcome <world> "quotes\'');

  const stripped = stripHtml(
    "<div><h1>Title</h1><script>alert(1)</script><p>Some &amp; content</p></div>"
  );
  assert.equal(stripped, "Title Some & content");
});

// Test 2: DuckDuckGo Provider (HTML parsing and API fallback)
test("web-search/providers/duckduckgo parses HTML search results and falls back to API", async () => {
  const { DuckDuckGoSearchProvider } = await import(
    "../src/features/web-search/providers/duckduckgo.js"
  );

  const provider = new DuckDuckGoSearchProvider();
  assert.equal(provider.id, "duckduckgo");
  assert.equal(provider.name, "DuckDuckGo");

  // Test with mock HTML response
  const originalFetch = globalThis.fetch;
  try {
    const mockHtml = `
      <!DOCTYPE html><html><body>
      <div class="result results_links results_links_deep web-result ">
        <div class="links_main links_deep result__body">
          <h2 class="result__title">
            <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fnextjs.org&amp;rut=1">Next.js - The React Framework</a>
          </h2>
          <a class="result__snippet" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fnextjs.org&amp;rut=1">Production grade React applications with server side rendering.</a>
        </div>
      </div>
      <div class="result results_links results_links_deep web-result ">
        <div class="links_main links_deep result__body">
          <h2 class="result__title">
            <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Freact.dev&amp;rut=2">React Documentation</a>
          </h2>
          <a class="result__snippet" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Freact.dev&amp;rut=2">The library for web and native user interfaces.</a>
        </div>
      </div>
      </body></html>
    `;

    globalThis.fetch = async (url) => {
      if (String(url).includes("html.duckduckgo.com")) {
        return new Response(mockHtml, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      }
      return new Response("Not found", { status: 404 });
    };

    const results = await provider.search("nextjs", { maxResults: 2 });
    assert.equal(results.length, 2);
    assert.equal(results[0]?.title, "Next.js - The React Framework");
    assert.equal(results[0]?.url, "https://nextjs.org");
    assert.ok(results[0]?.snippet.includes("Production grade React"));
    assert.ok(results[0]?.favicon?.includes("nextjs.org"));

    assert.equal(results[1]?.title, "React Documentation");
    assert.equal(results[1]?.url, "https://react.dev");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// Test 3: Tavily Provider formatting and payload verification
test("web-search/providers/tavily sends correct payload and parses response", async () => {
  const { TavilySearchProvider } = await import(
    "../src/features/web-search/providers/tavily.js"
  );

  const provider = new TavilySearchProvider();
  assert.equal(provider.id, "tavily");

  const originalFetch = globalThis.fetch;
  try {
    let capturedBody = null;
    let capturedHeaders = null;

    globalThis.fetch = async (url, init) => {
      capturedBody = JSON.parse(init?.body);
      capturedHeaders = init?.headers;

      return new Response(
        JSON.stringify({
          query: "TypeScript 5.0",
          results: [
            {
              title: "Announcing TypeScript 5.0",
              url: "https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/",
              content: "TypeScript 5.0 includes decorators, const type parameters, and more.",
              score: 0.98,
              published_date: "2023-03-16",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const results = await provider.search(
      "TypeScript 5.0",
      { maxResults: 3, searchDepth: "advanced" },
      { apiKey: "tvly-test-key", enabled: true }
    );

    assert.equal(capturedBody.api_key, "tvly-test-key");
    assert.equal(capturedBody.query, "TypeScript 5.0");
    assert.equal(capturedBody.max_results, 3);
    assert.equal(capturedBody.search_depth, "advanced");

    assert.equal(results.length, 1);
    assert.equal(results[0]?.title, "Announcing TypeScript 5.0");
    assert.equal(
      results[0]?.url,
      "https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/"
    );
    assert.equal(results[0]?.score, 0.98);
    assert.equal(results[0]?.publishedDate, "2023-03-16");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// Test 4: Brave, Serper, Exa, and SearXNG Providers
test("web-search/providers (Brave, Serper, Exa, SearXNG) format requests correctly", async () => {
  const { BraveSearchProvider } = await import(
    "../src/features/web-search/providers/brave.js"
  );
  const { SerperSearchProvider } = await import(
    "../src/features/web-search/providers/serper.js"
  );
  const { ExaSearchProvider } = await import(
    "../src/features/web-search/providers/exa.js"
  );
  const { SearxngSearchProvider } = await import(
    "../src/features/web-search/providers/searxng.js"
  );

  const originalFetch = globalThis.fetch;
  try {
    // Brave test
    globalThis.fetch = async (url, init) => {
      assert.ok(String(url).includes("q=Brave+Search"));
      assert.equal(init?.headers?.["X-Subscription-Token"], "brave-key");
      return new Response(
        JSON.stringify({
          web: {
            results: [
              {
                title: "Brave Results",
                url: "https://brave.com",
                description: "Privacy search engine",
              },
            ],
          },
        }),
        { status: 200 }
      );
    };

    const brave = new BraveSearchProvider();
    const braveResults = await brave.search("Brave Search", {}, { apiKey: "brave-key" });
    assert.equal(braveResults.length, 1);
    assert.equal(braveResults[0]?.url, "https://brave.com");

    // Serper test
    globalThis.fetch = async (url, init) => {
      assert.equal(init?.headers?.["X-API-KEY"], "serper-key");
      return new Response(
        JSON.stringify({
          organic: [
            {
              title: "Serper Results",
              link: "https://google.com",
              snippet: "Fast Google Serper API",
            },
          ],
        }),
        { status: 200 }
      );
    };

    const serper = new SerperSearchProvider();
    const serperResults = await serper.search("Serper query", {}, { apiKey: "serper-key" });
    assert.equal(serperResults.length, 1);
    assert.equal(serperResults[0]?.title, "Serper Results");

    // Exa test
    globalThis.fetch = async (url, init) => {
      assert.equal(init?.headers?.["x-api-key"], "exa-key");
      return new Response(
        JSON.stringify({
          results: [
            {
              title: "Exa Neural Results",
              url: "https://exa.ai",
              text: "Neural search result snippet",
            },
          ],
        }),
        { status: 200 }
      );
    };

    const exa = new ExaSearchProvider();
    const exaResults = await exa.search("Exa query", {}, { apiKey: "exa-key" });
    assert.equal(exaResults.length, 1);
    assert.equal(exaResults[0]?.url, "https://exa.ai");

    // SearXNG test
    globalThis.fetch = async (url) => {
      assert.ok(String(url).includes("format=json"));
      assert.ok(String(url).includes("q=Searxng+query"));
      return new Response(
        JSON.stringify({
          results: [
            {
              title: "SearXNG Result",
              url: "https://searx.org",
              content: "Decentralized search",
            },
          ],
        }),
        { status: 200 }
      );
    };

    const searxng = new SearxngSearchProvider();
    const searxResults = await searxng.search("Searxng query", {}, { baseURL: "http://localhost:8080" });
    assert.equal(searxResults.length, 1);
    assert.equal(searxResults[0]?.title, "SearXNG Result");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// Test 5: Search Registry and Fallback
test("web-search/registry lists providers and falls back gracefully", async () => {
  const { searchRegistry } = await import(
    "../src/features/web-search/registry.js"
  );

  const providers = searchRegistry.listProviders();
  const providerIds = providers.map((p) => p.id);
  assert.ok(providerIds.includes("duckduckgo"));
  assert.ok(providerIds.includes("tavily"));
  assert.ok(providerIds.includes("brave"));
  assert.ok(providerIds.includes("serper"));
  assert.ok(providerIds.includes("exa"));
  assert.ok(providerIds.includes("searxng"));

  const originalFetch = globalThis.fetch;
  try {
    // When tavily fails (e.g. missing key), fallback to duckduckgo executes
    globalThis.fetch = async (url) => {
      if (String(url).includes("html.duckduckgo.com")) {
        return new Response(
          `<div class="result web-result"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Ffallback.com">Fallback</a><a class="result__snippet">Snippet</a></div>`,
          { status: 200, headers: { "Content-Type": "text/html" } }
        );
      }
      return new Response("Unauthorized", { status: 401 });
    };

    const results = await searchRegistry.search("tavily", "test query", { maxResults: 1 });
    assert.equal(results.length, 1);
    assert.equal(results[0]?.url, "https://fallback.com");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// Test 6: AI SDK Web Search Tool
test("web-search/tool creates tool and returns structured citations", async () => {
  const { createWebSearchTool } = await import(
    "../src/features/web-search/tool.js"
  );

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      return new Response(
        `<div class="result web-result"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.org">Example Domain</a><a class="result__snippet">Example snippet text</a></div>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    };

    const searchTool = createWebSearchTool("duckduckgo");
    assert.ok(searchTool.description);
    assert.ok(typeof searchTool.execute === "function");

    const toolResult = await searchTool.execute({ query: "example" }, { toolCallId: "call-1", messages: [] });
    assert.equal(toolResult.query, "example");
    assert.equal(toolResult.provider, "duckduckgo");
    assert.equal(toolResult.results.length, 1);
    assert.ok(toolResult.formatted.includes("[1] \"Example Domain\""));
    assert.ok(toolResult.formatted.includes("URL: https://example.org"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// Test 7: URL Reader Plugin
test("plugins/builtins/url-reader extracts markdown and strips tags", async () => {
  const { htmlToReadableText, createUrlReaderTool, urlReaderPlugin } =
    await import("../src/features/plugins/builtins/url-reader.js");

  assert.equal(urlReaderPlugin.id, "url-reader");

  const sampleHtml = `
    <!DOCTYPE html>
    <html>
      <head><title>Test Article Page</title></head>
      <body>
        <script>console.log("ignore me");</script>
        <style>.hide { display: none; }</style>
        <h1>Main Heading</h1>
        <p>This is an introductory paragraph with a <a href="https://example.com">link</a>.</p>
        <h2>Section Heading</h2>
        <ul>
          <li>First bullet</li>
          <li>Second bullet</li>
        </ul>
        <pre><code>const a = 10;</code></pre>
      </body>
    </html>
  `;

  const { title, content } = htmlToReadableText(sampleHtml);
  assert.equal(title, "Test Article Page");
  assert.ok(content.includes("# Main Heading"));
  assert.ok(content.includes("[link](https://example.com)"));
  assert.ok(content.includes("## Section Heading"));
  assert.ok(content.includes("* First bullet"));
  assert.ok(content.includes("const a = 10;"));
  assert.ok(!content.includes("console.log"));
  assert.ok(!content.includes("display: none"));

  // Test tool execution with mock fetch
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      return new Response(sampleHtml, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    };

    const tool = createUrlReaderTool();
    const res = await tool.execute({ url: "https://example.com/article", maxLength: 5000 }, { toolCallId: "call-2", messages: [] });
    assert.equal(res.url, "https://example.com/article");
    assert.equal(res.title, "Test Article Page");
    assert.ok(res.content.includes("# Main Heading"));
    assert.equal(res.truncated, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// Test 8: Safe Calculator Plugin
test("plugins/builtins/calculator evaluates math accurately and rejects malicious code", async () => {
  const { evaluateMathExpression, createCalculatorTool, calculatorPlugin } =
    await import("../src/features/plugins/builtins/calculator.js");

  assert.equal(calculatorPlugin.id, "calculator");

  // Basic arithmetic & precedence
  assert.equal(evaluateMathExpression("2 + 2 * 10"), 22);
  assert.equal(evaluateMathExpression("(2 + 2) * 10"), 40);
  assert.equal(evaluateMathExpression("100 / 4 - 5"), 20);
  assert.equal(evaluateMathExpression("10 % 3"), 1);

  // Powers and scientific notation
  assert.equal(evaluateMathExpression("2^10"), 1024);
  assert.equal(evaluateMathExpression("2 ** 4"), 16);
  assert.equal(evaluateMathExpression("1e3 + 50"), 1050);

  // Unary operators
  assert.equal(evaluateMathExpression("-5 * -2"), 10);
  assert.equal(evaluateMathExpression("-(3 + 4)"), -7);

  // Built-in functions & constants
  assert.equal(evaluateMathExpression("sqrt(144)"), 12);
  assert.equal(evaluateMathExpression("cbrt(27)"), 3);
  assert.equal(Math.round(evaluateMathExpression("sin(pi / 2)")), 1);
  assert.equal(Math.round(evaluateMathExpression("cos(0)")), 1);
  assert.equal(evaluateMathExpression("min(10, 5, 20)"), 5);
  assert.equal(evaluateMathExpression("max(10, 5, 20)"), 20);
  assert.equal(evaluateMathExpression("pow(3, 3)"), 27);
  assert.equal(evaluateMathExpression("factorial(5)"), 120);

  // Error handling: division by zero
  assert.throws(() => evaluateMathExpression("10 / 0"), /Division by zero/);

  // Security: arbitrary code injection must fail safely
  assert.throws(() => evaluateMathExpression("process.exit(1)"), /Unsupported character|Syntax error/);
  assert.throws(() => evaluateMathExpression("eval('2+2')"), /Unsupported character|Unsupported function/);
  assert.throws(() => evaluateMathExpression("Function('return 1')()"), /Unsupported character|Unsupported function/);
  assert.throws(() => evaluateMathExpression("__proto__"), /Unknown variable/);

  // Test tool execution
  const tool = createCalculatorTool();
  const successRes = await tool.execute({ expression: "sqrt(16) * 5" }, { toolCallId: "call-3", messages: [] });
  assert.equal(successRes.success, true);
  assert.equal(successRes.result, 20);

  const failRes = await tool.execute({ expression: "bad_expression++" }, { toolCallId: "call-4", messages: [] });
  assert.equal(failRes.success, false);
  assert.ok(failRes.error);
});

// Test 9: Plugin Registry
test("plugins/registry aggregates tools from all registered plugins", async () => {
  const { pluginRegistry } = await import(
    "../src/features/plugins/registry.js"
  );

  const plugins = pluginRegistry.listPlugins();
  const pluginIds = plugins.map((p) => p.id);
  assert.ok(pluginIds.includes("url-reader"));
  assert.ok(pluginIds.includes("calculator"));

  const tools = pluginRegistry.getAllTools();
  assert.ok("read_webpage" in tools);
  assert.ok("calculate" in tools);
});
