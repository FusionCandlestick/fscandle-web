"use client";

import type { ReactNode } from "react";

import { useInView } from "./hooks/useInView";
import { cn } from "./styles";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger successive reveals within the same section. */
  delayMs?: number;
}

/**
 * Fade-up-on-scroll wrapper. Markup never starts at `opacity: 0` in a way JS
 * failing to run would hide permanently — `useInView` degrades to
 * `inView: true` immediately when IntersectionObserver isn't available, and
 * the CSS-only reduced-motion override in `landing.css` is a second
 * backstop.
 */
export function Reveal({ children, className, delayMs = 0 }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "0px 0px -80px 0px" });

  return (
    <div
      ref={ref}
      className={cn("lp-will-reveal", inView && "lp-is-visible", className)}
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
