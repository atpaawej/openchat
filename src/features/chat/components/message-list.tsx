"use client";

import * as React from "react";
import { MessageItem } from "./message-item";
import type { ChatMessage, BranchInfo } from "../types";

export interface MessageListProps {
  messages: ChatMessage[];
  getBranchInfo: (messageId: string) => BranchInfo;
  onSwitchBranch: (messageId: string, direction: "prev" | "next") => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onRegenerate?: (messageId: string) => void;
  isStreaming?: boolean;
}

export function MessageList({
  messages,
  getBranchInfo,
  onSwitchBranch,
  onEdit,
  onRegenerate,
  isStreaming = false,
}: MessageListProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col space-y-2">
      {messages.map((msg, index) => {
        const isLast = index === messages.length - 1;
        const branchInfo = getBranchInfo(msg.id);

        return (
          <MessageItem
            key={msg.id}
            message={msg}
            branchInfo={branchInfo}
            onSwitchBranch={(direction) => onSwitchBranch(msg.id, direction)}
            onEdit={onEdit}
            onRegenerate={onRegenerate}
            isStreaming={isStreaming}
            isLast={isLast}
          />
        );
      })}
    </div>
  );
}
