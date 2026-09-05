import type { Tool } from "ai";
import type { OpenChatSettings } from "@/features/settings/config-file";

export type CoreTool = Tool;

export interface PluginDefinition {
  id: string;
  name: string;
  description: string;
  createTools(settings?: OpenChatSettings): Record<string, CoreTool>;
}
