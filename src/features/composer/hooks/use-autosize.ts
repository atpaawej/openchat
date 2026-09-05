import * as React from "react";

export interface UseAutosizeTextareaOptions {
  minHeight?: number;
  maxHeight?: number;
}

export function useAutosizeTextarea(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  options: UseAutosizeTextareaOptions = {}
) {
  const { minHeight = 44, maxHeight = 240 } = options;

  React.useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height temporarily to get accurate scrollHeight
    textarea.style.height = "auto";
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [textareaRef, value, minHeight, maxHeight]);
}
