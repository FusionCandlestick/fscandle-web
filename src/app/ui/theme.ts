/**
 * One theme, for both surfaces.
 *
 * `THEMES` used to exist twice: a 34-key copy in the landing page and a 53-key
 * copy in the playground. 52 tokens were shared by name — and three of them had
 * *different values*, which is what two copies of a design system always
 * converge on:
 *
 *     dark.border        landing rgba(100,116,139,0.5)   playground #070b14
 *     dark.borderStrong  landing rgba(100,116,139,0.7)   playground #0b1324
 *     dark.axisBorder    landing rgba(100,116,139,0.7)   playground transparent
 *
 * The playground's values are the shell background, so "border" there meant a
 * seam you cannot see, while the same name on the landing page meant a visible
 * hairline. Both readings are legitimate; having one name mean both is not.
 * They are separate tokens now — `border` is a line, `seam` is a fold — and
 * there is a single definition of each.
 *
 * Tokens are consumed as CSS custom properties (`themeCssVars`) rather than
 * read in JSX, so a component's classes never have to know which mode is
 * active. The chart-series tokens at the bottom are passed to the engine's
 * options, which is what keeps a chart's candles, axes and watermark in step
 * with the chrome around it.
 */

import type { CSSProperties } from "react";
import type {
  AreaSeriesOptions,
  BarSeriesOptions,
  CandlestickStyleOptions,
  VolumeSeriesOptions,
} from "fscandle";

export type ThemeMode = "dark" | "light";

export interface ThemeTokens {
  // Surfaces, from furthest back to closest to the reader.
  shellBg: string;
  chromeBg: string;
  contentBg: string;
  panelBg: string;
  sidebarBg: string;
  popoverBg: string;
  chartBg: string;

  // Type.
  textMain: string;
  textMuted: string;
  textSoft: string;

  // Controls.
  controlBg: string;
  controlHoverBg: string;
  controlText: string;

  /** Hairline around a control or a panel: meant to be seen. */
  border: string;
  /** Emphasis edge — popovers, and anything lifted above the surface. */
  borderStrong: string;
  /** Divider between two chrome areas: meant to read as a fold, not a line. */
  seam: string;

  // The one high-contrast pair, for primary actions and active states.
  contrastBg: string;
  contrastText: string;
  contrastBorder: string;
  focusRing: string;

  // Chart chrome, handed to the engine.
  axisText: string;
  axisGrid: string;
  axisGridStrong: string;
  axisBg: string;
  axisAltBg: string;
  axisBorder: string;
  crosshair: string;
  watermark: string;

  // Badges.
  chipBg: string;
  chipText: string;
  chipBorder: string;

  // Series palettes, handed to the engine.
  candle: Partial<CandlestickStyleOptions>;
  bar: Partial<BarSeriesOptions>;
  area: Partial<AreaSeriesOptions>;
  line: { color: string; lineWidth: number };
  baseline: {
    topLineColor: string;
    bottomLineColor: string;
    topFillColor: string;
    bottomFillColor: string;
    lineWidth: number;
  };
  volume: Partial<VolumeSeriesOptions>;
}

