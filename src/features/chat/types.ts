import type { ComposerAttachment } from "@/features/composer/types";

export type MessageRole = "system" | "user" | "assistant" | "data";

export interface CitationItem {
  title: string;
  url: string;
  snippet?: string;
  favicon?: string;
}

export interface ToolCallItem {
  id: string;
  name: string;
  args?: Record<string, any>;
  result?: any;
  state?: "pending" | "running" | "complete" | "error";
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  parentId?: string | null;
  role: MessageRole;
  content: string;
  reasoning?: string | null;
  toolCalls?: ToolCallItem[] | string | null;
  citations?: CitationItem[] | string | null;
  createdAt: number;
}

export interface ChatTurnRequest {
  messages?: Array<{
    id?: string;
    role: "system" | "user" | "assistant" | "data";
    content: string;
  }>;
  prompt?: string;
  modelId: string;
  providerId?: string;
  sessionId: string;
  parentMessageId?: string | null;
  webSearchEnabled?: boolean;
  searchEngine?: string;
  reasoningEnabled?: boolean;
  attachments?: ComposerAttachment[];
}

export interface BranchInfo {
  messageId: string;
  currentIndex: number;
  totalCount: number;
  siblingIds: string[];
}
