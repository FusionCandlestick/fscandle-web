"use client";

/**
 * The chart-mounting half of a demo card. This file is the dynamic-import
 * boundary: it's the only place in `landing/` that imports the chart engine
 * itself (`FusionCandlestickChart`, `ChartSyncGroup`), so `next/dynamic`
 * loading *this* module — rather than gating a `useEffect` inside an
 * eagerly-imported component — is what actually keeps the engine's code out
 * of the page's initial JS. `DemoChartFrame` only imports this module's
 * *types*, never its value, to keep that boundary real.
 */

import { useEffect, useRef } from "react";

import { FusionCandlestickChart } from "fscandle";
import { ChartSyncGroup } from "fscandle";
import type { KLineData } from "fscandle";

import {
  buildCompareData,
  generateData,
  type OverlayInput,
  type Period,
} from "./chart-demo-data";
import { cn } from "./styles";
import type { LandingThemeTokens } from "./tokens";

export type ChartStyle = "candle" | "hollow" | "line" | "step" | "baseline" | "area" | "ha" | "bar";
export type PriceScaleMode = "normal" | "log";
export type DemoFrame = "compact" | "feature";
export type DemoChrome = "full" | "axis" | "focus" | "clean" | "minimal";

export type IndicatorKind =
  | "ema"
  | "boll"
  | "rsi"
  | "macd"
  | "kdj"
  | "wr"
  | "obv"
  | "volma"
  | "atr"
  | "adx"
  | "cci"
  | "roc"
  | "vwap"
  | "psar"
  | "stochrsi"
  | "ma";

export interface IndicatorConfig {
  kind: IndicatorKind;
  params?: number[];
}

/** Kinds without a dedicated `add*Series` convenience method render via the
 * engine's generic `createIndicator(shortName)` registry lookup instead. */
const GENERIC_INDICATOR_SHORT_NAME: Partial<Record<IndicatorKind, string>> = {
  obv: "OBV",
  volma: "VOLMA",
  atr: "ATR",
  adx: "ADX",
  cci: "CCI",
  roc: "ROC",
  vwap: "VWAP",
  psar: "PSAR",
  stochrsi: "STOCHRSI",
  ma: "MA",
};

/** Whether a generically-created indicator overlays the main price pane or
 * opens its own sub-pane, mirroring the placement the engine's own
 * `add*Series` convenience methods use for the kinds that have one. */
const OVERLAYS_MAIN_PANE: Partial<Record<IndicatorKind, boolean>> = {
  volma: true,
  vwap: true,
  psar: true,
  ma: true,
};

export interface SegmentedPhase {
  fromIndex: number;
  toIndex: number;
  style: ChartStyle;
  label?: string;
}

export interface ChartDemoConfig {
  symbol: string;
  chartStyle: ChartStyle;
  period: Period;
  compareSymbols?: string[];
  compareMode?: "overlay";
  priceScaleMode?: PriceScaleMode;
  magnetMode?: boolean;
  indicators?: IndicatorConfig[];
  /** Draw a volume histogram in the bottom of the price pane. */
  showVolume?: boolean;
  overlayFactory?: (data: KLineData[], theme: LandingThemeTokens) => OverlayInput[];
  dataCount?: number;
  /** Fit the full requested dataset into the horizontal viewport. */
  fitContent?: boolean;
  frame?: DemoFrame;
  chrome?: DemoChrome;
  activeDrawingTool?: string | null;
  onChartReady?: (chart: FusionCandlestickChart) => void;
  watermarkText?: string;
  /** Custom multi-phase segmented timeline options */
  segmentedPhases?: SegmentedPhase[];
  /** Fraction of plot width (0..1) reserved on the right, not pixels. */
  rightMargin?: number;
  /** Seed with a leading slice of the data, then replay the rest bar by bar
   * (with a couple of intrabar ticks each) via `chart.updateData`, looping.
   * Off by default, and always off under reduced motion. */
  replay?: boolean;
}

