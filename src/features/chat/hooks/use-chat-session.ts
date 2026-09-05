"use client";

import * as React from "react";
import type { ChatMessage, CitationItem, ToolCallItem } from "../types";
import type { ComposerAttachment } from "@/features/composer/types";
import { useBranching } from "./use-branching";

export interface SendMessageOptions {
  prompt: string;
  attachments?: ComposerAttachment[];
  modelId: string;
  providerId?: string;
  webSearchEnabled?: boolean;
  searchEngine?: string;
  reasoningEnabled?: boolean;
  parentMessageId?: string | null;
}

export interface UseChatSessionOptions {
  initialSessionId?: string;
  initialMessages?: ChatMessage[];
}

export function useChatSession(options: UseChatSessionOptions = {}) {
  const [sessionId, setSessionId] = React.useState<string>(() => {
    return options.initialSessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  });
  const [messages, setMessages] = React.useState<ChatMessage[]>(options.initialMessages || []);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const abortControllerRef = React.useRef<AbortController | null>(null);

  const branching = useBranching(messages);

  // Load history when sessionId changes if needed
  const loadHistory = React.useCallback(async (sId: string) => {
    try {
      const res = await fetch(`/api/chat/history?sessionId=${encodeURIComponent(sId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
          setSessionId(sId);
        }
      }
    } catch (err) {
      console.error("Failed to load session history:", err);
    }
  }, []);

  const stopGeneration = React.useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  const sendMessage = React.useCallback(
    async (sendOpts: SendMessageOptions) => {
      if (isGenerating) return;

      setError(null);
      setIsGenerating(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Determine parentMessageId: if not provided, take the latest active message ID
      const parentId =
        sendOpts.parentMessageId !== undefined
          ? sendOpts.parentMessageId
          : branching.activeLeafId;

      const userMsgId = `temp_user_${Date.now()}`;
      const asstMsgId = `temp_asst_${Date.now()}`;

      // Optimistic user message
      const optimisticUserMsg: ChatMessage = {
        id: userMsgId,
        sessionId,
        parentId: parentId ?? null,
        role: "user",
        content: sendOpts.prompt,
        createdAt: Date.now(),
      };

      // Optimistic assistant message placeholder
      const optimisticAsstMsg: ChatMessage = {
        id: asstMsgId,
        sessionId,
        parentId: userMsgId,
        role: "assistant",
        content: "",
        reasoning: sendOpts.reasoningEnabled ? "" : null,
        createdAt: Date.now() + 1,
      };

      setMessages((prev) => [...prev, optimisticUserMsg, optimisticAsstMsg]);
      branching.setActiveLeafId(asstMsgId);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            sessionId,
            parentMessageId: parentId,
            prompt: sendOpts.prompt,
            attachments: sendOpts.attachments,
            modelId: sendOpts.modelId,
            providerId: sendOpts.providerId,
            webSearchEnabled: sendOpts.webSearchEnabled,
            searchEngine: sendOpts.searchEngine,
            reasoningEnabled: sendOpts.reasoningEnabled,
          }),
        });

        if (!res.ok || !res.body) {
          const errText = await res.text();
          throw new Error(errText || `Server returned error ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        let accumulatedContent = "";
        let accumulatedReasoning = "";
        let accumulatedCitations: CitationItem[] = [];
        let accumulatedToolCalls: ToolCallItem[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const jsonStr = trimmed.slice(5).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const data = JSON.parse(jsonStr);

              if (data.type === "text-delta") {
                accumulatedContent += data.delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === asstMsgId ? { ...m, content: accumulatedContent } : m
                  )
                );
              } else if (data.type === "reasoning-delta") {
                accumulatedReasoning += data.delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === asstMsgId
                      ? { ...m, reasoning: accumulatedReasoning }
                      : m
                  )
                );
              } else if (data.type === "citations") {
                accumulatedCitations = data.citations;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === asstMsgId
                      ? { ...m, citations: accumulatedCitations }
                      : m
                  )
                );
              } else if (data.type === "tool-call") {
                accumulatedToolCalls.push(data.toolCall);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === asstMsgId
                      ? { ...m, toolCalls: [...accumulatedToolCalls] }
                      : m
                  )
                );
              } else if (data.type === "finish") {
                // Update final message IDs and content from server
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id === userMsgId && data.userMessageId) {
                      return { ...m, id: data.userMessageId };
                    }
                    if (m.id === asstMsgId) {
                      return {
                        ...m,
                        id: data.assistantMessageId || asstMsgId,
                        content: data.finalContent || accumulatedContent,
                        reasoning: data.reasoning ?? accumulatedReasoning,
                        citations: data.citations ?? accumulatedCitations,
                        toolCalls: data.toolCalls ?? accumulatedToolCalls,
                      };
                    }
                    return m;
                  })
                );
                if (data.assistantMessageId) {
                  branching.setActiveLeafId(data.assistantMessageId);
                }
              }
            } catch {
              // Ignore partial JSON parsing errors in line buffer
            }
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          // User aborted generation, preserve what was generated
          console.log("Chat generation stopped by user.");
        } else {
          console.error("Chat generation failed:", err);
          setError(err.message || "Failed to generate response");
        }
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    },
    [sessionId, isGenerating, branching]
  );

  const editMessage = React.useCallback(
    async (
      messageId: string,
      newContent: string,
      modelConfig?: { modelId: string; providerId?: string; webSearchEnabled?: boolean; reasoningEnabled?: boolean }
    ) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return;

      await sendMessage({
        prompt: newContent,
        parentMessageId: msg.parentId ?? null,
        modelId: modelConfig?.modelId || "gpt-4o",
        providerId: modelConfig?.providerId,
        webSearchEnabled: modelConfig?.webSearchEnabled,
        reasoningEnabled: modelConfig?.reasoningEnabled,
      });
    },
    [messages, sendMessage]
  );

  const regenerateMessage = React.useCallback(
    async (
      assistantMessageId: string,
      modelConfig?: { modelId: string; providerId?: string; webSearchEnabled?: boolean; reasoningEnabled?: boolean }
    ) => {
      const asstMsg = messages.find((m) => m.id === assistantMessageId);
      if (!asstMsg) return;

      const userParent = messages.find((m) => m.id === asstMsg.parentId);
      if (!userParent) return;

      // Submit new assistant response from the same user parent
      await sendMessage({
        prompt: userParent.content,
        parentMessageId: userParent.parentId ?? null,
        modelId: modelConfig?.modelId || "gpt-4o",
        providerId: modelConfig?.providerId,
        webSearchEnabled: modelConfig?.webSearchEnabled,
        reasoningEnabled: modelConfig?.reasoningEnabled,
      });
    },
    [messages, sendMessage]
  );

  return {
    sessionId,
    messages,
    activeBranchMessages: branching.activeBranchMessages,
    isGenerating,
    error,
    sendMessage,
    editMessage,
    regenerateMessage,
    stopGeneration,
    loadHistory,
    getBranchInfo: branching.getBranchInfo,
    switchBranch: branching.switchBranch,
    activeLeafId: branching.activeLeafId,
  };
}
