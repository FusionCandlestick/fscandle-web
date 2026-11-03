"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

import { FusionCandlestickChart, mergeSymbolContextEventMarkers, type DrawingLayer, type PriceScaleMode, type KLineData, type SymbolContextEvent } from "fscandle";
import { pluginTemplates } from "./indicatorPlugins";
import { THEMES, type ThemeMode } from "../ui/theme";
import { asset } from "../lib/asset";
import type { PersistedIndicator } from "@/store/WorkspaceStore";

export type Period = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
export type ChartStyle = "candle" | "hollow" | "line" | "baseline" | "area" | "ha" | "bar";
export type DrawingDefaults = { color: string; lineWidth: number };

export interface ChartAdapter {
  setSymbol: (symbol: string) => void;
  setPeriod: (period: Period) => void;
  focusTimestamp: (timestamp: number, options?: { span?: number }) => void;
  setChartStyle: (style: ChartStyle) => void;
  setMagnetMode: (enabled: boolean) => void;
  setPriceScaleMode: (mode: PriceScaleMode) => void;
  setInvertScale: (inverted: boolean) => void;
  setDrawingDefaults: (defaults: Partial<DrawingDefaults>) => void;
  startDrawing: (tool: string) => void;
  clearDrawings: () => void;
  clearCurrentLayer: () => void;
  getDrawingLayers: () => DrawingLayer[];
  getActiveDrawingLayerId: () => string;
  createDrawingLayer: (name?: string) => DrawingLayer;
  setActiveDrawingLayer: (layerId: string) => void;
  deleteDrawingLayer: (layerId: string) => void;
  refresh: () => void;
  undo: () => void;
  redo: () => void;
  exportDrawings: () => void;
  importDrawings: (json: string) => void;
  toggleWatermark: (visible: boolean) => void;
  screenshot: () => Promise<string | null>;
  setReplayRange: (startTimestamp: number, endTimestamp: number) => void;
  replayStep: () => boolean;
  addIndicator: (name: string, options?: { paneId?: string; id?: string; calcParams?: number[]; newPane?: boolean }) => void;
  removeIndicator: (paneId: string, indicatorId: string) => void;
  getRegisteredIndicators: () => Array<{ shortName: string; name: string }>;
}

const PERIOD_FILES: Record<Period, string> = {
  "1m": "1min",
  "5m": "5min",
  "15m": "15min",
  "30m": "30min",
  "1h": "1hour",
  "4h": "4hour",
  "1d": "1day",
  "1w": "1week",
};

interface HistoricalFileRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// Bundled offset-free dates are encoded as UTC for consistent chart labels.
// This display convention does not establish a provider timezone or the real
// UTC instant. The bundled files are demonstration data with unverified provenance.
const exchangeWallClockTimestamp = (value: string): number => {
  return Date.parse(`${value.replace(" ", "T")}Z`);
};

const snapEventsToCandles = (candles: KLineData[], events: SymbolContextEvent[]): SymbolContextEvent[] => {
  if (candles.length === 0 || events.length === 0) return events;
  const candleTimes = candles.map((c) => c.timestamp);
  const candleInterval = candles.length > 1 ? Math.abs(candles[1].timestamp - candles[0].timestamp) : 86400000;
  return events.map((ev) => {
    let bestTs = ev.timestamp;
    let minDiff = Infinity;
    for (let i = 0; i < candleTimes.length; i++) {
      const diff = Math.abs(candleTimes[i] - ev.timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        bestTs = candleTimes[i];
      }
    }
    if (minDiff <= Math.max(candleInterval * 1.5, 86400000 * 2)) {
      return { ...ev, timestamp: bestTs };
    }
    return ev;
  });
};

