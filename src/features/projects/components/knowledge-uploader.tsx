"use client";

import * as React from "react";
import { UploadCloud, FileText, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectFile } from "../types";

export interface KnowledgeUploaderProps {
  projectId: string;
  files: ProjectFile[];
  onFilesChanged?: () => void;
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function KnowledgeUploader({
  projectId,
  files,
  onFilesChanged,
}: KnowledgeUploaderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]!;
        const text = await file.text();
        const res = await fetch(`/api/projects/${projectId}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            content: text,
            size: file.size,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Failed to upload ${file.name}`);
        }
      }

      onFilesChanged?.();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId);
    try {
      const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onFilesChanged?.();
      }
    } catch (err) {
      console.error("Failed to delete file:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Drag Target */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer",
          isDragging
            ? "border-amber-500 bg-amber-500/10 text-amber-200"
            : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80 text-zinc-400"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
            <span className="text-xs text-zinc-300">Uploading documents...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 shadow-xs">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-200">
                Click to upload or drag and drop
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Markdown, TXT, JSON, code, or documentation files
              </p>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="rounded-lg bg-red-950/40 border border-red-800/80 p-2.5 text-xs text-red-300">
          {uploadError}
        </div>
      )}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 px-1">
            Attached Files ({files.length})
          </div>
          <div className="divide-y divide-zinc-800/60 rounded-xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden pr-2">
                  <FileText className="h-4 w-4 shrink-0 text-amber-400/80" />
                  <span className="truncate font-medium">{file.filename}</span>
                  <span className="shrink-0 text-[10px] text-zinc-500">
                    ({formatBytes(file.size)})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(file.id)}
                  disabled={deletingId === file.id}
                  title="Delete file"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                >
                  {deletingId === file.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
