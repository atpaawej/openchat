import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NextRequest } from "next/server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.resolve(__dirname, "fixtures/echo-server.mjs");

test("McpToolAdapter: schema normalization and Zod conversion", async () => {
  const { normalizeJsonSchema, jsonSchemaToZod } = await import(
    "../src/features/mcp/tool-adapter"
  );

  // Normalization
  const emptyNorm = normalizeJsonSchema({});
  assert.deepEqual(emptyNorm, {});

  const inferredObj = normalizeJsonSchema({
    properties: { title: { type: "string" } },
  });
  assert.equal(inferredObj.type, "object");

  // Zod conversion
  const zodSchema = jsonSchemaToZod({
    type: "object",
    description: "User search query",
    properties: {
      query: { type: "string", description: "Search query" },
      limit: { type: "number" },
      isExact: { type: "boolean" },
      tags: { type: "array", items: { type: "string" } },
      role: { enum: ["admin", "editor", "viewer"] },
    },
    required: ["query", "role"],
  });

  assert.ok(zodSchema);

  // Valid parse
  const parsed = zodSchema.parse({
    query: "openchat",
    role: "admin",
    tags: ["llm", "mcp"],
  });
  assert.equal(parsed.query, "openchat");
  assert.equal(parsed.role, "admin");
  assert.deepEqual(parsed.tags, ["llm", "mcp"]);

  // Invalid parse (missing required 'query')
  assert.throws(() => {
    zodSchema.parse({ role: "viewer" });
  });
});

test("McpToolAdapter: convertMcpToolsToAiSdkTools creates executable AI SDK tools", async () => {
  const { convertMcpToolsToAiSdkTools } = await import(
    "../src/features/mcp/tool-adapter"
  );

  const mockCalls = [];
  const mockManager = {
    callTool: async (serverId, name, args) => {
      mockCalls.push({ serverId, name, args });
      if (name === "fail_tool") {
        throw new Error("Simulated tool execution error");
      }
      return { content: [{ type: "text", text: `Success on ${name}` }] };
    },
  };

  const mcpTools = [
    {
      name: "fetch_data",
      description: "Fetches remote data",
      inputSchema: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
      serverId: "srv-1",
    },
    {
      name: "fetch_data", // Duplicate name from another server
      description: "Another fetch tool",
      inputSchema: {
        type: "object",
        properties: { endpoint: { type: "string" } },
      },
      serverId: "srv-2",
    },
    {
      name: "fail_tool",
      description: "Tool that throws",
      inputSchema: { type: "object", properties: {} },
      serverId: "srv-1",
    },
  ];

  const tools = convertMcpToolsToAiSdkTools(mcpTools, mockManager);

  // Verify tool keys and collision avoidance
  assert.ok(tools["fetch_data"]);
  assert.ok(tools["srv-2_fetch_data"]);
  assert.ok(tools["fail_tool"]);

  // Verify description & parameter schemas
  assert.equal(tools["fetch_data"].description, "Fetches remote data");
  assert.ok(tools["fetch_data"].inputSchema || tools["fetch_data"].parameters);

  // Execute success tool
  const execResult = await tools["fetch_data"].execute({ url: "https://example.com" });
  assert.equal(mockCalls.length, 1);
  assert.equal(mockCalls[0].serverId, "srv-1");
  assert.equal(mockCalls[0].name, "fetch_data");
  assert.equal(mockCalls[0].args.url, "https://example.com");
  assert.deepEqual(execResult, {
    content: [{ type: "text", text: "Success on fetch_data" }],
  });

  // Execute failure tool (should catch and return error object gracefully)
  const failResult = await tools["fail_tool"].execute({});
  assert.equal(failResult.isError, true);
  assert.match(failResult.error, /Simulated tool execution error/);
});

test("McpClientManager: handles validation and connection errors", async () => {
  const { McpClientManager } = await import(
    "../src/features/mcp/client-manager"
  );

  const manager = new McpClientManager();

  // Missing command for stdio
  await assert.rejects(async () => {
    await manager.connectServer({
      id: "err-1",
      name: "Missing Command",
      transport: "stdio",
      enabled: true,
    });
  }, /Command is required/);

  // Missing URL for sse
  await assert.rejects(async () => {
    await manager.connectServer({
      id: "err-2",
      name: "Missing URL",
      transport: "sse",
      enabled: true,
    });
  }, /URL is required/);

  // Non-existent command
  await assert.rejects(async () => {
    await manager.connectServer({
      id: "err-3",
      name: "Invalid Command",
      transport: "stdio",
      command: "non_existent_openchat_binary_xyz_123",
      enabled: true,
    });
  });

  // Check that status was marked as 'error'
  const errStatus = manager.getServerStatus("err-3");
  assert.equal(errStatus?.status, "error");
  assert.ok(errStatus?.error);
});

