"use client";

import * as React from "react";
import {
  Bot,
  User,
  Pencil,
  Copy,
  Check,
  RotateCw,
  X,
  ArrowUp,
} from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { ThinkingBlock } from "./thinking-block";
import { CitationPills } from "./citation-pills";
import { BranchNavigator } from "./branch-navigator";
import type { ChatMessage, BranchInfo } from "../types";
import { cn } from "@/lib/utils";

export interface MessageItemProps {
  message: ChatMessage;
  branchInfo?: BranchInfo;
  onSwitchBranch?: (direction: "prev" | "next") => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onRegenerate?: (messageId: string) => void;
  isStreaming?: boolean;
  isLast?: boolean;
  className?: string;
}

export function MessageItem({
  message,
  branchInfo,
  onSwitchBranch,
  onEdit,
  onRegenerate,
  isStreaming = false,
  isLast = false,
  className,
}: MessageItemProps) {
  const isUser = message.role === "user";
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(message.content);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  const handleSaveEdit = () => {
    if (!editContent.trim() || editContent.trim() === message.content) {
      setIsEditing(false);
      return;
    }
    onEdit?.(message.id, editContent.trim());
    setIsEditing(false);
  };

  if (isUser) {
    return (
      <div className={cn("group flex flex-col items-end gap-1.5 my-4 px-4", className)}>
        {/* User Bubble or Inline Edit */}
        {isEditing ? (
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 shadow-lg">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full resize-none bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none leading-relaxed"
              rows={3}
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setEditContent(message.content);
                  setIsEditing(false);
                }}
                className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editContent.trim()}
                className="inline-flex items-center gap-1 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-medium text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
              >
                <ArrowUp className="h-3.5 w-3.5" />
                <span>Save & Submit</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-end">
            <div className="max-w-2xl rounded-3xl bg-zinc-100 dark:bg-zinc-800/80 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 shadow-xs leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>

            {/* User Action Bar & Branch Navigator */}
            <div className="flex items-center gap-2 mt-1 px-1 text-zinc-400">
              {branchInfo && onSwitchBranch && (
                <BranchNavigator
                  branchInfo={branchInfo}
                  onSwitchBranch={onSwitchBranch}
                />
              )}

              {onEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit message"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  title="Edit prompt"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy prompt"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title="Copy prompt"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Assistant Turn
  return (
    <div className={cn("group flex items-start gap-3 my-4 px-4 max-w-3xl", className)}>
      {/* Bot Avatar */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs mt-0.5">
        <Bot className="h-4 w-4 text-zinc-800 dark:text-zinc-200" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Thinking Block */}
        {message.reasoning && (
          <ThinkingBlock
            thinking={message.reasoning}
            isStreaming={isStreaming && isLast}
          />
        )}

        {/* Citations Card / Pills */}
        {message.citations && (
          <CitationPills citations={message.citations} />
        )}

        {/* Message Content Bubble */}
        <MessageBubble content={message.content} />

        {/* Assistant Action Bar & Branch Navigator */}
        <div className="flex items-center gap-2 mt-2 pt-1 text-zinc-400">
          {branchInfo && onSwitchBranch && (
            <BranchNavigator
              branchInfo={branchInfo}
              onSwitchBranch={onSwitchBranch}
            />
          )}

          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy response"
            className="p-1 rounded-md hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Copy response"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>

          {onRegenerate && !isStreaming && (
            <button
              type="button"
              onClick={() => onRegenerate(message.id)}
              aria-label="Regenerate response"
              className="p-1 rounded-md hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Regenerate response"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