const REPLAY_SEED_RATIO = 0.58;
// Several demo charts can be replaying concurrently (hero + up to a few
// grid tiles), each recalculating indicators on every tick — this interval
// keeps the \"live\" feel without turning that into a CPU-bound page.
const REPLAY_TICK_MS = 110;
const REPLAY_TICKS_PER_BAR = 3;
const REPLAY_LOOP_PAUSE_MS = 1600;

/** One in-progress bar, ticking toward its final OHLC over a few steps —
 * this is what makes the replay read as \"live\" rather than a fast-forward. */
function tickBar(final: KLineData, tick: number, totalTicks: number): KLineData {
  if (tick >= totalTicks - 1) return final;
  const progress = (tick + 1) / totalTicks;
  const openToClose = final.open + (final.close - final.open) * progress;
  return {
    timestamp: final.timestamp,
    open: final.open,
    close: openToClose,
    high: Math.max(final.open, openToClose, final.open + (final.high - final.open) * progress),
    low: Math.min(final.open, openToClose, final.open - (final.open - final.low) * progress),
    volume: (final.volume ?? 0) * progress,
  };
}

const AXIS_METRICS = { top: 22, bottom: 22, right: 85, left: 55 } as const;

export const DEMO_FRAME_CLASSES: Record<DemoFrame, string> = {
  compact: "h-[208px] md:h-[220px]",
  // `h-full` follows the container the section gives it; the floor only keeps a
  // chart from collapsing before it has measured.
  feature: "h-full min-h-[220px] md:min-h-[240px]",
};

const DEMO_CHROME: Record<DemoChrome, { cropTop: number; cropBottom: number; cropLeft: number; cropRight: number }> = {
  full: { cropTop: AXIS_METRICS.top, cropBottom: AXIS_METRICS.bottom, cropLeft: 0, cropRight: 0 },
  // Preserve the bottom time ruler for demos where the date context matters.
  axis: { cropTop: 0, cropBottom: 0, cropLeft: 0, cropRight: 0 },
  focus: { cropTop: AXIS_METRICS.top, cropBottom: AXIS_METRICS.bottom, cropLeft: 0, cropRight: 0 },
  clean: { cropTop: AXIS_METRICS.top, cropBottom: AXIS_METRICS.bottom, cropLeft: 0, cropRight: 0 },
  minimal: { cropTop: AXIS_METRICS.top, cropBottom: AXIS_METRICS.bottom, cropLeft: 0, cropRight: 0 },
};

/** The theme option bag for each main-series style. Shared by the initial
 * mount and the on-the-fly morph so a candle→line→area transition keeps the
 * palette instead of dropping to the engine defaults. */
function mainSeriesStyleOptions(
  chartStyle: ChartStyle,
  theme: LandingThemeTokens,
): Record<string, unknown> {
  switch (chartStyle) {
    case "candle":
    case "hollow":
    case "ha":
      return { ...theme.candle };
    case "bar":
      return { ...theme.bar };
    case "line":
    case "step":
      return { color: theme.line.color, lineWidth: 2 };
    case "baseline":
      return { ...theme.baseline };
    case "area":
      return { ...theme.area };
    default:
      return {};
  }
}

