import { z } from "zod";

export type McpTransport = "stdio" | "sse";

export const McpServerConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  transport: z.enum(["stdio", "sse"]).default("stdio"),
  command: z.string().optional(),
  args: z.array(z.string()).default([]),
  url: z.string().optional(),
  env: z.record(z.string(), z.string()).default({}),
  enabled: z.boolean().default(true),
  type: z.enum(["stdio", "sse"]).optional(),
});

export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;

export const McpToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  inputSchema: z.record(z.string(), z.any()),
  serverId: z.string(),
});

export type McpToolDefinition = z.infer<typeof McpToolDefinitionSchema>;

export const McpServerStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["connected", "disconnected", "connecting", "error"]),
  error: z.string().optional(),
  tools: z.array(McpToolDefinitionSchema).default([]),
});

export type McpServerStatus = z.infer<typeof McpServerStatusSchema>;
