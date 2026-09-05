import { NextRequest, NextResponse } from "next/server";
import { mcpClientManager, McpClientManager } from "@/features/mcp/client-manager";
import { loadSettings, saveSettings } from "@/features/settings/config-file";
import type { McpServerConfig } from "@/features/mcp/types";

export async function GET() {
  try {
    const settings = loadSettings();
    const configured = settings.mcpServers || {};

    // Auto-connect enabled servers if not already connected or connecting
    for (const [id, config] of Object.entries(configured)) {
      if (
        config.enabled &&
        !mcpClientManager.isConnected(id) &&
        mcpClientManager.getServerStatus(id)?.status !== "connecting" &&
        mcpClientManager.getServerStatus(id)?.status !== "error"
      ) {
        try {
          await mcpClientManager.connectServer({
            id,
            name: config.name,
            transport: config.transport || config.type || "stdio",
            command: config.command,
            args: config.args || [],
            url: config.url,
            env: config.env || {},
            enabled: config.enabled,
          });
        } catch {
          // Status updated to 'error' inside mcpClientManager
        }
      }
    }

    const servers = mcpClientManager.getServerStatuses();
    const tools = await mcpClientManager.listTools();

    return NextResponse.json({
      servers,
      configured,
      tools,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    switch (action) {
      case "test": {
        const server: McpServerConfig = body.server;
        if (!server) {
          return NextResponse.json(
            { success: false, error: "Missing server configuration in request" },
            { status: 400 }
          );
        }

        const tempManager = new McpClientManager();
        try {
          const status = await tempManager.connectServer(server);
          const tools = await tempManager.listTools(server.id);
          await tempManager.closeAll();

          return NextResponse.json({
            success: true,
            status: status.status,
            tools,
          });
        } catch (err) {
          await tempManager.closeAll().catch(() => {});
          return NextResponse.json(
            {
              success: false,
              error: err instanceof Error ? err.message : String(err),
            },
            { status: 400 }
          );
        }
      }

      case "connect": {
        let serverConfig: McpServerConfig | undefined = body.server;
        if (!serverConfig && body.id) {
          const settings = loadSettings();
          const raw = settings.mcpServers[body.id];
          if (raw) {
            serverConfig = {
              ...raw,
              id: raw.id || body.id,
              transport: raw.transport || raw.type || "stdio",
            };
          }
        }

        if (!serverConfig) {
          return NextResponse.json(
            { success: false, error: "Server configuration not found" },
            { status: 400 }
          );
        }

        try {
          const status = await mcpClientManager.connectServer(serverConfig);
          return NextResponse.json({ success: true, status });
        } catch (err) {
          return NextResponse.json(
            {
              success: false,
              error: err instanceof Error ? err.message : String(err),
              status: mcpClientManager.getServerStatus(serverConfig.id),
            },
            { status: 500 }
          );
        }
      }

      case "disconnect": {
        const id = body.id;
        if (!id) {
          return NextResponse.json(
            { success: false, error: "Missing server id" },
            { status: 400 }
          );
        }

        await mcpClientManager.disconnectServer(id);
        return NextResponse.json({
          success: true,
          status: mcpClientManager.getServerStatus(id),
        });
      }

      case "callTool": {
        const { serverId, toolName, args } = body;
        if (!serverId || !toolName) {
          return NextResponse.json(
            { success: false, error: "Missing serverId or toolName" },
            { status: 400 }
          );
        }

        try {
          const result = await mcpClientManager.callTool(serverId, toolName, args || {});
          return NextResponse.json({ success: true, result });
        } catch (err) {
          return NextResponse.json(
            {
              success: false,
              error: err instanceof Error ? err.message : String(err),
            },
            { status: 500 }
          );
        }
      }

      case "saveServer": {
        const server: McpServerConfig = body.server;
        if (!server || !server.id || !server.name) {
          return NextResponse.json(
            { success: false, error: "Invalid server configuration" },
            { status: 400 }
          );
        }

        const settings = loadSettings();
        const updatedServers = {
          ...settings.mcpServers,
          [server.id]: server,
        };

        saveSettings({ mcpServers: updatedServers });

        // Connect if enabled
        if (server.enabled) {
          try {
            await mcpClientManager.connectServer(server);
          } catch {
            // Recorded in client manager status
          }
        }

        return NextResponse.json({
          success: true,
          server,
          status: mcpClientManager.getServerStatus(server.id),
        });
      }

      case "deleteServer": {
        const id = body.id;
        if (!id) {
          return NextResponse.json(
            { success: false, error: "Missing server id" },
            { status: 400 }
          );
        }

        await mcpClientManager.disconnectServer(id);

        const settings = loadSettings();
        const updatedServers = { ...settings.mcpServers };
        delete updatedServers[id];
        saveSettings({ mcpServers: updatedServers });

        return NextResponse.json({ success: true });
      }

      case "toggleServer": {
        const { id, enabled } = body;
        if (!id || typeof enabled !== "boolean") {
          return NextResponse.json(
            { success: false, error: "Invalid id or enabled state" },
            { status: 400 }
          );
        }

        const settings = loadSettings();
        const server = settings.mcpServers[id];
        if (!server) {
          return NextResponse.json(
            { success: false, error: "Server not found in settings" },
            { status: 404 }
          );
        }

        server.enabled = enabled;
        saveSettings({ mcpServers: settings.mcpServers });

        if (enabled) {
          try {
            await mcpClientManager.connectServer({
              ...server,
              id: server.id || id,
              transport: server.transport || server.type || "stdio",
            });
          } catch {
            // Recorded in client manager status
          }
        } else {
          await mcpClientManager.disconnectServer(id);
        }

        return NextResponse.json({
          success: true,
          server,
          status: mcpClientManager.getServerStatus(id),
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: "${action}"` },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
