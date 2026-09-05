import type { PluginDefinition, CoreTool } from "./types";
import { urlReaderPlugin } from "./builtins/url-reader";
import { calculatorPlugin } from "./builtins/calculator";
import type { OpenChatSettings } from "@/features/settings/config-file";

export class PluginRegistry {
  private plugins = new Map<string, PluginDefinition>();

  constructor() {
    this.registerPlugin(urlReaderPlugin);
    this.registerPlugin(calculatorPlugin);
  }

  registerPlugin(plugin: PluginDefinition): void {
    this.plugins.set(plugin.id, plugin);
  }

  getPlugin(id: string): PluginDefinition | undefined {
    return this.plugins.get(id);
  }

  listPlugins(): PluginDefinition[] {
    return Array.from(this.plugins.values());
  }

  getAllTools(settings?: OpenChatSettings): Record<string, CoreTool> {
    const tools: Record<string, CoreTool> = {};
    for (const plugin of this.plugins.values()) {
      try {
        const pluginTools = plugin.createTools(settings);
        Object.assign(tools, pluginTools);
      } catch (error) {
        console.warn(`[PluginRegistry] Failed to create tools for plugin ${plugin.id}:`, error);
      }
    }
    return tools;
  }
}

export const pluginRegistry = new PluginRegistry();
