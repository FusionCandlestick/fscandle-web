/** Landing palette and chart colors; CSS variables use the --lp- prefix.
 * The playground owns a separate palette in ../ui/theme.ts. */

import type { CSSProperties } from "react";
import type {
  AreaSeriesOptions,
  BarSeriesOptions,
  CandlestickStyleOptions,
} from "fscandle";

export type ThemeMode = "dark" | "light";

export interface LandingThemeTokens {
  shellBg: string;
  chromeBg: string;
  panelBg: string;
  chartBg: string;

  textMain: string;
  textMuted: string;
  textSoft: string;

  controlBg: string;
  controlHoverBg: string;
  controlText: string;

  border: string;
  borderStrong: string;
  seam: string;

  /** Semi-transparent card surface, kept above a manually-checked contrast floor. */
  glassBg: string;
  glassBorder: string;

  contrastBg: string;
  contrastText: string;
  focusRing: string;

  /** Sticky top-bar fill — intentionally a shade off the page so the chrome
   * reads as a distinct surface (never pure white in light mode). */
  headerBg: string;
  /** Vertical wash painted over the top of the page behind the grid. */
  pageWash: string;

  /** Marketing accent identity — deliberately distinct from chart series colors. */
  accent: string;

  axisText: string;
  axisGrid: string;
  axisGridStrong: string;
  axisBg: string;
  axisAltBg: string;
  axisBorder: string;
  crosshair: string;
  watermark: string;

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

  /** Demo-only accents for the multi-symbol compare overlay (up to 3 lines
   * beyond the base series) and the drawing-tools showcase — distinct hues
   * are unavoidable here (a monochrome overlay set would be unreadable), but
   * they're centralized so both theme modes get contrast-appropriate values
   * instead of one dark-tuned palette reused everywhere. */
  compareColors: readonly string[];
  overlayColors: { trend: string; channel: string; signal: string };
}

/** Brand colours of the wordmark. The same in both themes. */
export const BRAND_COLORS = {
  fusion: "#FF5A5A",
  candlestick: "#008755",
} as const;

/** Drawing-tool categories in the drawing showcase. The same in both themes. */
export const ANNOTATION_COLORS = {
  geometry: "#22d3ee",
  fibonacci: "#fbbf24",
  measure: "#a78bfa",
  note: "#22c55e",
} as const;

