"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn, iconButton, text } from "./styles";

interface CodeBlockProps {
  code: string;
  className?: string;
}

/** Plain, unhighlighted code display with copy support. */
export function CodeBlock({ code, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <div className={cn("relative group h-full flex flex-col", className)}>
      <pre
        className={cn(
          "w-full h-full overflow-auto rounded-[12px] border p-4 pr-9 text-[12px] leading-[1.4]",
          "border-[color:var(--lp-border)] bg-[var(--lp-chrome-bg)]",
          text.soft,
        )}
      >
        <code className="font-mono whitespace-pre">{code}</code>
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className={iconButton(copied ? "primary" : "subtle", "sm", "absolute right-2 top-2")}
        aria-label={copied ? "Copied" : "Copy code"}
        title={copied ? "Copied" : "Copy"}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </div>
  );
}