function createSegmentedRenderer(theme: LandingThemeTokens) {
  return (params: {
    ctx: CanvasRenderingContext2D;
    data: KLineData[];
    options: Record<string, unknown>;
    barSpacing: number;
    height: number;
    indexToX: (index: number) => number;
    priceToY: (price: number) => number;
  }) => {
    const { ctx, data, options, barSpacing, height, indexToX, priceToY } = params;
    if (!data || data.length === 0) return;

    const barWidth = Math.max(2, Math.floor(barSpacing * 0.72));
    const halfW = barWidth / 2;
    const upColor = theme.candle?.upColor ?? "#26a69a";
    const downColor = theme.candle?.downColor ?? "#ef5350";
    const lineColor = theme.line?.color ?? "#3b82f6";

    const phases: SegmentedPhase[] = (options.phases as SegmentedPhase[]) || [];
    const activePhases =
      phases.length > 0
        ? phases
        : [{ fromIndex: 0, toIndex: data.length - 1, style: "candle" as ChartStyle }];

    activePhases.forEach((phase, phaseIdx) => {
      const from = Math.max(0, Math.min(data.length - 1, phase.fromIndex));
      const to = Math.max(0, Math.min(data.length - 1, phase.toIndex));
      if (from > to) return;

      const style = phase.style;

      // 1. Candlestick / Hollow / Heikin Ashi
      if (style === "candle" || style === "hollow" || style === "ha") {
        let prevHaOpen = data[from].open;
        let prevHaClose = data[from].close;

        for (let i = from; i <= to; i++) {
          const bar = data[i];
          const x = indexToX(i);

          let o = bar.open;
          let c = bar.close;
          let h = bar.high;
          let l = bar.low;

          if (style === "ha") {
            const haClose = (bar.open + bar.high + bar.low + bar.close) / 4;
            const haOpen = i === from ? (bar.open + bar.close) / 2 : (prevHaOpen + prevHaClose) / 2;
            const haHigh = Math.max(bar.high, haOpen, haClose);
            const haLow = Math.min(bar.low, haOpen, haClose);
            o = haOpen;
            c = haClose;
            h = haHigh;
            l = haLow;
            prevHaOpen = haOpen;
            prevHaClose = haClose;
          }

          const isUp = c >= o;
          const color = isUp ? upColor : downColor;
          const openY = priceToY(o);
          const closeY = priceToY(c);
          const highY = priceToY(h);
          const lowY = priceToY(l);
          const topY = Math.min(openY, closeY);
          const bodyH = Math.max(1, Math.abs(closeY - openY));

          // Wick
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x, highY);
          ctx.lineTo(x, lowY);
          ctx.stroke();

          // Body
          if (style === "hollow" && isUp) {
            ctx.fillStyle = theme.chartBg || "#0d1117";
            ctx.fillRect(x - halfW, topY, barWidth, bodyH);
            ctx.strokeStyle = color;
            ctx.strokeRect(x - halfW, topY, barWidth, bodyH);
          } else {
            ctx.fillStyle = color;
            ctx.fillRect(x - halfW, topY, barWidth, bodyH);
          }
        }
      } else if (style === "bar") {
        for (let i = from; i <= to; i++) {
          const bar = data[i];
          const x = indexToX(i);
          const isUp = bar.close >= bar.open;
          const color = isUp ? upColor : downColor;
          const tickW = Math.max(2, halfW);

          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, priceToY(bar.high));
          ctx.lineTo(x, priceToY(bar.low));
          ctx.moveTo(x - tickW, priceToY(bar.open));
          ctx.lineTo(x, priceToY(bar.open));
          ctx.moveTo(x, priceToY(bar.close));
          ctx.lineTo(x + tickW, priceToY(bar.close));
          ctx.stroke();
        }
      } else if (style === "baseline") {
        const basePrice = data[from].open ?? data[from].close;
        const baseY = priceToY(basePrice);
        const lineStart = from > 0 ? from - 1 : from;
        const startX = indexToX(lineStart);
        const endX = indexToX(to);
        const segWidth = Math.max(10, endX - startX + 20);

        // Build continuous price line path
        const pricePath = new Path2D();
        pricePath.moveTo(startX, priceToY(data[lineStart].close));
        for (let i = from; i <= to; i++) {
          pricePath.lineTo(indexToX(i), priceToY(data[i].close));
        }

        // Build closed area polygon anchored at baseY
        const areaPath = new Path2D();
        areaPath.moveTo(startX, baseY);
        for (let i = lineStart; i <= to; i++) {
          areaPath.lineTo(indexToX(i), priceToY(data[i].close));
        }
        areaPath.lineTo(endX, baseY);
        areaPath.closePath();

        // 1. TOP HALF (Bull: above baseline, y <= baseY in canvas space)
        ctx.save();
        ctx.beginPath();
        ctx.rect(startX - 10, 0, segWidth, Math.max(0, baseY));
        ctx.clip();

        const topGrad = ctx.createLinearGradient(0, 0, 0, Math.max(1, baseY));
        topGrad.addColorStop(0, "rgba(8, 153, 129, 0.35)");
        topGrad.addColorStop(1, "rgba(8, 153, 129, 0.02)");
        ctx.fillStyle = topGrad;
        ctx.fill(areaPath);

        ctx.strokeStyle = "#089981";
        ctx.lineWidth = 2.2;
        ctx.stroke(pricePath);
        ctx.restore();

        // 2. BOTTOM HALF (Bear: below baseline, y > baseY in canvas space)
        ctx.save();
        ctx.beginPath();
        ctx.rect(startX - 10, baseY, segWidth, height);
        ctx.clip();

        const botGrad = ctx.createLinearGradient(0, baseY, 0, baseY + 200);
        botGrad.addColorStop(0, "rgba(242, 54, 69, 0.02)");
        botGrad.addColorStop(1, "rgba(242, 54, 69, 0.35)");
        ctx.fillStyle = botGrad;
        ctx.fill(areaPath);

        ctx.strokeStyle = "#f23645";
        ctx.lineWidth = 2.2;
        ctx.stroke(pricePath);
        ctx.restore();

        // 3. Baseline dashed reference line
        ctx.save();
        ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(startX, baseY);
        ctx.lineTo(endX, baseY);
        ctx.stroke();
        ctx.restore();
      } else if (style === "area") {
        ctx.beginPath();
        ctx.moveTo(indexToX(from), height);
        for (let i = from; i <= to; i++) {
          ctx.lineTo(indexToX(i), priceToY(data[i].close));
        }
        ctx.lineTo(indexToX(to), height);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, priceToY(data[from].high), 0, height);
        grad.addColorStop(0, "rgba(168, 85, 247, 0.35)");
        grad.addColorStop(1, "rgba(168, 85, 247, 0.0)");
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        for (let i = from; i <= to; i++) {
          const x = indexToX(i);
          const y = priceToY(data[i].close);
          if (i === from) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 2.2;
        ctx.stroke();
      } else if (style === "step") {
        ctx.beginPath();
        for (let i = from; i <= to; i++) {
          const x = indexToX(i);
          const y = priceToY(data[i].close);
          if (i === from) {
            ctx.moveTo(x, y);
          } else {
            const prevY = priceToY(data[i - 1].close);
            ctx.lineTo(x, prevY);
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Line
        ctx.beginPath();
        for (let i = from; i <= to; i++) {
          const x = indexToX(i);
          const y = priceToY(data[i].close);
          if (i === from) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }

      // Draw subtle phase boundary line + label
      if (phaseIdx > 0 && from > 0 && from < data.length) {
        const divX = indexToX(from);
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(divX, 8);
        ctx.lineTo(divX, height - 8);
        ctx.stroke();

        if (phase.label) {
          ctx.font = "10px ui-monospace, SFMono-Regular, monospace";
          const labelText = phase.label;
          const textW = ctx.measureText(labelText).width;
          const pad = 4;
          const bX = divX + 3;
          const bY = 16;
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.fillRect(bX, bY - 10, textW + pad * 2, 14);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
          ctx.setLineDash([]);
          ctx.strokeRect(bX, bY - 10, textW + pad * 2, 14);
          ctx.fillStyle = "#60a5fa";
          ctx.fillText(labelText, bX + pad, bY);
        }
        ctx.restore();
      }
    });
  };
}

/** Swap the main renderer in place, keeping data, viewport and any replay
 * loop — `setChartStyle` never rebuilds the chart. */
function applyMainSeriesStyle(
  chart: FusionCandlestickChart,
  chartStyle: ChartStyle,
  theme: LandingThemeTokens,
) {
  chart.setChartStyle(chartStyle);
  chart.series().applyOptions("main", mainSeriesStyleOptions(chartStyle, theme));
}

function applyIndicators(chart: FusionCandlestickChart, indicators: IndicatorConfig[]) {
  indicators.forEach((indicator) => {
    if (indicator.kind === "ema") {
      chart.addEMASeries(indicator.params?.[0] ?? 20);
      return;
    }
    if (indicator.kind === "boll") {
      chart.addBOLLSeries(indicator.params?.[0] ?? 20, indicator.params?.[1] ?? 2);
      return;
    }
    if (indicator.kind === "rsi") {
      chart.addRSISeries(indicator.params?.[0] ?? 14);
      return;
    }
    if (indicator.kind === "macd") {
      chart.addMACDSeries({ calcParams: indicator.params });
      return;
    }
    if (indicator.kind === "kdj") {
      chart.addKDJSeries();
      return;
    }
    if (indicator.kind === "wr") {
      chart.addWRSeries();
      return;
    }

    const shortName = GENERIC_INDICATOR_SHORT_NAME[indicator.kind];
    if (!shortName) return;
    chart.createIndicator(shortName, {
      calcParams: indicator.params,
      newPane: !OVERLAYS_MAIN_PANE[indicator.kind],
    });
  });
}

interface DemoChartProps {
  config: ChartDemoConfig;
  theme: LandingThemeTokens;
  syncGroup?: ChartSyncGroup | null;
  reducedMotion?: boolean;
}

export function DemoChart({ config, theme, syncGroup, reducedMotion = false }: DemoChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<FusionCandlestickChart | null>(null);

  useEffect(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.setDrawingMode(config.activeDrawingTool ?? null);
    }
  }, [config.activeDrawingTool]);

  // Morph the main renderer in place (candle → line → area …) or update segmented phases
  useEffect(() => {
    if (chartInstanceRef.current && config.compareMode !== "overlay") {
      if (config.segmentedPhases) {
        chartInstanceRef.current.series().applyOptions("main", { phases: config.segmentedPhases });
        chartInstanceRef.current.update();
      } else {
        applyMainSeriesStyle(chartInstanceRef.current, config.chartStyle, theme);
      }
    }
  }, [config.chartStyle, config.segmentedPhases, config.compareMode, theme]);

  const isOverlay = config.compareMode === "overlay";
  const chrome = isOverlay
    ? { cropTop: 0, cropBottom: 0, cropLeft: 0, cropRight: 0 }
    : DEMO_CHROME[config.chrome ?? "full"];
  const frameClass = DEMO_FRAME_CLASSES[config.frame ?? "feature"];
  const configKey = JSON.stringify({
    symbol: config.symbol,
    period: config.period,
    compareSymbols: config.compareSymbols,
    compareMode: config.compareMode,
    priceScaleMode: config.priceScaleMode,
    magnetMode: config.magnetMode,
    indicators: config.indicators,
    dataCount: config.dataCount,
    fitContent: config.fitContent,
    watermarkText: config.watermarkText,
    frame: config.frame,
    chrome: config.chrome,
    replay: config.replay,
    isSegmented: Boolean(config.segmentedPhases),
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const isOverlay = config.compareMode === "overlay";

    const chart = new FusionCandlestickChart(containerRef.current, {
      toolbar: { visible: false },
      layout: { background: { color: theme.chartBg }, textColor: theme.axisText },
      grid: {
        vertLines: { color: isOverlay ? "rgba(255, 255, 255, 0.04)" : theme.axisGridStrong },
        horzLines: { color: isOverlay ? "rgba(255, 255, 255, 0.05)" : theme.axisGrid },
      },
      axis: {
        visible: true,
        backgroundColor: theme.axisBg,
        alternateBackgroundColor: theme.axisAltBg,
        borderColor: theme.axisBorder,
        showExtremes: false,
      },
      timeScale: {
        visible: true,
        period: config.period ?? "1d",
        // `timeScale.rightMargin` is a *fraction of the plot width* (clamped to
        // 0..1), not pixels — a value like 18 collapses to 1 and pushes every
        // bar off-screen. A few percent is enough breathing room on the right.
        rightMargin: config.rightMargin ?? (config.replay ? 0.06 : 0.03),
      },
      crosshair: { visible: false, color: theme.crosshair },
      tooltip: { visible: false },
      watermark: { visible: false, text: config.watermarkText ?? config.symbol, color: theme.watermark },
      persistence: { enabled: false },
      localization: {
        locale: "en-US",
        priceFormatter: isOverlay
          ? (normPrice: number) => {
              const delta = normPrice - 100;
              const sign = delta > 0 ? "+" : "";
              return `${sign}${delta.toFixed(1)}%`;
            }
          : undefined,
        timeFormatter: isOverlay
          ? (timestamp: number, context: "axis" | "crosshair") => {
              const d = new Date(timestamp);
              if (context === "crosshair") {
                return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
              }
              return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }
          : undefined,
      },
    });

    chart.setSyncGroup(syncGroup ?? null);

    const count = config.dataCount ?? 240;
    const baseData = isOverlay
      ? buildCompareData(config.symbol, config.period, count)
      : generateData(config.symbol, config.period, count);

    const OVERLAY_COLOR_MAP: Record<string, string> = {
      BTC: "#f59e0b",
      SPY: "#2962ff",
      QQQ: "#10b981",
      NVDA: "#a78bfa",
      AAPL: "#fb7185",
    };

    const getSymbolColor = (sym: string, idx: number) => {
      return OVERLAY_COLOR_MAP[sym.toUpperCase()] ?? theme.compareColors[idx] ?? "#2962ff";
    };

    const shouldReplay = config.replay && !reducedMotion;
    const seedCount = shouldReplay
      ? isOverlay
        ? 12
        : Math.max(4, Math.round(baseData.length * REPLAY_SEED_RATIO))
      : baseData.length;

    const overlaySeriesList: Array<{ series: ReturnType<typeof chart.addLineSeries>; fullData: KLineData[] }> = [];

    if (isOverlay) {
      // Primary benchmark series (e.g. BTC)
      chart.addLineSeries({ color: getSymbolColor(config.symbol, 0), lineWidth: 2.5 });

      // Secondary comparison lines (e.g. SPY, QQQ)
      (config.compareSymbols ?? []).forEach((compareSymbol, idx) => {
        const color = getSymbolColor(compareSymbol, idx + 1);
        const series = chart.addLineSeries({ color, lineWidth: 2.5 });
        const fullData = buildCompareData(compareSymbol, config.period, count);
        series.setData(fullData.slice(0, seedCount));
        overlaySeriesList.push({ series, fullData });
      });
    } else if (config.segmentedPhases) {
      chart.defineSeriesType({
        type: "segmented",
        defaultOptions: { phases: config.segmentedPhases },
        priceValues: (bar) => [bar.high, bar.low],
        renderer: createSegmentedRenderer(theme),
      });
      // On a fresh chart this becomes the main series.
      chart.addCustomSeries("segmented", { phases: config.segmentedPhases });
    } else {
      applyMainSeriesStyle(chart, config.chartStyle, theme);
    }

    chart.setData(baseData.slice(0, seedCount));

    // The engine only feeds the main series on its own; a volume histogram, like
    // the compare overlays, has to be handed its slice explicitly.
    const volumeSeries =
      config.showVolume && !isOverlay ? chart.addVolumeSeries() : null;
    volumeSeries?.setData(baseData.slice(0, seedCount));

    if (config.indicators?.length) {
      applyIndicators(chart, config.indicators);
    }

    config.overlayFactory?.(baseData, theme).forEach((overlay) => {
      chart.createOverlay(overlay);
    });

    chart.setMagnetMode(config.magnetMode ?? false);
    chart.setPriceScaleMode(config.priceScaleMode ?? "normal");

    if (config.activeDrawingTool !== undefined) {
      chart.setDrawingMode(config.activeDrawingTool);
    }

    if (config.fitContent && seedCount > 1) {
      chart.timeScale().setVisibleLogicalRange({ from: 0, to: seedCount - 1 });
    }

    if (isOverlay) {
      chart.createPriceLine({
        price: 100,
        color: "rgba(148, 163, 184, 0.25)",
        lineWidth: 1,
        lineStyle: "dashed",
        title: "0%",
      });
      chart.timeScale().setVisibleLogicalRange({ from: 0, to: seedCount - 1 });
    }

    config.onChartReady?.(chart);

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let pauseId: ReturnType<typeof setTimeout> | null = null;

    if (shouldReplay) {
      let barIndex = seedCount;
      let tick = 0;

      const resetAllSeries = () => {
        barIndex = seedCount;
        tick = 0;
        overlaySeriesList.forEach(({ series, fullData }) => {
          series.setData(fullData.slice(0, seedCount));
        });
        const initialSlice = baseData.slice(0, seedCount);
        chart.setData(initialSlice);
        volumeSeries?.setData(initialSlice);
        if (isOverlay) {
          chart.timeScale().setVisibleLogicalRange({ from: 0, to: seedCount - 1 });
        }
      };

      const step = () => {
        const finalBar = baseData[barIndex];
        if (!finalBar) {
          // Reached the end — pause on the full chart, then loop.
          if (intervalId) clearInterval(intervalId);
          pauseId = setTimeout(() => {
            resetAllSeries();
            intervalId = setInterval(step, REPLAY_TICK_MS);
          }, REPLAY_LOOP_PAUSE_MS);
          return;
        }

        const currentTickBar = tickBar(finalBar, tick, REPLAY_TICKS_PER_BAR);

        if (isOverlay) {
          overlaySeriesList.forEach(({ series, fullData }) => {
            const compBar = fullData[barIndex];
            if (compBar) {
              const compSlice = fullData.slice(0, barIndex + 1);
              compSlice[compSlice.length - 1] = tickBar(compBar, tick, REPLAY_TICKS_PER_BAR);
              series.setData(compSlice);
            }
          });

          const currentPrimarySlice = baseData.slice(0, barIndex + 1);
          currentPrimarySlice[currentPrimarySlice.length - 1] = currentTickBar;
          chart.setData(currentPrimarySlice);
          chart.timeScale().setVisibleLogicalRange({ from: 0, to: barIndex });
        } else {
          chart.updateData(currentTickBar);
          if (volumeSeries) {
            const slice = baseData.slice(0, barIndex + 1);
            slice[slice.length - 1] = currentTickBar;
            volumeSeries.setData(slice);
          }
        }

        tick += 1;
        if (tick >= REPLAY_TICKS_PER_BAR) {
          tick = 0;
          barIndex += 1;
        }
      };

      intervalId = setInterval(step, REPLAY_TICK_MS);
    }

    chartInstanceRef.current = chart;

    return () => {
      chartInstanceRef.current = null;
      if (intervalId) clearInterval(intervalId);
      if (pauseId) clearTimeout(pauseId);
      chart.destroy();
    };
    // `configKey` digests every `config` field this effect reads, so it
    // re-runs on a real change without depending on `config`'s identity
    // (rebuilt every render by the caller).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, config.overlayFactory, syncGroup, theme, reducedMotion]);

  return (
    <div className={cn("relative w-full overflow-hidden", frameClass)}>
      <div
        style={{
          position: "absolute",
          top: `${-chrome.cropTop}px`,
          left: `${-chrome.cropLeft}px`,
          width: `calc(100% + ${chrome.cropLeft + chrome.cropRight}px)`,
          height: `calc(100% + ${chrome.cropTop + chrome.cropBottom}px)`,
        }}
      >
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
