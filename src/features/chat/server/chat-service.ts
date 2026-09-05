import { streamText, isStepCount } from "ai";
import { providerRegistry } from "@/features/providers/registry";
import { createWebSearchTool } from "@/features/web-search/tool";
import { mcpClientManager } from "@/features/mcp/client-manager";
import { convertMcpToolsToAiSdkTools } from "@/features/mcp/tool-adapter";
import { pluginRegistry } from "@/features/plugins/registry";
import { loadSettings, type OpenChatSettings } from "@/features/settings/config-file";
import { messageRepository } from "./message-repository";
import { projectRepository } from "@/features/projects/server/project-repository";
import type { ChatTurnRequest, CitationItem, ToolCallItem } from "../types";

export interface ParsedReasoning {
  reasoning: string | null;
  content: string;
}

export function parseReasoningAndContent(raw: string): ParsedReasoning {
  const thinkRegex = /<think>([\s\S]*?)(?:<\/think>|$)/;
  const match = raw.match(thinkRegex);
  if (!match) {
    return { reasoning: null, content: raw };
  }
  const reasoning = match[1]?.trim() ?? null;
  const content = raw.replace(/<think>[\s\S]*?(?:<\/think>|$)/, "").trim();
  return { reasoning, content };
}

export class ChatService {
  /**
   * Resolves and aggregates all tools for the chat turn:
   * 1. Web Search tool (if enabled)
   * 2. Active MCP tools (from connected MCP servers)
   * 3. Built-in plugins (Calculator, URL Reader)
   */
  async resolveTools(
    options: {
      webSearchEnabled?: boolean;
      searchEngine?: string;
    },
    settings?: OpenChatSettings
  ): Promise<Record<string, any>> {
    const currentSettings = settings ?? loadSettings();
    const tools: Record<string, any> = {};

    // 1. Web Search
    if (options.webSearchEnabled) {
      const engine = (options.searchEngine as any) || currentSettings.activeSearchProvider || "duckduckgo";
      tools.webSearch = createWebSearchTool(engine, currentSettings);
    }

    // 2. Active MCP Tools
    try {
      const activeMcpTools = await mcpClientManager.listTools();
      if (activeMcpTools && activeMcpTools.length > 0) {
        const mcpAiTools = convertMcpToolsToAiSdkTools(activeMcpTools, mcpClientManager);
        Object.assign(tools, mcpAiTools);
      }
    } catch (err) {
      console.warn("[ChatService] Failed to load MCP tools:", err);
    }

    // 3. Built-in Plugins
    try {
      const pluginTools = pluginRegistry.getAllTools(currentSettings);
      Object.assign(tools, pluginTools);
    } catch (err) {
      console.warn("[ChatService] Failed to load plugin tools:", err);
    }

    return tools;
  }

  /**
   * Builds the conversation history array for AI SDK streamText.
   */
  prepareCoreMessages(request: ChatTurnRequest): any[] {
    const coreMessages: any[] = [];

    // If explicit messages provided, use them
    if (request.messages && request.messages.length > 0) {
      for (const m of request.messages) {
        coreMessages.push({
          role: m.role,
          content: m.content,
        });
      }
    } else if (request.sessionId) {
      // Reconstruct from branch history in database
      const branchMessages = messageRepository.getLinearBranch(
        request.sessionId,
        request.parentMessageId
      );
      for (const m of branchMessages) {
        coreMessages.push({
          role: m.role,
          content: m.content,
        });
      }
    }

    // Append new user prompt if provided
    if (request.prompt) {
      let fullPromptText = request.prompt;
      const imageParts: any[] = [];

      if (request.attachments && request.attachments.length > 0) {
        for (const att of request.attachments) {
          if (att.isImage && att.content) {
            imageParts.push({
              type: "image",
              image: att.content,
            });
          } else if (att.content) {
            fullPromptText += `\n\n--- Attachment: ${att.name} ---\n${att.content}\n--- End Attachment ---`;
          }
        }
      }

      if (imageParts.length > 0) {
        coreMessages.push({
          role: "user",
          content: [{ type: "text", text: fullPromptText }, ...imageParts],
        });
      } else {
        coreMessages.push({
          role: "user",
          content: fullPromptText,
        });
      }
    }

    return coreMessages;
  }

