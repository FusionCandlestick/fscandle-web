/**
 * Landing-only class vocabulary — same shape as `../ui/styles.ts` so the
 * mental model transfers, but tuned for a touch-first marketing surface
 * rather than playground's dense, mouse-first chrome. The 44px minimum
 * control size here is the concrete reason this couldn't just reuse the
 * shared file: playground's largest control is 36px, correct for its
 * desktop-density UI but under the touch-target floor a landing page's
 * nav needs.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const text = {
  main: "text-[color:var(--lp-text-main)]",
  muted: "text-[color:var(--lp-text-muted)]",
  soft: "text-[color:var(--lp-text-soft)]",
  eyebrow:
    "text-[10px] font-mono font-semibold uppercase text-[color:var(--lp-text-muted)]",
  /** Tabular data readouts — prices, counts, ticker-style figures. */
  mono: "font-mono tabular-nums",
} as const;

export const surface = {
  shell: "bg-[var(--lp-shell-bg)]",
  chrome: "border-[color:var(--lp-seam)]",
  panel:
    "bg-[var(--lp-panel-bg)] border border-[color:var(--lp-border)] rounded-[8px]",
  /** Flat hairline-bordered card — no blur, no translucency. */
  glass:
    "bg-[var(--lp-glass-bg)] border border-[color:var(--lp-glass-border)] rounded-[8px]",
} as const;

export type ControlSize = "sm" | "md" | "lg" | "touch";

const SIZE: Record<ControlSize, { box: string; text: string; icon: string }> = {
  sm: { box: "h-8 px-2.5 gap-1.5", text: "text-[12px]", icon: "h-8 w-8 min-w-8" },
  md: { box: "h-9 px-3 gap-1.5", text: "text-[12px]", icon: "h-9 w-9 min-w-9" },
  lg: { box: "h-11 px-4 gap-2", text: "text-[16px]", icon: "h-11 w-11 min-w-11" },
  /** Touch-critical controls (theme toggle, hamburger): 44px floor. */
  touch: { box: "h-11 px-3 gap-2", text: "text-[12px]", icon: "h-11 w-11 min-w-11" },
};

const CONTROL_BASE =
  "inline-flex items-center justify-center rounded-[6px] border font-medium whitespace-nowrap " +
  "transition-[background-color,color,border-color,opacity] duration-150 ease-out outline-none " +
  "focus-visible:ring-2 focus-visible:ring-[color:var(--lp-focus-ring)] focus-visible:ring-offset-0 " +
  "disabled:opacity-40 disabled:cursor-not-allowed";

export type ButtonVariant = "primary" | "subtle" | "ghost";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-[var(--lp-contrast-bg)] text-[color:var(--lp-contrast-text)] hover:opacity-85",
  subtle:
    "border-[color:var(--lp-border)] bg-[var(--lp-control-bg)] text-[color:var(--lp-control-text)] " +
    "hover:border-[color:var(--lp-border-strong)] hover:bg-[var(--lp-control-hover-bg)]",
  ghost:
    "border-transparent bg-transparent text-[color:var(--lp-text-muted)] " +
    "hover:bg-[var(--lp-control-bg)] hover:text-[color:var(--lp-text-main)]",
};

export function button(
  variant: ButtonVariant = "subtle",
  size: ControlSize = "md",
  extra?: ClassValue,
): string {
  return cn(CONTROL_BASE, SIZE[size].box, SIZE[size].text, VARIANT[variant], extra);
}

export function toggleButton(active: boolean, size: ControlSize = "md", extra?: ClassValue): string {
  return button(active ? "primary" : "subtle", size, extra);
}

export function iconButton(
  variant: ButtonVariant = "subtle",
  size: ControlSize = "touch",
  extra?: ClassValue,
): string {
  return cn(CONTROL_BASE, SIZE[size].icon, "p-0", VARIANT[variant], extra);
}

/** Shared shell for a compact two-or-more-way view switcher. */
export const segmentedControl =
  "inline-flex items-center gap-0.5 rounded-[8px] border border-[color:var(--lp-border)] bg-[var(--lp-control-bg)] p-0.5";

export function segmentedButton(active: boolean, extra?: ClassValue): string {
  return cn(
    "inline-flex h-7 items-center justify-center gap-1 rounded-[6px] px-2 text-[10px] font-medium outline-none",
    "transition-[background-color,color,box-shadow] duration-150",
    "focus-visible:ring-2 focus-visible:ring-[color:var(--lp-focus-ring)]",
    active
      ? "bg-[var(--lp-contrast-bg)] text-[color:var(--lp-contrast-text)] shadow-sm"
      : "text-[color:var(--lp-text-muted)] hover:text-[color:var(--lp-text-main)]",
    extra,
  );
}
