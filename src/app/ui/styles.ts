/**
 * The class vocabulary both surfaces build from.
 *
 * The landing page and the playground each declared their own `panelClass`,
 * `subtleClass`, `inverseClass`, `badgeClass`, `chromeClass`, `textMainClass`
 * and `textMutedClass` — same names, same intent, two definitions, and the
 * landing page then prop-drilled six of them into `FeatureShowcase` as strings.
 * Anything added to one surface had to be remembered on the other.
 *
 * Three scales, and nothing outside them:
 *
 * - **Height.** `sm` 28px, `md` 32px, `lg` 36px. Controls were h-6/h-7/h-8/h-9
 *   with no rule about which went where; the 24px one was too small to hit on
 *   touch and is gone.
 * - **Radius.** 6px on controls, 10px on panels and popovers, full on badges.
 *   The two surfaces mixed `rounded` (4px) and `rounded-md` (6px) *within the
 *   same popover*, which is the kind of difference nobody can name but everyone
 *   sees.
 * - **Type.** 11px labels, 12px body, 13px controls, and uppercase tracking for
 *   section labels only. The 10px text that most of the playground's menus used
 *   is below what a dense UI can afford to be legible at.
 *
 * Every interactive element carries the same focus ring. It used to be on one
 * class (`controlClass`), so a keyboard user lost the ring the moment they
 * tabbed onto anything styled `subtleClass` — which is most of the playground.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Compose classes, letting a later Tailwind utility win over an earlier one. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ── Type ─────────────────────────────────────────────────────────────────────

export const text = {
  main: "text-[color:var(--text-main)]",
  muted: "text-[color:var(--text-muted)]",
  soft: "text-[color:var(--text-soft)]",
  /** Small caps above a heading or a menu group. */
  label: "text-[10px] font-semibold uppercase text-[color:var(--text-muted)]",
  /** Wider tracking, for the label above a page section rather than a menu group. */
  eyebrow: "text-[10px] font-semibold uppercase text-[color:var(--text-muted)]",
} as const;

// ── Surfaces ─────────────────────────────────────────────────────────────────

export const surface = {
  shell: "bg-[var(--shell-bg)]",
  content: "bg-[var(--content-bg)]",
  /** Toolbars and headers: divided from what they sit against by a seam. */
  chrome: "bg-[var(--chrome-bg)] border-[color:var(--seam)]",
  sidebar: "bg-[var(--sidebar-bg)] border-[color:var(--seam)]",
  /** A card / chart pane. Reads as a distinct object with sharp, edge-to-edge precision. */
  panel: "bg-[var(--panel-bg)] border border-[color:var(--border)] rounded-none",
  /**
   * A large card that frames a chart rather than holding text. One step up from
   * `panel`, and the only other radius on the page: the showcase used 28px and
   * 32px on adjacent cards, against 8px on the grid below them.
   */
  frame: "bg-[var(--panel-bg)] border border-[color:var(--border)] rounded-[18px]",
  /**
   * Lifted above everything: stronger edge, and a shadow to match.
   *
   * `whitespace-normal` is not decoration. A popover is anchored to the toolbar
   * and inherits its `white-space: nowrap`, so any inline-level child that
   * should have wrapped onto its own line ran off to the right instead — which
   * is how the settings panel ended up 1,642px wide inside a 352px box.
   */
  popover: "bg-[var(--popover-bg)] border border-[color:var(--border-strong)] rounded-[10px] shadow-xl shadow-black/20 whitespace-normal",
} as const;

// ── Controls ─────────────────────────────────────────────────────────────────

export type ControlSize = "sm" | "md" | "lg";

/** Height, padding and type size travel together; picking a size sets all three. */
const SIZE: Record<ControlSize, { box: string; text: string; icon: string }> = {
  sm: { box: "h-7 px-2 gap-1", text: "text-[10px]", icon: "h-7 w-7 min-w-7" },
  md: { box: "h-8 px-2.5 gap-1", text: "text-xs", icon: "h-8 w-8 min-w-8" },
  lg: { box: "h-9 px-3 gap-1", text: "text-[12px]", icon: "h-9 w-9 min-w-9" },
};

const CONTROL_BASE =
  "inline-flex items-center justify-center rounded-md border font-medium whitespace-nowrap " +
  "transition-colors duration-150 outline-none " +
  "focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-0 " +
  "disabled:opacity-40 disabled:cursor-not-allowed";

export type ButtonVariant = "primary" | "subtle" | "ghost" | "danger";

