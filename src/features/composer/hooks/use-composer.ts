"use client";

import * as React from "react";
import type { ComposerAttachment } from "../types";

export function useComposer(initialPrompt = "") {
  const [prompt, setPrompt] = React.useState(initialPrompt);
  const [attachments, setAttachments] = React.useState<ComposerAttachment[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = React.useState(false);

  const addFiles = React.useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsProcessingFiles(true);

    try {
      const readPromises = fileArray.map(async (file): Promise<ComposerAttachment> => {
        const id = `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const isImage = file.type.startsWith("image/");
        const isText =
          file.type.startsWith("text/") ||
          file.name.endsWith(".md") ||
          file.name.endsWith(".json") ||
          file.name.endsWith(".ts") ||
          file.name.endsWith(".tsx") ||
          file.name.endsWith(".js") ||
          file.name.endsWith(".py") ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".csv");

        return new Promise<ComposerAttachment>((resolve, reject) => {
          const reader = new FileReader();

          if (isText) {
            reader.onload = () => {
              resolve({
                id,
                name: file.name,
                type: file.type || "text/plain",
                size: file.size,
                content: reader.result as string,
                isImage: false,
              });
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
          } else {
            reader.onload = () => {
              const dataUrl = reader.result as string;
              resolve({
                id,
                name: file.name,
                type: file.type || "application/octet-stream",
                size: file.size,
                content: dataUrl,
                previewUrl: isImage ? dataUrl : undefined,
                isImage,
              });
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          }
        });
      });

      const newAttachments = await Promise.all(readPromises);
      setAttachments((prev) => [...prev, ...newAttachments]);
    } catch (err) {
      console.error("Failed to read files:", err);
    } finally {
      setIsProcessingFiles(false);
    }
  }, []);

  const removeAttachment = React.useCallback((id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  }, []);

  const clear = React.useCallback(() => {
    setPrompt("");
    setAttachments([]);
  }, []);

  return {
    prompt,
    setPrompt,
    attachments,
    addFiles,
    removeAttachment,
    clear,
    isProcessingFiles,
  };
}
