"use client";

import * as React from "react";
import { useAutosizeTextarea } from "../hooks/use-autosize";
import { cn } from "@/lib/utils";

export interface ComposerTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onPasteFiles?: (files: FileList) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
}

export const ComposerTextarea = React.forwardRef<
  HTMLTextAreaElement,
  ComposerTextareaProps
>(function ComposerTextarea(
  {
    value,
    onChange,
    onSubmit,
    onPasteFiles,
    placeholder = "Ask anything...",
    disabled = false,
    minHeight = 44,
    maxHeight = 240,
    className,
  },
  forwardedRef
) {
  const localRef = React.useRef<HTMLTextAreaElement>(null);
  const textareaRef = (forwardedRef as React.RefObject<HTMLTextAreaElement | null>) || localRef;

  useAutosizeTextarea(textareaRef, value, { minHeight, maxHeight });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If IME composition is active (e.g. Chinese/Japanese/Korean input), don't trigger submit
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      onPasteFiles?.(e.clipboardData.files);
    }
  };

  return (
    <textarea
      ref={textareaRef as any}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder={placeholder}
      disabled={disabled}
      rows={1}
      className={cn(
        "w-full resize-none bg-transparent px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100",
        "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
        "focus:outline-none focus-visible:outline-none border-0",
        "leading-relaxed scrollbar-thin",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={{ minHeight: `${minHeight}px` }}
    />
  );
});
