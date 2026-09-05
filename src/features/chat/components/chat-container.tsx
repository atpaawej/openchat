"use client";

import * as React from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatContainerProps {
  children: React.ReactNode;
  className?: string;
  isStreaming?: boolean;
}

export function ChatContainer({
  children,
  className,
  isStreaming = false,
}: ChatContainerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const bottomSentinelRef = React.useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = React.useState(false);
  const isAtBottomRef = React.useRef(true);

  // Check scroll position
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceToBottom < 80;
    isAtBottomRef.current = atBottom;
    setShowScrollBottom(!atBottom);
  };

  // Auto-scroll when new content arrives if user is pinned to bottom
  React.useEffect(() => {
    if (isAtBottomRef.current) {
      bottomSentinelRef.current?.scrollIntoView({ behavior: isStreaming ? "auto" : "smooth" });
    }
  }, [children, isStreaming]);

  const scrollToBottom = () => {
    bottomSentinelRef.current?.scrollIntoView({ behavior: "smooth" });
    isAtBottomRef.current = true;
    setShowScrollBottom(false);
  };

  return (
    <div className="relative flex-1 h-full min-h-0 w-full overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={cn(
          "h-full w-full overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-thin px-2 sm:px-4 py-6",
          className
        )}
      >
        <div className="mx-auto max-w-3xl space-y-6 pb-32">
          {children}
          <div ref={bottomSentinelRef} className="h-px w-full" />
        </div>
      </div>

      {/* Floating Scroll-to-Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
          className={cn(
            "absolute bottom-28 right-6 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800",
            "bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-200 shadow-lg backdrop-blur-md transition-all duration-200",
            "hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-105 cursor-pointer animate-in fade-in-0 slide-in-from-bottom-2"
          )}
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