const loadHistoricalData = async (symbol: string, period: Period): Promise<KLineData[]> => {
  const response = await fetch(
    asset(`/data/fmp/${encodeURIComponent(symbol)}/${PERIOD_FILES[period]}.json`),
    { cache: "no-store" },
  );
  if (!response.ok) return [];
  const rows = await response.json() as HistoricalFileRow[];
  const candles: KLineData[] = rows.map((row) => ({
    timestamp: exchangeWallClockTimestamp(row.date),
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    volume: row.volume,
  }));

  try {
    const newsRes = await fetch(asset(`/data/fmp/${encodeURIComponent(symbol)}/news.json`), { cache: "no-store" });
    if (newsRes.ok) {
      const rawEvents = (await newsRes.json()) as SymbolContextEvent[];
      if (Array.isArray(rawEvents) && rawEvents.length > 0) {
        const snapped = snapEventsToCandles(candles, rawEvents);
        return mergeSymbolContextEventMarkers(candles, snapped);
      }
    }
  } catch {
    // Non-blocking news enhancement
  }

  return candles;
};

interface ChartViewportProps {
  symbol: string;
  period: Period;
  activeTool?: string;
  themeMode: ThemeMode;
  chartStyle: ChartStyle;
  magnetMode: boolean;
  priceScaleMode: PriceScaleMode;
  invertScale: boolean;
  watermarkVisible: boolean;
  drawingDefaults: DrawingDefaults;
  compareSymbols: string[];
  chartBackground?: { mode: 'solid' | 'gradient'; top: string; bottom: string };
  initialIndicators?: PersistedIndicator[];
  onReady: (adapter: ChartAdapter) => void;
  onDrawingEnd?: () => void;
  onIndicatorRemoved?: (id: string) => void;
}

const MAX_COMPARE_PANES = 5;
const COMPARE_COLORS = ["#38bdf8", "#f59e0b", "#a78bfa", "#10b981", "#fb7185"];

interface ComparePanes {
  /** Make the chart show exactly these compare symbols (the first five). */
  sync(symbols: readonly string[]): void;
  /** Stop adding panes: loads still in flight are ignored. */
  dispose(): void;
}

/**
 * Compare lines for one chart instance, reconciled by symbol.
 *
 * A pane keeps its slot (left/right side and colour) while its position in the
 * list is unchanged; a pane whose position changed is recreated in its new
 * slot. History loads are asynchronous, so a load that resolves after its symbol
 * was removed, or after the chart was rebuilt, is dropped.
 */
function createComparePanes(chart: FusionCandlestickChart, period: Period): ComparePanes {
  const shown = new Map<string, number>();
  const pending = new Map<string, number>();
  let wanted = new Map<string, number>();
  let disposed = false;

  return {
    sync(symbols) {
      const list = symbols.slice(0, MAX_COMPARE_PANES);
      wanted = new Map(list.map((symbol, index) => [symbol.toLowerCase(), index]));

      for (const [id, slot] of [...shown]) {
        if (wanted.get(id) !== slot) {
          chart.removeStackedPricePane(id);
          shown.delete(id);
        }
      }

      list.forEach((symbol, index) => {
        const id = symbol.toLowerCase();
        if (shown.has(id) || pending.get(id) === index) return;
        pending.set(id, index);
        void loadHistoricalData(symbol, period).then(data => {
          if (pending.get(id) === index) pending.delete(id);
          if (disposed || data.length === 0 || wanted.get(id) !== index || shown.has(id)) return;
          chart.addStackedPricePane({
            id,
            data,
            side: index % 2 === 0 ? "left" : "right",
            style: "line",
            options: { color: COMPARE_COLORS[index % COMPARE_COLORS.length], lineWidth: 2 },
          });
          shown.set(id, index);
        });
      });
    },
    dispose() {
      disposed = true;
    },
  };
}

