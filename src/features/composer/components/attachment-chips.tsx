"use client";

import * as React from "react";
import { FileText, FileCode, File, Image as ImageIcon, X } from "lucide-react";
import type { ComposerAttachment } from "../types";
import { cn } from "@/lib/utils";

export interface AttachmentChipsProps {
  attachments: ComposerAttachment[];
  onRemove: (id: string) => void;
  className?: string;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(att: ComposerAttachment) {
  if (att.isImage) return <ImageIcon className="h-4 w-4 text-emerald-500" />;
  if (att.name.endsWith(".json") || att.name.endsWith(".ts") || att.name.endsWith(".js") || att.name.endsWith(".py")) {
    return <FileCode className="h-4 w-4 text-blue-500" />;
  }
  if (att.type.includes("text") || att.name.endsWith(".md") || att.name.endsWith(".txt")) {
    return <FileText className="h-4 w-4 text-amber-500" />;
  }
  return <File className="h-4 w-4 text-zinc-500" />;
}

export function AttachmentChips({
  attachments,
  onRemove,
  className,
  disabled = false,
}: AttachmentChipsProps) {
  if (attachments.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2 px-3 pt-2 pb-1", className)}>
      {attachments.map((att) => (
        <div
          key={att.id}
          className={cn(
            "group relative flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800",
            "bg-zinc-100/80 dark:bg-zinc-800/60 p-1.5 pr-2 text-xs transition-all shadow-xs",
            "hover:border-zinc-300 dark:hover:border-zinc-700"
          )}
        >
          {att.previewUrl ? (
            <img
              src={att.previewUrl}
              alt={att.name}
              className="h-9 w-9 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-200/60 dark:bg-zinc-700/50">
              {getFileIcon(att)}
            </div>
          )}

          <div className="flex flex-col min-w-0 max-w-[140px]">
            <span className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
              {att.name}
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {formatFileSize(att.size)}
            </span>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={() => onRemove(att.id)}
              className={cn(
                "ml-1 flex h-5 w-5 items-center justify-center rounded-full text-zinc-400",
                "hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-200",
                "transition-colors"
              )}
              title="Remove attachment"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