export const THEMES: Record<ThemeMode, ThemeTokens> = {
  dark: {
    shellBg: "#070b14",
    chromeBg: "#0b1324",
    contentBg: "#0a1020",
    panelBg: "#0f172a",
    sidebarBg: "#0b1324",
    popoverBg: "#111a2f",
    chartBg: "#0f172a",

    textMain: "#f8fafc",
    textMuted: "#94a3b8",
    textSoft: "#cbd5e1",

    controlBg: "#111a2f",
    controlHoverBg: "#17233d",
    controlText: "#f8fafc",

    // A quiet hairline. The landing page's 0.5 slate reads as a box drawn
    // around everything at this density; 0.22 still separates without doing so.
    border: "rgba(148, 163, 184, 0.22)",
    borderStrong: "rgba(148, 163, 184, 0.38)",
    seam: "rgba(148, 163, 184, 0.12)",

    contrastBg: "#f8fafc",
    contrastText: "#0b1324",
    contrastBorder: "#f8fafc",
    focusRing: "rgba(248, 250, 252, 0.55)",

    axisText: "#f8fafc",
    axisGrid: "rgba(148, 163, 184, 0.08)",
    axisGridStrong: "rgba(148, 163, 184, 0.08)",
    axisBg: "#0b1324",
    axisAltBg: "#111a2f",
    axisBorder: "rgba(148, 163, 184, 0.18)",
    crosshair: "rgba(191, 219, 254, 0.85)",
    watermark: "rgba(148, 163, 184, 0.12)",

    chipBg: "rgba(248, 250, 252, 0.14)",
    chipText: "#f8fafc",
    chipBorder: "rgba(248, 250, 252, 0.38)",

    candle: {
      upColor: "#34d399",
      downColor: "#fb7185",
      borderUpColor: "#6ee7b7",
      borderDownColor: "#fda4af",
      wickUpColor: "#a7f3d0",
      wickDownColor: "#fecdd3",
    },
    bar: { upColor: "#6ee7b7", downColor: "#fda4af", lineWidth: 2 },
    area: {
      lineColor: "#f8fafc",
      lineWidth: 2,
      topColor: "rgba(248, 250, 252, 0.28)",
      bottomColor: "rgba(248, 250, 252, 0.04)",
    },
    line: { color: "#f8fafc", lineWidth: 2 },
    baseline: {
      topLineColor: "#34d399",
      bottomLineColor: "#fb7185",
      topFillColor: "rgba(52, 211, 153, 0.24)",
      bottomFillColor: "rgba(251, 113, 133, 0.2)",
      lineWidth: 2,
    },
    volume: { upColor: "rgba(52, 211, 153, 0.38)", downColor: "rgba(251, 113, 133, 0.34)" },
  },

  light: {
    shellBg: "#f3f7fb",
    chromeBg: "#ffffff",
    contentBg: "#f8fbff",
    panelBg: "#ffffff",
    sidebarBg: "#ffffff",
    popoverBg: "#ffffff",
    chartBg: "#ffffff",

    textMain: "#0b1324",
    textMuted: "#64748b",
    textSoft: "#334155",

    controlBg: "#ffffff",
    controlHoverBg: "#edf2f7",
    controlText: "#0b1324",

    border: "rgba(15, 23, 42, 0.12)",
    borderStrong: "rgba(15, 23, 42, 0.2)",
    seam: "rgba(15, 23, 42, 0.08)",

    contrastBg: "#0b1324",
    contrastText: "#f8fafc",
    contrastBorder: "#0b1324",
    focusRing: "rgba(11, 19, 36, 0.2)",

    axisText: "#0b1324",
    axisGrid: "rgba(15, 23, 42, 0.16)",
    axisGridStrong: "rgba(15, 23, 42, 0.24)",
    axisBg: "#ffffff",
    axisAltBg: "#eef4fb",
    axisBorder: "rgba(15, 23, 42, 0.14)",
    crosshair: "rgba(37, 99, 235, 0.55)",
    watermark: "rgba(15, 23, 42, 0.08)",

    chipBg: "rgba(11, 19, 36, 0.08)",
    chipText: "#0b1324",
    chipBorder: "rgba(11, 19, 36, 0.2)",

    candle: {
      upColor: "#047857",
      downColor: "#be123c",
      borderUpColor: "#047857",
      borderDownColor: "#be123c",
      wickUpColor: "#065f46",
      wickDownColor: "#9f1239",
    },
    bar: { upColor: "#047857", downColor: "#be123c", lineWidth: 2 },
    area: {
      lineColor: "#0b1324",
      lineWidth: 2,
      topColor: "rgba(11, 19, 36, 0.14)",
      bottomColor: "rgba(11, 19, 36, 0.02)",
    },
    line: { color: "#0b1324", lineWidth: 2 },
    baseline: {
      topLineColor: "#047857",
      bottomLineColor: "#be123c",
      topFillColor: "rgba(4, 120, 87, 0.18)",
      bottomFillColor: "rgba(190, 18, 60, 0.16)",
      lineWidth: 2,
    },
    volume: { upColor: "rgba(4, 120, 87, 0.26)", downColor: "rgba(190, 18, 60, 0.22)" },
  },
};

/**
 * The tokens a stylesheet can reach, as inline custom properties.
 *
 * Set once on each surface's root element. Everything below it styles itself
 * from `var(--…)`, so no component takes a theme prop and no component branches
 * on the mode.
 */
export function themeCssVars(theme: ThemeTokens): CSSProperties {
  return {
    "--shell-bg": theme.shellBg,
    "--chrome-bg": theme.chromeBg,
    "--content-bg": theme.contentBg,
    "--panel-bg": theme.panelBg,
    "--sidebar-bg": theme.sidebarBg,
    "--popover-bg": theme.popoverBg,
    "--chart-bg": theme.chartBg,
    "--text-main": theme.textMain,
    "--text-muted": theme.textMuted,
    "--text-soft": theme.textSoft,
    "--control-bg": theme.controlBg,
    "--control-hover-bg": theme.controlHoverBg,
    "--control-text": theme.controlText,
    "--border": theme.border,
    "--border-strong": theme.borderStrong,
    "--seam": theme.seam,
    "--contrast-bg": theme.contrastBg,
    "--contrast-text": theme.contrastText,
    "--contrast-border": theme.contrastBorder,
    "--focus-ring": theme.focusRing,
    "--chip-bg": theme.chipBg,
    "--chip-text": theme.chipText,
    "--chip-border": theme.chipBorder,
  } as CSSProperties;
}