test("McpClientManager: connects to stdio subprocess, queries tools, calls tools, and disconnects", async () => {
  const { McpClientManager } = await import(
    "../src/features/mcp/client-manager"
  );

  const manager = new McpClientManager();

  // 1. Connect to stdio subprocess fixture
  const status = await manager.connectServer({
    id: "stdio-test",
    name: "Echo Server",
    transport: "stdio",
    command: process.execPath,
    args: [fixturePath],
    enabled: true,
  });

  assert.equal(status.status, "connected");
  assert.equal(status.id, "stdio-test");
  assert.ok(status.tools.length >= 2);

  const toolNames = status.tools.map((t) => t.name);
  assert.ok(toolNames.includes("echo"));
  assert.ok(toolNames.includes("multiply"));

  // 2. Query tools via listTools
  const toolsForServer = await manager.listTools("stdio-test");
  assert.equal(toolsForServer.length, 2);

  const allTools = await manager.listTools();
  assert.ok(allTools.length >= 2);

  // 3. Call tool
  const echoRes = await manager.callTool("stdio-test", "echo", {
    message: "Hello from test suite",
  });
  assert.deepEqual(echoRes.content, [
    { type: "text", text: "Echo: Hello from test suite" },
  ]);

  const multRes = await manager.callTool("stdio-test", "multiply", {
    x: 7,
    y: 8,
  });
  assert.deepEqual(multRes.content, [{ type: "text", text: "56" }]);

  // 4. Verify server statuses
  const statuses = manager.getServerStatuses();
  assert.equal(statuses.length, 1);
  assert.equal(statuses[0].status, "connected");

  // 5. Disconnect server
  await manager.disconnectServer("stdio-test");
  const disconnectedStatus = manager.getServerStatus("stdio-test");
  assert.equal(disconnectedStatus?.status, "disconnected");
  assert.equal(disconnectedStatus?.tools.length, 0);

  // 6. Calling tool on disconnected server throws
  await assert.rejects(async () => {
    await manager.callTool("stdio-test", "echo", { message: "test" });
  }, /not connected/);

  // 7. Re-connect and test closeAll()
  await manager.connectServer({
    id: "stdio-test-2",
    name: "Echo Server 2",
    transport: "stdio",
    command: process.execPath,
    args: [fixturePath],
    enabled: true,
  });
  assert.equal(manager.isConnected("stdio-test-2"), true);

  await manager.closeAll();
  assert.equal(manager.isConnected("stdio-test-2"), false);
  assert.equal(manager.getServerStatus("stdio-test-2")?.status, "disconnected");
});

test("API route /api/mcp: GET and POST actions (test, save, callTool, toggle, delete)", async () => {
  const { GET, POST } = await import("../src/app/api/mcp/route");

  // 1. GET route initially
  const getRes = await GET();
  assert.equal(getRes.status, 200);
  const getData = await getRes.json();
  assert.ok(Array.isArray(getData.servers));
  assert.ok(typeof getData.configured === "object");
  assert.ok(Array.isArray(getData.tools));

  // 2. POST action: test
  const testReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    body: JSON.stringify({
      action: "test",
      server: {
        id: "api-test-srv",
        name: "Test Echo",
        transport: "stdio",
        command: process.execPath,
        args: [fixturePath],
        enabled: true,
      },
    }),
  });
  const testRes = await POST(testReq);
  assert.equal(testRes.status, 200);
  const testData = await testRes.json();
  assert.equal(testData.success, true);
  assert.ok(testData.tools.length >= 2);

  // 3. POST action: saveServer
  const saveReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    body: JSON.stringify({
      action: "saveServer",
      server: {
        id: "persisted-echo",
        name: "Persisted Echo Server",
        transport: "stdio",
        command: process.execPath,
        args: [fixturePath],
        enabled: true,
      },
    }),
  });
  const saveRes = await POST(saveReq);
  assert.equal(saveRes.status, 200);
  const saveData = await saveRes.json();
  assert.equal(saveData.success, true);

  // 4. POST action: callTool
  const callReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    body: JSON.stringify({
      action: "callTool",
      serverId: "persisted-echo",
      toolName: "multiply",
      args: { x: 3, y: 4 },
    }),
  });
  const callRes = await POST(callReq);
  assert.equal(callRes.status, 200);
  const callData = await callRes.json();
  assert.equal(callData.success, true);
  assert.deepEqual(callData.result.content, [{ type: "text", text: "12" }]);

  // 5. POST action: toggleServer
  const toggleReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    body: JSON.stringify({
      action: "toggleServer",
      id: "persisted-echo",
      enabled: false,
    }),
  });
  const toggleRes = await POST(toggleReq);
  assert.equal(toggleRes.status, 200);
  const toggleData = await toggleRes.json();
  assert.equal(toggleData.success, true);
  assert.equal(toggleData.server.enabled, false);

  // 6. POST action: deleteServer
  const delReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    body: JSON.stringify({
      action: "deleteServer",
      id: "persisted-echo",
    }),
  });
  const delRes = await POST(delReq);
  assert.equal(delRes.status, 200);
  const delData = await delRes.json();
  assert.equal(delData.success, true);
});