const VARIANT: Record<ButtonVariant, string> = {
  /** The one high-contrast treatment. Also what an active toggle looks like. */
  primary: "border-[color:var(--contrast-border)] bg-[var(--contrast-bg)] text-[color:var(--contrast-text)] hover:opacity-90",
  /** The default. A control that is present but not asking for attention. */
  subtle: "border-[color:var(--border)] bg-[var(--control-bg)] text-[color:var(--control-text)] hover:bg-[var(--control-hover-bg)]",
  /** No chrome until hovered — for dense rows of secondary actions. */
  ghost: "border-transparent bg-transparent text-[color:var(--text-muted)] hover:bg-[var(--control-bg)] hover:text-[color:var(--text-main)]",
  danger: "border-red-500/25 bg-red-500/10 text-red-400 hover:border-red-500/45 hover:bg-red-500/15",
};

export function button(
  variant: ButtonVariant = "subtle",
  size: ControlSize = "md",
  extra?: ClassValue,
): string {
  return cn(CONTROL_BASE, SIZE[size].box, SIZE[size].text, VARIANT[variant], extra);
}

/** Square button holding a single icon; same scale, no horizontal padding. */
export function iconButton(
  variant: ButtonVariant = "subtle",
  size: ControlSize = "md",
  extra?: ClassValue,
): string {
  return cn(CONTROL_BASE, SIZE[size].icon, "p-0", VARIANT[variant], extra);
}

/** A toggle reads as `primary` when on and `subtle` when off, everywhere. */
export function toggleButton(active: boolean, size: ControlSize = "md", extra?: ClassValue): string {
  return button(active ? "primary" : "subtle", size, extra);
}

/**
 * Text input. Same box as a button of the same size, left-aligned content.
 */
export function input(size: ControlSize = "md", extra?: ClassValue): string {
  return cn(
    CONTROL_BASE,
    SIZE[size].box,
    SIZE[size].text,
    VARIANT.subtle,
    "justify-start font-normal hover:bg-[var(--control-bg)] placeholder:text-[color:var(--text-muted)]",
    extra,
  );
}

/**
 * Native `<select>`, wearing the same box as every other control.
 *
 * It stays a real `<select>` — the platform's dropdown is better on touch and
 * with a keyboard than anything reimplemented here, and it keeps the element
 * addressable by tests and assistive tech. Only the closed state is restyled:
 * `appearance-none` drops the OS chrome, and the chevron is an inline SVG
 * background so it takes the token colour rather than the browser's.
 */
export function select(size: ControlSize = "md", extra?: ClassValue): string {
  return cn(
    CONTROL_BASE,
    SIZE[size].box,
    SIZE[size].text,
    VARIANT.subtle,
    // The chevron lives in `globals.css` as `.ui-select`: a Tailwind arbitrary
    // value cannot contain spaces, and an inline SVG data URI is full of them,
    // so writing it as a class silently produced a select with no affordance.
    "ui-select appearance-none justify-start pr-7 [background-position:right_0.5rem_center]",
    extra,
  );
}

/** Several related fields presented as one control, such as a date range. */
export function controlGroup(size: ControlSize = "md", extra?: ClassValue): string {
  return cn(
    "inline-flex items-center rounded-md border border-[color:var(--border)] bg-[var(--control-bg)]",
    "focus-within:ring-2 focus-within:ring-[color:var(--focus-ring)]",
    SIZE[size].box,
    SIZE[size].text,
    extra,
  );
}

/** Native colour field with the same geometry and focus treatment as controls. */
export function colorInput(extra?: ClassValue): string {
  return cn(
    "h-7 w-9 cursor-pointer rounded-md border border-[color:var(--border)] bg-transparent p-0.5 outline-none",
    "focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]",
    extra,
  );
}

/** Colour choice button used by drawing palettes. */
export function colorSwatch(active: boolean, extra?: ClassValue): string {
  return cn(
    "h-7 w-7 rounded-md border outline-none transition-[border-color,box-shadow,transform] duration-150 hover:scale-105",
    "focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]",
    active
      ? "border-[color:var(--contrast-border)] ring-2 ring-[color:var(--focus-ring)]"
      : "border-[color:var(--border)]",
    extra,
  );
}

// ── Everything else ──────────────────────────────────────────────────────────

export const badge = cn(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] leading-[1.2]",
  "border-[color:var(--chip-border)] bg-[var(--chip-bg)] text-[color:var(--chip-text)]",
);

/** A full-width row inside a popover list. */
export function menuItem(active = false, extra?: ClassValue): string {
  return cn(
    "w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors duration-150 outline-none",
    "focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]",
    active ? "bg-[var(--control-bg)] text-[color:var(--text-main)]" : "text-[color:var(--text-soft)] hover:bg-[var(--control-bg)]",
    extra,
  );
}

/** Placeholder box for an empty list. */
export const emptyState = cn(
  "rounded-md border border-dashed border-[color:var(--border)] px-3 py-6 text-center text-[10px]",
  "text-[color:var(--text-muted)]",
);
