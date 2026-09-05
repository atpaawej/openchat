"use client";

import * as React from "react";
import { ArrowUp, Square } from "lucide-react";
import { ModelSelector } from "@/features/providers/components/model-selector";
import { SearchToggle } from "@/features/web-search/components/search-toggle";
import { McpToolPill } from "@/features/mcp/components/mcp-tool-pill";
import { ComposerTextarea } from "./composer-textarea";
import { AttachmentChips } from "./attachment-chips";
import { AttachmentButton } from "./attachment-button";
import { ReasonToggle } from "./reason-toggle";
import { useComposer } from "../hooks/use-composer";
import type { ComposerProps } from "../types";
import { cn } from "@/lib/utils";

export function Composer({
  initialPrompt = "",
  selectedModelId,
  selectedProviderId,
  onModelChange,
  onSubmit,
  onStop,
  isGenerating = false,
  webSearchEnabled = false,
  onWebSearchToggle,
  activeSearchEngine = "duckduckgo",
  reasoningEnabled = false,
  onReasoningToggle,
  activeMcpToolCount = 0,
  onMcpClick,
  placeholder = "Message OpenChat...",
  className,
  disabled = false,
}: ComposerProps) {
  const {
    prompt,
    setPrompt,
    attachments,
    addFiles,
    removeAttachment,
    clear,
    isProcessingFiles,
  } = useComposer(initialPrompt);

  const [isDragOver, setIsDragOver] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Focus textarea on mount
  React.useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const canSubmit =
    !isGenerating &&
    !isProcessingFiles &&
    !disabled &&
    (prompt.trim().length > 0 || attachments.length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const payload = {
      prompt: prompt.trim(),
      attachments: [...attachments],
      modelId: selectedModelId,
      providerId: selectedProviderId,
      webSearchEnabled,
      searchEngine: activeSearchEngine,
      reasoningEnabled,
    };

    clear();
    await onSubmit(payload);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative mx-auto w-full max-w-3xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90",
        "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-xl transition-all duration-200",
        "focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:shadow-2xl",
        isDragOver && "ring-2 ring-blue-500 border-blue-500 bg-blue-50/10",
        className
      )}
    >
      {/* Drag & Drop Visual Indicator */}
      {isDragOver && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-blue-500/10 text-xs font-semibold text-blue-600 dark:text-blue-400 backdrop-blur-xs">
          Drop files to attach to message
        </div>
      )}

      {/* Staged Attachments */}
      <AttachmentChips
        attachments={attachments}
        onRemove={removeAttachment}
        disabled={isGenerating || disabled}
      />

      {/* Auto-sizing Textarea */}
      <ComposerTextarea
        ref={textareaRef}
        value={prompt}
        onChange={setPrompt}
        onSubmit={handleSubmit}
        onPasteFiles={addFiles}
        placeholder={placeholder}
        disabled={disabled}
      />

      {/* Bottom Bar Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3 pt-1">
        {/* Left Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Model Selector Pill */}
          <ModelSelector
            currentModelId={selectedModelId}
            currentProviderId={selectedProviderId as any}
            onSelectModel={(modelId, providerId) => {
              onModelChange?.(modelId, providerId);
            }}
            disabled={disabled || isGenerating}
          />

          {/* Web Search Toggle */}
          {onWebSearchToggle && (
            <SearchToggle
              enabled={webSearchEnabled}
              onToggle={onWebSearchToggle}
              activeProvider={activeSearchEngine as any}
              disabled={disabled || isGenerating}
            />
          )}

          {/* Deep Reasoning Toggle */}
          {onReasoningToggle && (
            <ReasonToggle
              enabled={reasoningEnabled}
              onToggle={onReasoningToggle}
              disabled={disabled || isGenerating}
            />
          )}

          {/* File Attachment Trigger */}
          <AttachmentButton
            onFilesSelected={addFiles}
            disabled={disabled || isGenerating || isProcessingFiles}
          />

          {/* Active MCP Tools Pill */}
          {activeMcpToolCount > 0 && (
            <McpToolPill
              count={activeMcpToolCount}
              onClick={onMcpClick}
              className="text-xs"
            />
          )}
        </div>

        {/* Right Action: Send / Stop */}
        <div className="flex items-center ml-auto">
          {isGenerating ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop generation"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
                "hover:opacity-90 transition-opacity shadow-sm"
              )}
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              aria-label="Send message"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
                canSubmit
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-sm scale-100 cursor-pointer"
                  : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed scale-95"
              )}
            >
              <ArrowUp className="h-4 w-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
