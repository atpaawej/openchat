"use client";

import * as React from "react";
import { Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/lib/ui/tooltip";

export interface AttachmentButtonProps {
  onFilesSelected: (files: FileList) => void;
  disabled?: boolean;
  className?: string;
}

export function AttachmentButton({
  onFilesSelected,
  disabled = false,
  className,
}: AttachmentButtonProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      // Reset input value so selecting the same file again triggers change
      e.target.value = "";
    }
  };

  const button = (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label="Attach files or images"
      className={cn(
        "inline-flex items-center justify-center h-8 w-8 rounded-full text-zinc-500 dark:text-zinc-400",
        "hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Paperclip className="h-4 w-4" />
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,text/*,application/pdf,.json,.md,.txt,.py,.ts,.tsx,.js,.jsx"
        onChange={handleChange}
        className="hidden"
        tabIndex={-1}
      />
    </button>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Attach files or images
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
