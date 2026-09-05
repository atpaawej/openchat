import { tool, jsonSchema, type Tool } from "ai";
import { z } from "zod";
import type { McpToolDefinition } from "./types";
import type { McpClientManager } from "./client-manager";

export type CoreTool = Tool;

/**
 * Normalizes an MCP inputSchema to guarantee a valid JSONSchema object.
 */
export function normalizeJsonSchema(schema: Record<string, any> = {}): Record<string, any> {
  const normalized: Record<string, any> = { ...schema };
  if (!normalized.type && (normalized.properties || normalized.required)) {
    normalized.type = "object";
  }
  if (normalized.type === "object" && !normalized.properties) {
    normalized.properties = {};
  }
  return normalized;
}

/**
 * Converts a JSONSchema object into an equivalent Zod schema.
 * Handles primitives, enums, arrays, nested objects, and required fields.
 */
export function jsonSchemaToZod(schema: Record<string, any> = {}): z.ZodTypeAny {
  if (!schema || typeof schema !== "object" || Object.keys(schema).length === 0) {
    return z.object({});
  }

  const type = schema.type;
  let zodType: z.ZodTypeAny;

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    zodType = z.enum(schema.enum as [string, ...string[]]);
  } else if (type === "string") {
    zodType = z.string();
  } else if (type === "number" || type === "integer") {
    zodType = z.number();
  } else if (type === "boolean") {
    zodType = z.boolean();
  } else if (type === "array") {
    const itemSchema = schema.items ? jsonSchemaToZod(schema.items) : z.any();
    zodType = z.array(itemSchema);
  } else if (type === "object" || schema.properties) {
    const shape: Record<string, z.ZodTypeAny> = {};
    const required = new Set(Array.isArray(schema.required) ? schema.required : []);
    const props = schema.properties || {};

    for (const [key, propSchema] of Object.entries(props)) {
      let field = jsonSchemaToZod(propSchema as Record<string, any>);
      if (!required.has(key)) {
        field = field.optional();
      }
      shape[key] = field;
    }
    zodType = z.object(shape);
  } else {
    zodType = z.any();
  }

  if (schema.description && typeof schema.description === "string") {
    zodType = zodType.describe(schema.description);
  }

  return zodType;
}

/**
 * Converts an array of McpToolDefinitions into a dictionary of AI SDK CoreTools
 * ready to be passed directly to streamText({ tools }).
 */
export function convertMcpToolsToAiSdkTools(
  mcpTools: McpToolDefinition[],
  clientManager: McpClientManager
): Record<string, CoreTool> {
  const tools: Record<string, CoreTool> = {};

  for (const mcpTool of mcpTools) {
    // If tool name already exists from another server, prefix with serverId
    const toolKey = tools[mcpTool.name] ? `${mcpTool.serverId}_${mcpTool.name}` : mcpTool.name;

    const normalizedSchema = normalizeJsonSchema(mcpTool.inputSchema);
    const zodSchema = jsonSchemaToZod(normalizedSchema);

    // AI SDK tool definition
    const aiTool = tool({
      description: mcpTool.description || `MCP Tool "${mcpTool.name}" from server "${mcpTool.serverId}"`,
      inputSchema: jsonSchema(normalizedSchema),
      execute: async (args: any) => {
        try {
          const result = await clientManager.callTool(
            mcpTool.serverId,
            mcpTool.name,
            args ?? {}
          );
          return result;
        } catch (error) {
          return {
            isError: true,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    });

    // Provide parameters alias for backward compatibility with v3/v4 consumers
    (aiTool as any).parameters = (aiTool as any).inputSchema;

    tools[toolKey] = aiTool as CoreTool;
  }

  return tools;
}