  /**
   * Executes the chat turn and returns an SSE streaming Response,
   * while saving messages to SQLite upon completion.
   */
  async streamChat(request: ChatTurnRequest, settings?: OpenChatSettings): Promise<Response> {
    const currentSettings = settings ?? loadSettings();
    const {
      sessionId,
      parentMessageId,
      modelId,
      providerId,
      webSearchEnabled,
      searchEngine,
      reasoningEnabled,
    } = request;

    // 1. Resolve Language Model
    const model = providerRegistry.resolveLanguageModel(
      providerId || currentSettings.defaultProvider || "openai",
      modelId || currentSettings.defaultModel || "gpt-4o",
      currentSettings
    );

    // 2. Prepare Tools
    const tools = await this.resolveTools({ webSearchEnabled, searchEngine }, currentSettings);

    // 3. Prepare Messages
    const coreMessages = this.prepareCoreMessages(request);

    // Ensure session exists in SQLite
    let session = messageRepository.getSession(sessionId);
    if (!session) {
      const initialTitle =
        request.prompt && request.prompt.length > 0
          ? request.prompt.slice(0, 40) + (request.prompt.length > 40 ? "..." : "")
          : "New Chat";

      session = messageRepository.createSession({
        id: sessionId,
        title: initialTitle,
        model: modelId,
        provider: providerId || currentSettings.defaultProvider || "openai",
        projectId: request.projectId ?? null,
      });
    }

    // Create User Message ID and Assistant Message ID
    const userMessageId = `msg_user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const assistantMessageId = `msg_asst_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Save user message to database immediately
    let userMessageContent = request.prompt || "";
    if (request.attachments && request.attachments.length > 0) {
      for (const att of request.attachments) {
        if (!att.isImage && att.content) {
          userMessageContent += `\n\n[Attached file: ${att.name}]\n${att.content}`;
        } else if (att.isImage) {
          userMessageContent += `\n\n[Attached image: ${att.name}]`;
        }
      }
    }

    if (request.prompt) {
      messageRepository.saveMessage({
        id: userMessageId,
        sessionId,
        parentId: parentMessageId ?? null,
        role: "user",
        content: userMessageContent,
        createdAt: new Date(),
      });
    }

    // Prepare system prompt: reasoning instruction + global system prompt + project custom instructions
    let baseSystemPrompt = reasoningEnabled
      ? "You are OpenChat, an intelligent AI assistant. You reason deeply step by step inside <think>...</think> tags when considering complex problems, before providing your final answer."
      : "You are OpenChat, a helpful, precise, and capable AI assistant.";

    const globalPrompt = (currentSettings as any).systemPrompt;
    if (globalPrompt && typeof globalPrompt === "string" && globalPrompt.trim()) {
      baseSystemPrompt += `\n\n${globalPrompt.trim()}`;
    }

    const effectiveProjectId = request.projectId || session?.projectId;
    if (effectiveProjectId) {
      const projectKnowledge = projectRepository.getProjectKnowledgePrompt(effectiveProjectId);
      if (projectKnowledge && projectKnowledge.trim()) {
        baseSystemPrompt += `\n\n${projectKnowledge.trim()}`;
      }
    }

    // Call streamText
    const toolCount = Object.keys(tools).length;
    const streamResult = streamText({
      model,
      messages: coreMessages,
      tools: toolCount > 0 ? tools : undefined,
      stopWhen: isStepCount(toolCount > 0 ? 5 : 1),
      system: baseSystemPrompt,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullAccumulatedText = "";
        let explicitReasoning = "";
        const collectedCitations: CitationItem[] = [];
        const collectedToolCalls: ToolCallItem[] = [];

        try {
          for await (const chunk of (streamResult as any).fullStream) {
            if (chunk.type === "text-delta") {
              const delta = chunk.text || chunk.textDelta || "";
              fullAccumulatedText += delta;

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "text-delta",
                    delta,
                    fullText: fullAccumulatedText,
                  })}\n\n`
                )
              );
            } else if (chunk.type === "reasoning-delta" || chunk.type === "reasoning") {
              const rDelta = chunk.text || chunk.reasoningDelta || chunk.reasoning || "";
              explicitReasoning += rDelta;

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "reasoning-delta",
                    delta: rDelta,
                  })}\n\n`
                )
              );
            } else if (chunk.type === "tool-call") {
              const item: ToolCallItem = {
                id: chunk.toolCallId || `tc_${Date.now()}`,
                name: chunk.toolName,
                args: chunk.args,
                state: "running",
              };
              collectedToolCalls.push(item);

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool-call",
                    toolCall: item,
                  })}\n\n`
                )
              );
            } else if (chunk.type === "tool-result") {
              // Update tool call state
              const found = collectedToolCalls.find((t) => t.name === chunk.toolName);
              if (found) {
                found.result = chunk.result;
                found.state = "complete";
              }

              // Check if web search tool result for citations
              if (chunk.toolName === "webSearch" && chunk.result?.results) {
                const searchResults = chunk.result.results;
                for (const r of searchResults) {
                  collectedCitations.push({
                    title: r.title,
                    url: r.url,
                    snippet: r.snippet,
                    favicon: r.favicon,
                  });
                }

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "citations",
                      citations: collectedCitations,
                    })}\n\n`
                  )
                );
              }
            }
          }

          // Parse in-band <think> blocks if any
          const parsed = parseReasoningAndContent(fullAccumulatedText);
          const finalReasoning = explicitReasoning || parsed.reasoning || null;
          const finalContent = parsed.content || fullAccumulatedText;

          // Save assistant message to SQLite
          messageRepository.saveMessage({
            id: assistantMessageId,
            sessionId,
            parentId: request.prompt ? userMessageId : parentMessageId ?? null,
            role: "assistant",
            content: finalContent,
            reasoning: finalReasoning,
            toolCalls: collectedToolCalls.length > 0 ? collectedToolCalls : null,
            citations: collectedCitations.length > 0 ? collectedCitations : null,
            createdAt: new Date(),
          });

          // Update session timestamp and title
          messageRepository.updateSession(sessionId, {
            updatedAt: new Date(),
            model: modelId,
            provider: providerId || currentSettings.defaultProvider || "openai",
          });

          // Final event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "finish",
                userMessageId: request.prompt ? userMessageId : null,
                assistantMessageId,
                finalContent,
                reasoning: finalReasoning,
                citations: collectedCitations,
                toolCalls: collectedToolCalls,
              })}\n\n`
            )
          );

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("[ChatService] Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: error instanceof Error ? error.message : String(error),
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    const response = new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });

    // Provide toDataStreamResponse alias for API compatibility
    (response as any).toDataStreamResponse = () => response;

    return response;
  }
}

export const chatService = new ChatService();
