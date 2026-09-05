"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MessageBubbleProps {
  content: string;
  className?: string;
}

interface CodeBlockProps {
  language?: string;
  code: string;
}

function CodeBlock({ language = "text", code }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className="relative my-3 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md">
      {/* Code Block Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/80 px-4 py-1.5 text-xs text-zinc-400">
        <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          {language || "code"}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Block Content */}
      <div className="overflow-x-auto p-4 text-xs font-mono leading-relaxed scrollbar-thin">
        <pre className="!m-0 !p-0 bg-transparent">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

export function MessageBubble({ content, className }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "prose prose-zinc dark:prose-invert max-w-none text-sm leading-relaxed",
        "break-words space-y-3",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || "");
            const codeString = String(children);
            const isBlock = match || codeString.includes("\n");

            if (!isBlock) {
              return (
                <code
                  className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[13px] text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/60"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock
                language={match ? match[1] : "text"}
                code={codeString.replace(/\n$/, "")}
              />
            );
          },
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs border-collapse">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 font-semibold text-zinc-900 dark:text-zinc-100">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border-b border-zinc-100 dark:border-zinc-800/60 px-3 py-2 text-zinc-700 dark:text-zinc-300">
                {children}
              </td>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:opacity-80 transition-opacity font-medium"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