export const LANDING_THEMES: Record<ThemeMode, LandingThemeTokens> = {
  dark: {
    shellBg: "#000000",
    chromeBg: "#0a0a0a",
    panelBg: "#111111",
    chartBg: "#0d0d0d",

    textMain: "#ededed",
    textMuted: "#888888",
    textSoft: "#b4b4b4",

    controlBg: "#1a1a1a",
    controlHoverBg: "#262626",
    controlText: "#ededed",

    border: "rgba(255, 255, 255, 0.1)",
    borderStrong: "rgba(255, 255, 255, 0.22)",
    seam: "rgba(255, 255, 255, 0.08)",

    glassBg: "#0d0d0d",
    glassBorder: "rgba(255, 255, 255, 0.1)",

    contrastBg: "#ededed",
    contrastText: "#000000",
    focusRing: "rgba(41, 98, 255, 0.6)",

    headerBg: "color-mix(in oklab, #0a0a0a 82%, transparent)",
    pageWash:
      "linear-gradient(to bottom, rgba(3, 68, 48, 0.82) 0%, rgba(4, 78, 55, 0.56) 20%, rgba(5, 70, 50, 0.28) 42%, rgba(4, 55, 40, 0.1) 62%, transparent 82%)",

    accent: "#2962ff",

    axisText: "#ededed",
    axisGrid: "rgba(255, 255, 255, 0.06)",
    axisGridStrong: "rgba(255, 255, 255, 0.06)",
    axisBg: "#0a0a0a",
    axisAltBg: "#141414",
    axisBorder: "rgba(255, 255, 255, 0.1)",
    crosshair: "rgba(41, 98, 255, 0.85)",
    watermark: "rgba(255, 255, 255, 0.08)",

    candle: {
      upColor: "#089981",
      downColor: "#f23645",
      borderUpColor: "#0ecb9b",
      borderDownColor: "#ff6b76",
      wickUpColor: "#0ecb9b",
      wickDownColor: "#ff6b76",
    },
    bar: { upColor: "#089981", downColor: "#f23645", lineWidth: 2 },
    area: {
      lineColor: "#2962ff",
      lineWidth: 2,
      topColor: "rgba(41, 98, 255, 0.26)",
      bottomColor: "rgba(41, 98, 255, 0.02)",
    },
    line: { color: "#ededed", lineWidth: 2 },
    baseline: {
      topLineColor: "#089981",
      bottomLineColor: "#f23645",
      topFillColor: "rgba(8, 153, 129, 0.32)",
      bottomFillColor: "rgba(242, 54, 69, 0.28)",
      lineWidth: 2.5,
    },

    compareColors: ["#2962ff", "#f59e0b", "#10b981", "#8b5cf6"],
    overlayColors: { trend: "#2962ff", channel: "#ff9800", signal: "#089981" },
  },

  light: {
    shellBg: "#ffffff",
    chromeBg: "#ffffff",
    panelBg: "#ffffff",
    chartBg: "#ffffff",

    textMain: "#000000",
    textMuted: "#666666",
    textSoft: "#333333",

    controlBg: "#fafafa",
    controlHoverBg: "#f0f0f0",
    controlText: "#000000",

    border: "rgba(0, 0, 0, 0.1)",
    borderStrong: "rgba(0, 0, 0, 0.2)",
    seam: "rgba(0, 0, 0, 0.08)",

    glassBg: "#ffffff",
    glassBorder: "rgba(0, 0, 0, 0.1)",

    contrastBg: "#000000",
    contrastText: "#ffffff",
    focusRing: "rgba(41, 98, 255, 0.5)",

    headerBg: "#e8eaee",
    pageWash:
      "linear-gradient(to bottom, rgba(100, 116, 139, 0.22) 0%, rgba(100, 116, 139, 0.13) 22%, rgba(100, 116, 139, 0.06) 45%, rgba(100, 116, 139, 0.02) 65%, transparent 82%)",

    accent: "#2962ff",

    axisText: "#000000",
    axisGrid: "rgba(0, 0, 0, 0.08)",
    axisGridStrong: "rgba(0, 0, 0, 0.16)",
    axisBg: "#ffffff",
    axisAltBg: "#fafafa",
    axisBorder: "rgba(0, 0, 0, 0.1)",
    crosshair: "rgba(41, 98, 255, 0.6)",
    watermark: "rgba(0, 0, 0, 0.06)",

    candle: {
      upColor: "#089981",
      downColor: "#f23645",
      borderUpColor: "#089981",
      borderDownColor: "#f23645",
      wickUpColor: "#089981",
      wickDownColor: "#f23645",
    },
    bar: { upColor: "#089981", downColor: "#f23645", lineWidth: 2 },
    area: {
      lineColor: "#2962ff",
      lineWidth: 2,
      topColor: "rgba(41, 98, 255, 0.14)",
      bottomColor: "rgba(41, 98, 255, 0.02)",
    },
    line: { color: "#000000", lineWidth: 2 },
    baseline: {
      topLineColor: "#089981",
      bottomLineColor: "#f23645",
      topFillColor: "rgba(8, 153, 129, 0.26)",
      bottomFillColor: "rgba(242, 54, 69, 0.22)",
      lineWidth: 2.5,
    },

    compareColors: ["#1e53e5", "#d97706", "#059669", "#7c3aed"],
    overlayColors: { trend: "#1e53e5", channel: "#e08600", signal: "#089981" },
  },
};

/** Runtime (mode-dependent) tokens, set once on the page root as CSS custom properties. */
export function landingThemeCssVars(theme: LandingThemeTokens): CSSProperties {
  return {
    "--lp-shell-bg": theme.shellBg,
    "--lp-chrome-bg": theme.chromeBg,
    "--lp-header-bg": theme.headerBg,
    "--lp-page-wash": theme.pageWash,
    "--lp-panel-bg": theme.panelBg,
    "--lp-text-main": theme.textMain,
    "--lp-text-muted": theme.textMuted,
    "--lp-text-soft": theme.textSoft,
    "--lp-control-bg": theme.controlBg,
    "--lp-control-hover-bg": theme.controlHoverBg,
    "--lp-control-text": theme.controlText,
    "--lp-border": theme.border,
    "--lp-border-strong": theme.borderStrong,
    "--lp-seam": theme.seam,
    "--lp-glass-bg": theme.glassBg,
    "--lp-glass-border": theme.glassBorder,
    "--lp-contrast-bg": theme.contrastBg,
    "--lp-contrast-text": theme.contrastText,
    "--lp-focus-ring": theme.focusRing,
    "--lp-accent": theme.accent,
  } as CSSProperties;
}
