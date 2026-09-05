import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { McpServerConfig, McpServerStatus, McpToolDefinition } from "./types";

interface ActiveClientEntry {
  client: Client;
  transport: Transport;
  config: McpServerConfig;
}

export class McpClientManager {
  private clients = new Map<string, ActiveClientEntry>();
  private statuses = new Map<string, McpServerStatus>();

  /**
   * Connect to an MCP server using StdioClientTransport or SSEClientTransport,
   * discover available tools, and update server status.
   */
  async connectServer(
    config: McpServerConfig,
    customTransport?: Transport
  ): Promise<McpServerStatus> {
    const transportType = config.transport || config.type || "stdio";

    // Disconnect if already connected
    if (this.clients.has(config.id)) {
      await this.disconnectServer(config.id);
    }

    this.statuses.set(config.id, {
      id: config.id,
      status: "connecting",
      tools: [],
    });

    let transport: Transport;

    try {
      if (customTransport) {
        transport = customTransport;
      } else if (transportType === "stdio") {
        if (!config.command) {
          throw new Error(`Command is required for stdio transport (server: ${config.name})`);
        }

        const env: Record<string, string> = {};
        for (const [k, v] of Object.entries(process.env)) {
          if (v !== undefined) {
            env[k] = v;
          }
        }
        if (config.env) {
          Object.assign(env, config.env);
        }

        transport = new StdioClientTransport({
          command: config.command,
          args: config.args ?? [],
          env,
        });
      } else if (transportType === "sse") {
        if (!config.url) {
          throw new Error(`URL is required for sse transport (server: ${config.name})`);
        }
        transport = new SSEClientTransport(new URL(config.url));
      } else {
        throw new Error(`Unsupported transport type: "${transportType}"`);
      }

      const client = new Client(
        {
          name: "openchat",
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );

      await client.connect(transport);

      // Query tools provided by the connected server
      let tools: McpToolDefinition[] = [];
      try {
        const result = await client.listTools();
        tools = (result?.tools || []).map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: (t.inputSchema as Record<string, any>) || { type: "object", properties: {} },
          serverId: config.id,
        }));
      } catch (err) {
        console.warn(`[McpClientManager] Failed to query initial tools for ${config.id}:`, err);
      }

      this.clients.set(config.id, { client, transport, config });

      const status: McpServerStatus = {
        id: config.id,
        status: "connected",
        tools,
      };
      this.statuses.set(config.id, status);
      return status;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStatus: McpServerStatus = {
        id: config.id,
        status: "error",
        error: errorMessage,
        tools: [],
      };
      this.statuses.set(config.id, errorStatus);
      throw error;
    }
  }

  /**
   * Disconnect an active server and clean up resources.
   */
  async disconnectServer(id: string): Promise<void> {
    const entry = this.clients.get(id);
    if (entry) {
      try {
        await entry.client.close();
      } catch (e) {
        console.warn(`[McpClientManager] Error closing client for server ${id}:`, e);
      }
      this.clients.delete(id);
    }

    this.statuses.set(id, {
      id,
      status: "disconnected",
      tools: [],
    });
  }

  /**
   * List tools for a specific server or across all connected servers.
   */
  async listTools(id?: string): Promise<McpToolDefinition[]> {
    if (id) {
      const entry = this.clients.get(id);
      if (!entry) {
        return this.statuses.get(id)?.tools ?? [];
      }
      const response = await entry.client.listTools();
      const tools: McpToolDefinition[] = (response?.tools || []).map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: (t.inputSchema as Record<string, any>) || { type: "object", properties: {} },
        serverId: id,
      }));

      const status = this.statuses.get(id);
      if (status) {
        status.tools = tools;
      }
      return tools;
    }

    // Return tools for all connected servers
    const allTools: McpToolDefinition[] = [];
    for (const status of this.statuses.values()) {
      if (status.status === "connected") {
        allTools.push(...status.tools);
      }
    }
    return allTools;
  }

  /**
   * Call a tool on a connected server.
   */
  async callTool(id: string, name: string, args: Record<string, any> = {}): Promise<any> {
    const entry = this.clients.get(id);
    if (!entry) {
      throw new Error(`MCP server "${id}" is not connected`);
    }

    return await entry.client.callTool({
      name,
      arguments: args,
    });
  }

  /**
   * Get statuses of all known MCP servers.
   */
  getServerStatuses(): McpServerStatus[] {
    return Array.from(this.statuses.values());
  }

  /**
   * Get status of a single MCP server.
   */
  getServerStatus(id: string): McpServerStatus | undefined {
    return this.statuses.get(id);
  }

  /**
   * Check if a server is currently connected.
   */
  isConnected(id: string): boolean {
    return this.clients.has(id);
  }

  /**
   * Close all active client connections.
   */
  async closeAll(): Promise<void> {
    const ids = Array.from(this.clients.keys());
    await Promise.all(ids.map((id) => this.disconnectServer(id)));
  }
}

// Preserve singleton across fast-refresh in development
const globalForMcp = globalThis as unknown as { mcpClientManager?: McpClientManager };
export const mcpClientManager = globalForMcp.mcpClientManager ?? new McpClientManager();
if (process.env.NODE_ENV !== "production") {
  globalForMcp.mcpClientManager = mcpClientManager;
}
