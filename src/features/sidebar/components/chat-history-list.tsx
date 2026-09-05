"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatActionsMenu } from "./chat-actions-menu";
import type { GroupedSessions, SessionSummary } from "../types";

export interface ChatHistoryListProps {
  grouped: GroupedSessions[];
  onSessionUpdated?: () => void;
  onSessionDeleted?: (id: string) => void;
}

export function ChatHistoryList({
  grouped,
  onSessionUpdated,
  onSessionDeleted,
}: ChatHistoryListProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleRename = async (id: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        onSessionUpdated?.();
      }
    } catch (err) {
      console.error("Failed to rename session:", err);
    }
  };

  const handleTogglePin = async (id: string, pinned: boolean) => {
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned }),
      });
      if (res.ok) {
        onSessionUpdated?.();
      }
    } catch (err) {
      console.error("Failed to toggle pin session:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onSessionDeleted?.(id);
        if (pathname === `/c/${id}`) {
          router.push("/");
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  if (grouped.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-xs text-zinc-500">
        No chats yet
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      {grouped.map((group) => (
        <div key={group.bucket} className="space-y-1">
          <div className="px-3 text-[11px] font-medium tracking-wider uppercase text-zinc-500 select-none flex items-center gap-1.5">
            {group.bucket === "Pinned" && <Pin className="h-3 w-3 text-zinc-400 rotate-45" />}
            <span>{group.bucket}</span>
          </div>

          <div className="space-y-0.5">
            {group.sessions.map((session) => {
              const isActive = pathname === `/c/${session.id}`;
              return (
                <div
                  key={session.id}
                  className={cn(
                    "group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors",
                    isActive
                      ? "bg-zinc-800 text-zinc-100 font-medium"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                  )}
                >
                  <Link
                    href={`/c/${session.id}`}
                    className="flex flex-1 items-center gap-2 overflow-hidden pr-1"
                    title={session.title}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{session.title}</span>
                  </Link>

                  <div className="flex items-center gap-1 shrink-0">
                    {session.pinned && (
                      <Pin className="h-3 w-3 text-zinc-400 rotate-45 opacity-60 group-hover:hidden" />
                    )}
                    <ChatActionsMenu
                      session={session}
                      onRename={handleRename}
                      onTogglePin={handleTogglePin}
                      onDelete={handleDelete}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
