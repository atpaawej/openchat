import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
          "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:text-zinc-100",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