export function ChartViewport({
  symbol,
  period,
  activeTool,
  themeMode,
  chartStyle,
  magnetMode,
  priceScaleMode,
  invertScale,
  watermarkVisible,
  drawingDefaults,
  compareSymbols,
  chartBackground,
  initialIndicators,
  onReady,
  onDrawingEnd,
  onIndicatorRemoved,
}: ChartViewportProps) {
  const initialIndicatorsRef = useRef(initialIndicators);
  const resolvedThemeMode: ThemeMode = themeMode === "light" ? "light" : "dark";
  const theme = THEMES[resolvedThemeMode];
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<FusionCandlestickChart | null>(null);
  const latestSymbolRef = useRef(symbol);
  const latestPeriodRef = useRef(period);
  // Keep imperative chart construction in sync even when a viewport is
  // recreated by a concurrent React update.
  const latestActiveToolRef = useRef(activeTool);
  const latestDrawingDefaultsRef = useRef(drawingDefaults);
  const latestOnReadyRef = useRef(onReady);
  const latestOnDrawingEndRef = useRef(onDrawingEnd);
  const latestCompareSymbolsRef = useRef(compareSymbols);
  const latestOnIndicatorRemovedRef = useRef(onIndicatorRemoved);
  const comparePanesRef = useRef<ComparePanes | null>(null);

  useEffect(() => {
    initialIndicatorsRef.current = initialIndicators;
    latestOnIndicatorRemovedRef.current = onIndicatorRemoved;
  }, [initialIndicators, onIndicatorRemoved]);

  useEffect(() => {
    latestSymbolRef.current = symbol;
    latestPeriodRef.current = period;
  }, [symbol, period]);

  useEffect(() => {
    latestDrawingDefaultsRef.current = drawingDefaults;
    latestOnReadyRef.current = onReady;
    latestOnDrawingEndRef.current = onDrawingEnd;
  }, [drawingDefaults, onReady, onDrawingEnd]);

  useEffect(() => {
    latestCompareSymbolsRef.current = compareSymbols;
    comparePanesRef.current?.sync(compareSymbols);
  }, [compareSymbols]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const chart = new FusionCandlestickChart(containerRef.current, {
      toolbar: {
        visible: false,
      },
      // exchangeWallClockTimestamp encodes the exchange clock as UTC, so labels
      // must render in UTC too; the browser's zone would shift every bar.
      localization: {
        timeZone: "UTC",
      },
      layout: {
        background: { color: theme.chartBg },
        textColor: theme.axisText,
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.05)", style: "solid" },
        horzLines: { color: "rgba(148, 163, 184, 0.08)", style: "solid" },
      },
      timeScale: {
        period,
        rightMargin: 0.05,
        sessionSeparator: {
          visible: false,
          color: "rgba(255, 255, 255, 0.1)",
          style: "dashed",
        },
      },
      axis: {
        backgroundColor: theme.axisBg,
        alternateBackgroundColor: theme.axisAltBg,
        borderColor: theme.axisBorder,
        lastPriceLineVisible: false,
      },
      crosshair: {
        color: theme.crosshair,
      },
      panes: {
        dividerHeight: 1,
        dividerColor: "#000000",
        dividerHoverColor: "#000000",
        resizable: true,
      },
      watermark: {
        visible: watermarkVisible,
        text: symbol,
        color: watermarkVisible ? theme.watermark : "rgba(0, 0, 0, 0)",
      },
    });

    if (chartStyle === "candle") {
      chart.addCandlestickSeries(theme.candle);
    } else if (chartStyle === "hollow") {
      chart.addCandlestickSeries({ ...theme.candle, upColor: "rgba(0,0,0,0)" });
      chart.setChartStyle("hollow");
    } else if (chartStyle === "bar") {
      chart.addBarSeries(theme.bar);
    } else if (chartStyle === "line") {
      chart.addLineSeries(theme.line);
    } else if (chartStyle === "baseline") {
      chart.addBaselineSeries(theme.baseline);
    } else if (chartStyle === "ha") {
      chart.addCandlestickSeries(theme.candle);
      chart.setChartStyle("ha");
    } else {
      chart.addAreaSeries(theme.area);
    }
    chart.addVolumeSeries(theme.volume);
    const setSmartData = (data: KLineData[]) => {
      chart.setData(data);
      if (data.length < 2) return;
      const width = containerRef.current?.clientWidth ?? 0;
      if (width <= 0) return;
      const targetBars = Math.max(56, Math.min(140, Math.floor(width / 9)));
      chart.setVisibleLogicalRange({ from: Math.max(0, data.length - targetBars), to: data.length - 1 });
    };
    let disposed = false;
    let currentData: KLineData[] = [];
    let loadSequence = 0;
    const loadData = async (nextSymbol: string, nextPeriod: Period) => {
      const sequence = ++loadSequence;
      const data = await loadHistoricalData(nextSymbol, nextPeriod);
      if (disposed || sequence !== loadSequence) return;
      currentData = data;
      setSmartData(data);
    };
    void loadData(symbol, period);
    const comparePanes = createComparePanes(chart, period);
    comparePanesRef.current = comparePanes;
    comparePanes.sync(latestCompareSymbolsRef.current);
    pluginTemplates.forEach((template) => chart.registerIndicatorTemplate(template));
    // Recreate persisted indicators for this panel if any
    if (Array.isArray(initialIndicatorsRef.current) && initialIndicatorsRef.current.length > 0) {
      initialIndicatorsRef.current.forEach((ind) => {
        try {
          if (ind.formula) return; // Retired free-form indicators are not executable plugins.
          chart.createIndicator(ind.name, {
            id: ind.id, calcParams: ind.calcParams, newPane: ind.newPane ?? true,
          });
        } catch (e) {
          console.warn('Failed to restore indicator', ind, e);
        }
      });
    }

    chart.setMagnetMode(magnetMode);
    chart.setPriceScaleMode(priceScaleMode);
    chart.setInvertScale(invertScale);
    chart.setDrawingDefaults(latestDrawingDefaultsRef.current);
    chart.setDrawingMode(latestActiveToolRef.current ?? null);

    let replayData: KLineData[] = [];
    let replayIndex = replayData.length;
    let replayEndTimestamp = Number.POSITIVE_INFINITY;
    const adapter: ChartAdapter = {
      setSymbol: (nextSymbol) => {
        latestSymbolRef.current = nextSymbol;
        chart.applyOptions({
          watermark: {
            visible: watermarkVisible,
            text: nextSymbol,
            color: watermarkVisible ? theme.watermark : "rgba(0, 0, 0, 0)",
          },
        });
        void loadData(nextSymbol, latestPeriodRef.current);
      },
      setPeriod: (nextPeriod) => {
        latestPeriodRef.current = nextPeriod;
        chart.setPeriod(nextPeriod);
        void loadData(latestSymbolRef.current, nextPeriod);
      },
      focusTimestamp: (nextTimestamp, options) => {
        const data = currentData;
        if (data.length === 0) {
          return;
        }

        let nearestIndex = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;
        data.forEach((item, index) => {
          const distance = Math.abs(item.timestamp - nextTimestamp);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });

        const span = Math.max(24, Math.min(data.length, Math.round(options?.span ?? 72)));
        const halfSpan = span / 2;
        chart.setVisibleLogicalRange({
          from: Math.max(0, nearestIndex - halfSpan),
          to: Math.min(data.length - 1, nearestIndex + halfSpan),
        });
      },
      setChartStyle: (nextStyle) => chart.setChartStyle(nextStyle),
      setMagnetMode: (enabled) => chart.setMagnetMode(enabled),
      setPriceScaleMode: (mode) => chart.setPriceScaleMode(mode),
      setInvertScale: (inverted) => chart.setInvertScale(inverted),
      setDrawingDefaults: (defaults) => chart.setDrawingDefaults(defaults),
      startDrawing: (tool) => chart.setDrawingMode(tool),
      clearDrawings: () => chart.clearOverlays(),
      clearCurrentLayer: () => chart.clearActiveDrawingLayer(),
      getDrawingLayers: () => chart.getDrawingLayers(),
      getActiveDrawingLayerId: () => chart.getActiveDrawingLayerId(),
      createDrawingLayer: (name) => chart.createDrawingLayer(name),
      setActiveDrawingLayer: (layerId) => chart.setActiveDrawingLayer(layerId),
      deleteDrawingLayer: (layerId) => chart.deleteDrawingLayer(layerId),
      refresh: () => { void loadData(latestSymbolRef.current, latestPeriodRef.current); },
      undo: () => chart.undo(),
      redo: () => chart.redo(),
      exportDrawings: () => chart.exportOverlaysJSON(),
      importDrawings: (json) => chart.importOverlaysJSON(json),
      toggleWatermark: (visible) => {
        chart.applyOptions({
          watermark: {
            visible,
            text: latestSymbolRef.current,
            color: visible ? theme.watermark : "rgba(0, 0, 0, 0)",
          },
        });
      },
      screenshot: async () => chart.takeScreenshot(),
      setReplayRange: (startTimestamp, endTimestamp) => {
        replayData = currentData;
        replayEndTimestamp = Math.max(startTimestamp, endTimestamp);
        const found = replayData.findIndex((bar) => bar.timestamp >= startTimestamp);
        replayIndex = found < 0 ? Math.max(1, replayData.length - 1) : Math.max(1, found);
        setSmartData(replayData.slice(Math.max(0, replayIndex - 120), replayIndex));
      },
      replayStep: () => {
        const next = replayData[replayIndex];
        if (!next || next.timestamp > replayEndTimestamp) return false;
        chart.updateData(next);
        replayIndex += 1;
        return replayIndex < replayData.length && replayData[replayIndex].timestamp <= replayEndTimestamp;
      },
      addIndicator: (name, options) => {
        chart.createIndicator(name, options);
      },
      removeIndicator: (paneId, indicatorId) => {
        chart.removeIndicator(paneId, indicatorId);
      },
      getRegisteredIndicators: () => {
        return chart.getRegisteredIndicatorTemplates().map(t => ({
          shortName: t.shortName,
          name: t.name,
        }));
      },

    };

    const unsubscribeIndicator = chart.subscribe('indicatorRemoved', ({ indicatorId }) => {
      latestOnIndicatorRemovedRef.current?.(indicatorId);
    });
    const unsubscribeOverlay = chart.subscribeOverlayChange((params) => {
      if (params.reason === "created") {
        latestOnDrawingEndRef.current?.();
      }
    });

    chartRef.current = chart;
    latestOnReadyRef.current(adapter);

    return () => {
      disposed = true;
      comparePanes.dispose();
      comparePanesRef.current = null;
      unsubscribeOverlay();
      unsubscribeIndicator();
      chart.destroy();
      chartRef.current = null;
    };
  }, [
    chartStyle,
    invertScale,
    magnetMode,
    period,
    priceScaleMode,
    resolvedThemeMode,
    symbol,
    theme.area,
    theme.axisAltBg,
    theme.axisBg,
    theme.axisBorder,
    theme.axisGrid,
    theme.axisGridStrong,
    theme.axisText,
    theme.bar,
    theme.candle,
    theme.chartBg,
    theme.crosshair,
    theme.line,
    theme.baseline,
    theme.volume,
    theme.watermark,
    watermarkVisible,
  ]);

  useLayoutEffect(() => {
    latestActiveToolRef.current = activeTool;
    if (chartRef.current) {
      chartRef.current.setDrawingMode(activeTool ?? null);
    }
  }, [activeTool]);

  useEffect(() => {
    chartRef.current?.setDrawingDefaults(drawingDefaults);
  }, [drawingDefaults]);

  useEffect(() => {
    if (!containerRef.current || !chartBackground) return;
    containerRef.current.style.background = chartBackground.mode === 'gradient'
      ? `linear-gradient(to bottom, ${chartBackground.top}, ${chartBackground.bottom})`
      : chartBackground.top;
  }, [chartBackground]);

  return <div ref={containerRef} className="w-full h-full" />;
}
