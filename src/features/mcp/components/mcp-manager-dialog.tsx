"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Textarea,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/lib/ui";
import {
  Server,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Terminal,
  Globe,
  Wrench,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Power,
} from "lucide-react";
import type { McpServerConfig, McpServerStatus, McpToolDefinition } from "../types";

export interface McpManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToolsUpdated?: (toolsCount: number) => void;
}

export function McpManagerDialog({
  open,
  onOpenChange,
  onToolsUpdated,
}: McpManagerDialogProps) {
  const [servers, setServers] = useState<McpServerConfig[]>([]);
  const [statuses, setStatuses] = useState<Record<string, McpServerStatus>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedServerId, setExpandedServerId] = useState<string | null>(null);

  // New server form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransport, setNewTransport] = useState<"stdio" | "sse">("stdio");
  const [newName, setNewName] = useState("");
  const [newCommand, setNewCommand] = useState("");
  const [newArgs, setNewArgs] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newEnv, setNewEnv] = useState("");
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    error?: string;
    tools?: McpToolDefinition[];
  } | null>(null);
  const [testing, setTesting] = useState(false);
  const [testingServerId, setTestingServerId] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/mcp");
      if (!res.ok) throw new Error(`Failed to fetch MCP status: ${res.statusText}`);
      const data = await res.json();

      if (data.configured) {
        const configList: McpServerConfig[] = Object.entries(data.configured).map(
          ([id, cfg]: [string, any]) => ({
            id: cfg.id || id,
            name: cfg.name || id,
            transport: cfg.transport || cfg.type || "stdio",
            command: cfg.command,
            args: cfg.args || [],
            url: cfg.url,
            env: cfg.env || {},
            enabled: cfg.enabled ?? true,
          })
        );
        setServers(configList);
      }

      if (data.servers && Array.isArray(data.servers)) {
        const statusMap: Record<string, McpServerStatus> = {};
        let totalTools = 0;
        for (const s of data.servers) {
          statusMap[s.id] = s;
          if (s.status === "connected") {
            totalTools += (s.tools || []).length;
          }
        }
        setStatuses(statusMap);
        onToolsUpdated?.(totalTools);
      }
    } catch (err) {
      console.error("[McpManagerDialog] Error fetching MCP data:", err);
    } finally {
      setRefreshing(false);
    }
  }, [onToolsUpdated]);

  useEffect(() => {
    if (open) {
      fetchStatus();
    }
  }, [open, fetchStatus]);

  const handleTestConnection = async (configOverride?: McpServerConfig) => {
    setTesting(true);
    setTestResult(null);

    let serverConfig: McpServerConfig;

    if (configOverride) {
      serverConfig = configOverride;
      setTestingServerId(configOverride.id);
    } else {
      let parsedEnv: Record<string, string> = {};
      if (newEnv.trim()) {
        try {
          parsedEnv = JSON.parse(newEnv);
        } catch {
          // Parse KEY=VALUE lines
          const lines = newEnv.split("\n");
          for (const line of lines) {
            const idx = line.indexOf("=");
            if (idx > 0) {
              const k = line.slice(0, idx).trim();
              const v = line.slice(idx + 1).trim();
              if (k) parsedEnv[k] = v;
            }
          }
        }
      }

      const parsedArgs = newArgs
        .trim()
        .split(" ")
        .map((a) => a.trim())
        .filter(Boolean);

      serverConfig = {
        id: `test_${Date.now()}`,
        name: newName || "Test Server",
        transport: newTransport,
        command: newCommand.trim() || undefined,
        args: parsedArgs,
        url: newUrl.trim() || undefined,
        env: parsedEnv,
        enabled: true,
      };
    }

    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          server: serverConfig,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setTestResult({
          success: false,
          error: data.error || "Connection failed",
        });
      } else {
        setTestResult({
          success: true,
          tools: data.tools || [],
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setTesting(false);
      setTestingServerId(null);
    }
  };

  const handleAddServer = async () => {
    if (!newName.trim()) return;

    let parsedEnv: Record<string, string> = {};
    if (newEnv.trim()) {
      try {
        parsedEnv = JSON.parse(newEnv);
      } catch {
        const lines = newEnv.split("\n");
        for (const line of lines) {
          const idx = line.indexOf("=");
          if (idx > 0) {
            const k = line.slice(0, idx).trim();
            const v = line.slice(idx + 1).trim();
            if (k) parsedEnv[k] = v;
          }
        }
      }
    }

    const parsedArgs = newArgs
      .trim()
      .split(" ")
      .map((a) => a.trim())
      .filter(Boolean);

    const id = `mcp_${Date.now()}`;
    const serverConfig: McpServerConfig = {
      id,
      name: newName.trim(),
      transport: newTransport,
      command: newCommand.trim() || undefined,
      args: parsedArgs,
      url: newUrl.trim() || undefined,
      env: parsedEnv,
      enabled: true,
    };

    setLoading(true);
    try {
      await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveServer",
          server: serverConfig,
        }),
      });

      // Reset form
      setNewName("");
      setNewCommand("");
      setNewArgs("");
      setNewUrl("");
      setNewEnv("");
      setTestResult(null);
      setShowAddForm(false);
      await fetchStatus();
    } catch (err) {
      console.error("[McpManagerDialog] Error saving server:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (server: McpServerConfig) => {
    try {
      await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggleServer",
          id: server.id,
          enabled: !server.enabled,
        }),
      });
      await fetchStatus();
    } catch (err) {
      console.error("[McpManagerDialog] Error toggling server:", err);
    }
  };

  const handleDeleteServer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this MCP server?")) return;

    try {
      await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteServer",
          id,
        }),
      });
      await fetchStatus();
    } catch (err) {
      console.error("[McpManagerDialog] Error deleting server:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-500" />
              <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Model Context Protocol (MCP) Servers
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStatus}
              disabled={refreshing}
              className="h-8 px-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              title="Refresh servers"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            </Button>
          </div>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Connect local subprocesses (STDIO) or remote endpoints (SSE) to empower your assistant with external tools.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Server List */}
          {servers.length === 0 && !showAddForm ? (
            <div className="text-center py-10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <Server className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                No MCP servers configured
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Add a STDIO or SSE server to discover tools like filesystem access, database queries, and more.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="w-4 h-4" />
                Add MCP Server
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {servers.map((server) => {
                const status = statuses[server.id];
                const isConnected = status?.status === "connected";
                const isError = status?.status === "error";
                const isConnecting = status?.status === "connecting";
                const tools = status?.tools || [];
                const isExpanded = expandedServerId === server.id;

                return (
                  <div
                    key={server.id}
                    className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {server.transport === "stdio" ? (
                          <Terminal className="w-4 h-4 text-zinc-500 shrink-0" />
                        ) : (
                          <Globe className="w-4 h-4 text-zinc-500 shrink-0" />
                        )}
                        <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {server.name}
                        </span>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {server.transport}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status badge */}
                        {isConnecting ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Connecting
                          </span>
                        ) : isConnected ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Connected ({tools.length} {tools.length === 1 ? "tool" : "tools"})
                          </span>
                        ) : isError ? (
                          <span
                            className="inline-flex items-center gap-1 text-xs text-rose-500 truncate max-w-[150px]"
                            title={status?.error}
                          >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            Error
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">Disconnected</span>
                        )}

                        {/* Test connection button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={testingServerId === server.id}
                          onClick={() => handleTestConnection(server)}
                          className="h-7 px-2 text-xs"
                          title="Test server connection"
                        >
                          {testingServerId === server.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Test"
                          )}
                        </Button>

                        {/* Toggle active state */}
                        <button
                          type="button"
                          onClick={() => handleToggleEnabled(server)}
                          className={cn(
                            "p-1.5 rounded-lg border transition-colors cursor-pointer",
                            server.enabled
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                              : "bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-400"
                          )}
                          title={server.enabled ? "Disable server" : "Enable server"}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteServer(server.id)}
                          className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-500"
                          title="Delete server"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Server details */}
                    <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80 overflow-x-auto">
                      {server.transport === "stdio" ? (
                        <div>
                          <span className="text-zinc-400 select-none">$ </span>
                          <span>{server.command} </span>
                          <span>{(server.args || []).join(" ")}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-zinc-400 select-none">URL: </span>
                          <span>{server.url}</span>
                        </div>
                      )}
                    </div>

                    {/* Expandable Tools List */}
                    {tools.length > 0 && (
                      <div className="border-t border-zinc-200/80 dark:border-zinc-800/80 pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedServerId(isExpanded ? null : server.id)
                          }
                          className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                          <Wrench className="w-3.5 h-3.5" />
                          Discovered Tools ({tools.length})
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-2 pl-4">
                            {tools.map((t) => (
                              <div
                                key={t.name}
                                className="bg-white dark:bg-zinc-950 p-2 rounded-lg border border-zinc-200/70 dark:border-zinc-800/70 text-xs"
                              >
                                <div className="font-semibold text-zinc-900 dark:text-zinc-200 font-mono">
                                  {t.name}
                                </div>
                                {t.description && (
                                  <div className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">
                                    {t.description}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Server Form */}
          {showAddForm ? (
            <div className="border border-indigo-200 dark:border-indigo-900/60 rounded-xl p-4 bg-indigo-50/20 dark:bg-indigo-950/10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Add New MCP Server
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setTestResult(null);
                  }}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Server Name
                  </label>
                  <Input
                    placeholder="e.g. Filesystem or Memory"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="mt-1 h-8 text-xs"
                  />
                </div>

                <Tabs
                  value={newTransport}
                  onValueChange={(val) => setNewTransport(val as "stdio" | "sse")}
                >
                  <TabsList className="grid grid-cols-2 h-8">
                    <TabsTrigger value="stdio" className="text-xs">
                      STDIO (Subprocess)
                    </TabsTrigger>
                    <TabsTrigger value="sse" className="text-xs">
                      SSE (Remote HTTP)
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="stdio" className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Command
                      </label>
                      <Input
                        placeholder="e.g. npx, node, python3"
                        value={newCommand}
                        onChange={(e) => setNewCommand(e.target.value)}
                        className="mt-1 h-8 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Arguments (space-separated)
                      </label>
                      <Input
                        placeholder="e.g. -y @modelcontextprotocol/server-filesystem /tmp"
                        value={newArgs}
                        onChange={(e) => setNewArgs(e.target.value)}
                        className="mt-1 h-8 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Environment Variables (optional KEY=VALUE or JSON)
                      </label>
                      <Textarea
                        placeholder="API_KEY=xyz&#10;DEBUG=true"
                        value={newEnv}
                        onChange={(e) => setNewEnv(e.target.value)}
                        className="mt-1 text-xs min-h-[60px]"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="sse" className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        SSE Endpoint URL
                      </label>
                      <Input
                        placeholder="e.g. http://localhost:8000/sse"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        className="mt-1 h-8 text-xs"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Test connection feedback */}
                {testResult && (
                  <div
                    className={cn(
                      "p-3 rounded-lg text-xs border",
                      testResult.success
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                        : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                    )}
                  >
                    {testResult.success ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>
                          Connection successful! Discovered {testResult.tools?.length || 0} tools.
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{testResult.error || "Connection test failed"}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection()}
                    disabled={testing || !newName || (newTransport === "stdio" ? !newCommand : !newUrl)}
                    className="text-xs h-8"
                  >
                    {testing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Testing...
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddServer}
                    disabled={loading || !newName || (newTransport === "stdio" ? !newCommand : !newUrl)}
                    className="text-xs h-8"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Saving...
                      </>
                    ) : (
                      "Save Server"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            servers.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddForm(true);
                  setTestResult(null);
                }}
                className="w-full gap-1.5 text-xs border-dashed"
              >
                <Plus className="w-4 h-4" />
                Add Another MCP Server
              </Button>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
