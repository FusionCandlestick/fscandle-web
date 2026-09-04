"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Reveal } from "../Reveal";
import { cn, surface, text } from "../styles";
import { FAQ_ITEMS } from "../faq-data";

export function FAQSection({ className }: { className?: string }) {
  const [openSet, setOpenSet] = useState<Set<number>>(() => new Set());

  const toggleItem = (index: number) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <Reveal className={cn("w-full", className)}>
      <section
        id="faq"
        aria-labelledby="faq-heading"
        className={cn(
          "w-full rounded-2xl p-2 min-[1000px]:p-4 transition-all duration-300",
          surface.glass,
          "border border-[color:var(--lp-border)] shadow-xl",
        )}
      >
        {/* Header (Left-aligned & Minimal) */}
        <div className="text-left mb-2 sm:mb-4">
          <h2 id="faq-heading" className={cn("text-[24px] font-extrabold leading-[1.2] tracking-[-0.02em]", text.main)}>
            Frequently Asked Questions
          </h2>
          <p className={cn("mt-1 text-xs max-w-2xl", text.muted)}>
            Everything you need to know about integrating, customizing, and scaling with the FusionCandlestick Canvas engine.
          </p>
        </div>

        {/* 2-Column Accordion Grid with Unified Question Heights */}
        <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-2 min-[1000px]:gap-4 items-start">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openSet.has(index);
            return (
              <div
                key={item.question}
                className={cn(
                  "rounded-xl border transition-all duration-200 overflow-hidden",
                  isOpen
                    ? "border-blue-500/40 bg-[var(--lp-control-bg)] shadow-md"
                    : "border-[color:var(--lp-border)] bg-[var(--lp-chrome-bg)] hover:border-[color:var(--lp-border-strong)]",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(index)}
                  className="flex min-h-[54px] w-full items-center justify-between gap-2 px-3 py-2 text-left outline-none transition-colors hover:bg-[var(--lp-control-hover-bg)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--lp-focus-ring)] sm:min-h-[50px] sm:px-4"
                  aria-expanded={isOpen}
                >
                  <span className={cn("text-[12px] font-semibold leading-[1.2] line-clamp-2", text.main)}>
                    {item.question}
                  </span>
                  <span
                    className={cn(
                      "p-1 rounded-lg transition-transform duration-200 shrink-0",
                      isOpen ? "rotate-180 text-blue-400 bg-blue-500/10" : "text-[color:var(--lp-text-muted)]",
                    )}
                  >
                    <ChevronDown size={14} />
                  </span>
                </button>

                {isOpen && (
                  <div className="px-3.5 sm:px-4 pb-3 pt-1 text-[12px] leading-[1.4] border-t border-[color:var(--lp-border)] text-[color:var(--lp-text-muted)]">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </Reveal>
  );
}
