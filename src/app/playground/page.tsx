"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  Activity,
  ArrowUpDown,
  Camera,
  Columns2,
  Columns4,
  Grid2x2,
  Magnet,
  Layers,
  Maximize2,
  MessageSquare,
  Palette,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Rows2,
  Rows4,
  Settings,
  Square,
  Trash2,
  TrendingUp,
  MoveHorizontal,
  Eraser,
} from "lucide-react";

import type { PriceScaleMode } from "fscandle";
import type { DrawingLayer } from "fscandle";
import {
  createDefaultWorkspaceState,
  loadWorkspaceState,
  mergeRecentWorkspaceSymbol,
  normalizeWorkspaceState,
  saveWorkspaceState,
  uniqueSymbolList,
  type WorkspaceState,
} from "@/store/WorkspaceStore";
import { THEMES, themeCssVars, type ThemeMode } from "../ui/theme";
import {
  ChartViewport,
  type ChartAdapter,
  type ChartStyle,
  type DrawingDefaults,
  type Period,
} from "./PlaygroundChart";
import {
  badge as badgeClass,
  button,
  cn,
  colorInput,
  colorSwatch,
  controlGroup,
  emptyState,
  iconButton,
  input,
  menuItem,
  select,
  surface,
  text,
  toggleButton,
} from "../ui/styles";

type LayoutMode = "single" | "split-horizontal" | "split-vertical" | "quad-horizontal" | "quad-vertical" | "quad-grid";

const PERIODS: Period[] = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];
const DRAWING_COLORS = ["#2962FF", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#F8FAFC"];
const EMPTY_COMPARE_SYMBOLS: string[] = [];

const DRAWING_TOOLS = [
  {
    id: "line:trend",
    label: "Line Tools",
    icon: TrendingUp,
    presets: [
      { id: "line:trend", label: "Trendline" },
      { id: "line:horizontal", label: "Horizontal Line" },
      { id: "line:ray", label: "Ray" },
      { id: "line:vertical", label: "Vertical Line" },
      { id: "line:infinite", label: "Extended Line" },
    ],
  },
  {
    id: "channel:parallel",
    label: "Channels",
    icon: MoveHorizontal,
    presets: [
      { id: "channel:parallel", label: "Parallel Channel" },
      { id: "channel:price", label: "Price Channel" },
    ],
  },
  { id: "rectangle", label: "Rectangle", icon: Square },
  {
    id: "measure",
    label: "Measurement & Ratios",
    icon: ArrowUpDown,
    presets: [
      { id: "measure", label: "Price & Bar Range" },
      { id: "fibonacci", label: "Fibonacci Retracement" },
    ],
  },
  {
    id: "wave:three",
    label: "Patterns",
    icon: Activity,
    presets: [
      { id: "wave:three", label: "3 Wave" },
      { id: "wave:five", label: "5 Wave" },
      { id: "wave:abcd", label: "ABCD Pattern" },
      { id: "wave:abcde", label: "ABCDE Pattern" },
    ],
  },
  {
    id: "annotation:text",
    label: "Annotation",
    icon: MessageSquare,
    presets: [
      { id: "annotation:text", label: "Text" },
      { id: "annotation:arrow", label: "Arrow" },
      { id: "annotation:tag", label: "Price Tag" },
      { id: "annotation:image", label: "Image" },
    ],
  },
];


const LAYOUT_OPTIONS: Array<{ id: LayoutMode; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: "single", label: "Single", icon: Square },
  { id: "split-horizontal", label: "2 Horz", icon: Columns2 },
  { id: "split-vertical", label: "2 Vert", icon: Rows2 },
  { id: "quad-horizontal", label: "4 Horz", icon: Columns4 },
  { id: "quad-vertical", label: "4 Vert", icon: Rows4 },
  { id: "quad-grid", label: "4 Grid", icon: Grid2x2 },
];

interface SymbolCatalogEntry {
  symbol: string;
  name: string;
  region: string;
}

const SYMBOL_SEARCH_CATALOG: SymbolCatalogEntry[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF", region: "US ETF" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", region: "US ETF" },
  { symbol: "BTC", name: "Bitcoin / US Dollar", region: "Crypto" },
  { symbol: "NVDA", name: "NVIDIA", region: "US Equity" },
];

const normalizeSymbolValue = (value: string) => value.trim().toUpperCase();

const getSymbolCatalogEntry = (symbol: string): SymbolCatalogEntry => {
  return SYMBOL_SEARCH_CATALOG.find((item) => item.symbol === symbol) ?? {
    symbol,
    name: "Custom symbol",
    region: "Custom",
  };
};

const equalStringArrays = (left: string[], right: string[]) => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
};

const equalStringMatrix = (left: string[][], right: string[][]) => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((row, index) => equalStringArrays(row, right[index] ?? []));
};

const equalWorkspaceState = (left: WorkspaceState, right: WorkspaceState) => {
  return left.activePanelIndex === right.activePanelIndex
    && equalStringArrays(left.watchlist, right.watchlist)
    && equalStringArrays(left.panelSymbols, right.panelSymbols)
    && equalStringArrays(left.recentSymbols, right.recentSymbols)
    && equalStringMatrix(left.panelCompareSymbols, right.panelCompareSymbols);
};

export default function PlaygroundPage() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [period, setPeriod] = useState<Period>("1d");
  const [layout, setLayout] = useState<LayoutMode>("single");
  const [chartStyle, setChartStyle] = useState<ChartStyle>("candle");
  const [magnetMode, setMagnetMode] = useState(true);
  const [priceScaleMode, setPriceScaleMode] = useState<PriceScaleMode>("normal");
  const [invertScale, setInvertScale] = useState(false);
  const [watermarkVisible, setWatermarkVisible] = useState(true);
  const [activeTool, setActiveTool] = useState<string | undefined>();
  const [showSettings, setShowSettings] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showSymbolMenu, setShowSymbolMenu] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [openSidebarTool, setOpenSidebarTool] = useState<string | null>(null);
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(() => createDefaultWorkspaceState());
  const [hasHydratedWorkspace, setHasHydratedWorkspace] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState("SPY");

  const [drawingLayers, setDrawingLayers] = useState<DrawingLayer[]>([]);
  const [activeDrawingLayerId, setActiveDrawingLayerId] = useState("layer_default");
  const [drawingDefaults, setDrawingDefaults] = useState<DrawingDefaults>({
    color: "#2962FF",
    lineWidth: 2,
  });
  const [chartBackground, setChartBackground] = useState<{ mode: 'solid' | 'gradient'; top: string; bottom: string }>({
    mode: 'solid',
    top: '#131722',
    bottom: '#30384c',
  });
  const [replayStartDate, setReplayStartDate] = useState("2025-01-01");
  const [replayEndDate, setReplayEndDate] = useState("2025-12-31");
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replayInitialized, setReplayInitialized] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const symbolMenuRef = useRef<HTMLDivElement | null>(null);

  const mainAdapter = useRef<ChartAdapter | null>(null);
  const panel1 = useRef<ChartAdapter | null>(null);
  const panel2 = useRef<ChartAdapter | null>(null);
  const panel3 = useRef<ChartAdapter | null>(null);
  const panel4 = useRef<ChartAdapter | null>(null);

  const layoutClasses = useMemo(() => {
    const map: Record<LayoutMode, string[]> = {
      single: ["w-full h-full"],
      "split-horizontal": ["w-1/2 h-full", "w-1/2 h-full"],
      "split-vertical": ["w-full h-1/2", "w-full h-1/2"],
      "quad-horizontal": ["w-1/4 h-full", "w-1/4 h-full", "w-1/4 h-full", "w-1/4 h-full"],
      "quad-vertical": ["w-full h-1/4", "w-full h-1/4", "w-full h-1/4", "w-full h-1/4"],
      "quad-grid": ["w-1/2 h-1/2", "w-1/2 h-1/2", "w-1/2 h-1/2", "w-1/2 h-1/2"],
    };
    return map[layout];
  }, [layout]);

  const panelSymbols = workspaceState.panelSymbols;
  const watchlistSymbols = workspaceState.watchlist;
  const requestedActivePanelIndex = workspaceState.activePanelIndex;
  const panelCompareSymbols = workspaceState.panelCompareSymbols;
  const activePanelIndex = Math.min(requestedActivePanelIndex, layoutClasses.length - 1);
  const symbol = panelSymbols[activePanelIndex] ?? panelSymbols[0] ?? "SPY";
  const compareSymbols = panelCompareSymbols[activePanelIndex] ?? EMPTY_COMPARE_SYMBOLS;
  const canUseCompareSeries = layout === "single";

  const filteredSymbolResults = useMemo(() => {
    const query = symbolSearch.trim().toLowerCase();

    return SYMBOL_SEARCH_CATALOG.filter((item) => {
      if (!query || query === symbol.toLowerCase()) {
        return true;
      }

      return (
        item.symbol.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.region.toLowerCase().includes(query)
      );
    });
  }, [symbol, symbolSearch]);

  const watchlistEntries = useMemo(
    () => uniqueSymbolList(watchlistSymbols).map((item) => getSymbolCatalogEntry(item)),
    [watchlistSymbols],
  );

  const updateWorkspaceState = (updater: (current: WorkspaceState) => WorkspaceState) => {
    setWorkspaceState((current) => {
      const next = normalizeWorkspaceState(updater(current));
      return equalWorkspaceState(current, next) ? current : next;
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncViewportMode = () => {
      setIsCompactViewport(mediaQuery.matches);
    };

    syncViewportMode();
    mediaQuery.addEventListener("change", syncViewportMode);

    return () => {
      mediaQuery.removeEventListener("change", syncViewportMode);
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const restoredState = loadWorkspaceState();
      setWorkspaceState(restoredState);
      setSymbolSearch(restoredState.panelSymbols[0] ?? "SPY");
      setHasHydratedWorkspace(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hasHydratedWorkspace) {
      return;
    }

    saveWorkspaceState(workspaceState);
  }, [hasHydratedWorkspace, workspaceState]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target) {
        return;
      }

      if (showSymbolMenu && !target.closest('[data-transient-surface="symbol"]')) {
        setShowSymbolMenu(false);
      }

      if (showStyleMenu && !target.closest('[data-transient-surface="styles"]')) {
        setShowStyleMenu(false);
      }

      if (showSettings && !target.closest('[data-transient-surface="settings"]')) {
        setShowSettings(false);
      }

      if (openSidebarTool && !target.closest('[data-transient-surface="sidebar"]')) {
        setOpenSidebarTool(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowSymbolMenu(false);
        setShowStyleMenu(false);
        setShowSettings(false);
        setOpenSidebarTool(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openSidebarTool, showSettings, showSymbolMenu, showStyleMenu]);

  useEffect(() => {
    const activeAdapter = activePanelIndex === 0 ? (mainAdapter.current ?? panel1.current) : [panel1.current, panel2.current, panel3.current, panel4.current][activePanelIndex];
    if (!activeAdapter) {
      return;
    }

    setDrawingLayers(activeAdapter.getDrawingLayers());
    setActiveDrawingLayerId(activeAdapter.getActiveDrawingLayerId());
  }, [activePanelIndex, layout]);

  const getVisibleAdapters = (): ChartAdapter[] => {
    if (layout === "single") {
      return mainAdapter.current ? [mainAdapter.current] : [];
    }
    if (layout === "split-horizontal" || layout === "split-vertical") {
      return [panel1.current, panel2.current].filter((x): x is ChartAdapter => Boolean(x));
    }
    return [panel1.current, panel2.current, panel3.current, panel4.current].filter(
      (x): x is ChartAdapter => Boolean(x),
    );
  };

  const applyToVisible = (fn: (adapter: ChartAdapter) => void) => {
    for (const adapter of getVisibleAdapters()) {
      fn(adapter);
    }
  };

  useEffect(() => {
    if (!replayPlaying) return;
    const timer = window.setInterval(() => {
      const hasMore = getVisibleAdapters().map((adapter) => adapter.replayStep()).some(Boolean);
      if (!hasMore) setReplayPlaying(false);
    }, 420);
    return () => window.clearInterval(timer);
    // Adapter refs are intentionally imperative; playback state owns the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayPlaying]);

  const assignPanelAdapter = (index: number, adapter: ChartAdapter) => {
    if (index === 0) panel1.current = adapter;
    if (index === 1) panel2.current = adapter;
    if (index === 2) panel3.current = adapter;
    if (index === 3) panel4.current = adapter;
  };

  const getPanelAdapter = (index: number) => {
    if (index === 0) {
      return layout === "single" ? (mainAdapter.current ?? panel1.current) : panel1.current;
    }

    return [panel2.current, panel3.current, panel4.current][index - 1] ?? null;
  };

  const theme = THEMES[themeMode];
  const themeVars = themeCssVars(theme);

  const primaryAdapter = () => getPanelAdapter(activePanelIndex) ?? getVisibleAdapters()[0] ?? null;
  const syncDrawingLayers = () => {
    const first = primaryAdapter();
    if (!first) {
      return;
    }
    setDrawingLayers(first.getDrawingLayers());
    setActiveDrawingLayerId(first.getActiveDrawingLayerId());
  };
  const applyLayerMutation = (fn: (adapter: ChartAdapter) => void) => {
    applyToVisible(fn);
    syncDrawingLayers();
  };
  const closeTransientMenus = () => {
    setShowSymbolMenu(false);
    setShowStyleMenu(false);
    setShowSettings(false);
    setOpenSidebarTool(null);
  };
  const activateDrawingTool = (toolId: string) => {
    flushSync(() => {
      setActiveTool(toolId);
      setOpenSidebarTool(null);
      setShowStyleMenu(false);
      if (isCompactViewport) {
        setShowSettings(false);
        setShowSymbolMenu(false);
      }
    });
    applyToVisible((adapter) => adapter.startDrawing(toolId));
    // A viewport can be recreated as part of the same React update (notably
    // while workspace state is hydrating). Reapply once that commit settles so
    // the event layer that receives the next pointer event owns the tool.
    queueMicrotask(() => applyToVisible((adapter) => adapter.startDrawing(toolId)));
  };
  const setActivePanel = (panelIndex: number) => {
    if (activePanelIndex === panelIndex) {
      return;
    }

    updateWorkspaceState((current) => ({
      ...current,
      activePanelIndex: panelIndex,
    }));
  };
  const setPanelSymbol = (panelIndex: number, nextSymbol: string, options?: { addToWatchlist?: boolean }) => {
    const normalized = normalizeSymbolValue(nextSymbol);
    if (!normalized) {
      return;
    }

    updateWorkspaceState((current) => {
      const nextPanelSymbols = [...current.panelSymbols];
      nextPanelSymbols[panelIndex] = normalized;
      const nextPanelCompareSymbols = current.panelCompareSymbols.map((symbols, index) =>
        index === panelIndex ? symbols.filter((item) => item !== normalized) : symbols,
      );

      return {
        ...current,
        activePanelIndex: panelIndex,
        panelSymbols: nextPanelSymbols,
        watchlist: options?.addToWatchlist ? uniqueSymbolList([...current.watchlist, normalized]) : current.watchlist,
        recentSymbols: mergeRecentWorkspaceSymbol(normalized, current.recentSymbols),
        panelCompareSymbols: nextPanelCompareSymbols,
      };
    });
  };
  const addWatchlistSymbol = (nextSymbol: string) => {
    const normalized = normalizeSymbolValue(nextSymbol);
    if (!normalized) {
      return;
    }

    updateWorkspaceState((current) => ({
      ...current,
      watchlist: uniqueSymbolList([...current.watchlist, normalized]),
    }));
  };
  const removeWatchlistSymbol = (nextSymbol: string) => {
    const normalized = normalizeSymbolValue(nextSymbol);
    updateWorkspaceState((current) => ({
      ...current,
      watchlist: current.watchlist.filter((item) => item !== normalized),
    }));
  };

  const toggleActivePanelCompareSymbol = (nextSymbol: string) => {
    const normalized = normalizeSymbolValue(nextSymbol);
    if (!canUseCompareSeries || !normalized || normalized === symbol) {
      return;
    }

    updateWorkspaceState((current) => {
      const nextPanelCompareSymbols = current.panelCompareSymbols.map((symbols, index) => {
        if (index !== current.activePanelIndex) {
          return symbols;
        }

        if (symbols.includes(normalized)) {
          return symbols.filter((item) => item !== normalized);
        }

        return [...symbols, normalized].slice(0, 5);
      });

      return {
        ...current,
        panelCompareSymbols: nextPanelCompareSymbols,
      };
    });
  };
  const activateWorkspaceSymbol = (nextSymbol: string, options?: { closeMenu?: boolean }) => {
    const normalized = normalizeSymbolValue(nextSymbol);
    if (!normalized) {
      return;
    }

    setPanelSymbol(activePanelIndex, normalized);
    setReplayPlaying(false);
    setReplayInitialized(false);
    setSymbolSearch(normalized);

    if (options?.closeMenu) {
      setShowSymbolMenu(false);
    }
  };
  const applySymbolSelection = (nextSymbol: string) => {
    activateWorkspaceSymbol(nextSymbol, { closeMenu: true });
  };
  const toggleCompareSymbol = (nextSymbol: string) => {
    toggleActivePanelCompareSymbol(nextSymbol);
  };
  const updateDrawingDefaults = (defaults: Partial<DrawingDefaults>) => {
    setDrawingDefaults((current) => {
      const next = {
        ...current,
        ...defaults,
      };
      applyToVisible((adapter) => adapter.setDrawingDefaults(next));
      return next;
    });
  };

  const onScreenshot = async () => {
    const first = primaryAdapter();
    if (!first) {
      return;
    }
    const dataUrl = await first.screenshot();
    if (!dataUrl) {
      return;
    }
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `playground-style-${symbol.replace(/[^a-z0-9-]+/gi, '_')}.png`;
    // A programmatic download needs the anchor in the document in some browsers.
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const onImportDrawings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const content = await file.text();
    applyToVisible((adapter) => adapter.importDrawings(content));
    syncDrawingLayers();
    event.target.value = "";
  };

  return (
    <div ref={rootRef} style={themeVars} className={`h-screen w-screen ${surface.shell} ${text.main} overflow-hidden flex flex-col`}>
      <div className={`relative z-[5000] flex ${isCompactViewport ? "flex-wrap items-start justify-start gap-1" : "items-center justify-between gap-1 whitespace-nowrap"} overflow-visible border-b px-2 py-1.5 ${surface.chrome}`}>
        <input ref={importInputRef} type="file" accept=".json,application/json" className="hidden" onChange={onImportDrawings} />

        <div className={isCompactViewport ? "flex w-full min-w-0 flex-wrap items-center gap-1 pb-1" : "flex items-center gap-1 shrink-0"}>
          <div ref={symbolMenuRef} data-transient-surface="symbol" className="relative">
            <div className="relative">
              <input
                value={symbolSearch}
                onFocus={() => {
                  setShowSymbolMenu(true);
                  setShowSettings(false);
                  setShowStyleMenu(false);
                }}
                onChange={(event) => {
                  setSymbolSearch(event.target.value.toUpperCase());
                  setShowSymbolMenu(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applySymbolSelection(symbolSearch);
                  }
                }}
                className={input("lg", "w-20 px-2 text-xs font-semibold uppercase")}
                placeholder="Symbol"
              />
            </div>

            {showSymbolMenu && (
              <div
                data-testid="symbol-picker-menu"
                data-transient-surface="symbol"
                className={isCompactViewport
                  ? `fixed left-3 right-3 top-[148px] z-[5200] max-h-[calc(100vh-232px)] overflow-y-auto p-2 ${surface.popover}`
                  : `absolute left-0 top-[44px] z-50 w-[484px] p-2 ${surface.popover}`}
              >
                <div className={isCompactViewport ? "grid grid-cols-1 gap-1" : "grid grid-cols-2 gap-1"}>
                  <div className="min-w-0">
                    <div className="mb-1.5 flex items-center justify-between gap-1">
                      <div className={text.label}>
                        Search Results
                      </div>
                      <span className={badgeClass}>{filteredSymbolResults.length}</span>
                    </div>

                    <div className={`space-y-1 overflow-y-auto ${isCompactViewport ? "max-h-48" : "max-h-72 pr-0.5"}`}>
                      {filteredSymbolResults.length > 0 ? (
                        filteredSymbolResults.map((item) => {
                          const isWatched = watchlistSymbols.includes(item.symbol);
                          const isActive = symbol === item.symbol;
                          const isCompared = compareSymbols.includes(item.symbol);

                          return (
                            <div
                              key={item.symbol}
                              role="button"
                              tabIndex={0}
                              data-testid={`symbol-search-result-${item.symbol}`}
                              onClick={() => applySymbolSelection(item.symbol)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  applySymbolSelection(item.symbol);
                                }
                              }}
                              className={menuItem(isActive)}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="min-w-0 flex items-baseline gap-1 cursor-pointer">
                                  <div className="shrink-0 text-[12px] font-semibold uppercase">{item.symbol}</div>
                                  <div className={`truncate text-[10px] ${text.muted}`}>{item.name}</div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {canUseCompareSeries && item.symbol !== symbol && (
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        toggleCompareSymbol(item.symbol);
                                      }}
                                      className={toggleButton(isCompared, "sm", "px-2")}
                                      title={isCompared ? `Remove ${item.symbol} comparison` : `Add ${item.symbol} as compare line`}
                                    >
                                      {isCompared ? "Compared" : "+ Compare"}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      if (isWatched) {
                                        removeWatchlistSymbol(item.symbol);
                                      } else {
                                        addWatchlistSymbol(item.symbol);
                                      }
                                    }}
                                    aria-label={isWatched ? "Remove from watchlist" : "Add to watchlist"}
                                    className={`${iconButton("ghost", "sm")}`}
                                    title={isWatched ? `Remove ${item.symbol} from watchlist` : `Add ${item.symbol} to watchlist`}
                                  >
                                    <span className="text-[12px] leading-none font-semibold">{isWatched ? "★" : "+"}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className={emptyState}>
                          No symbols match {symbolSearch || "this query"}.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="mb-1.5 flex items-center justify-between gap-1">
                      <div className={text.label}>
                        Watchlist
                      </div>
                      <span className={badgeClass}>{watchlistEntries.length}</span>
                    </div>

                    <div className={`space-y-1 overflow-y-auto ${isCompactViewport ? "max-h-40" : "max-h-72 pl-0.5"}`}>
                      {watchlistEntries.length > 0 ? (
                        watchlistEntries.map((item) => {
                          const isActive = symbol === item.symbol;
                          const isCompared = compareSymbols.includes(item.symbol);

                          return (
                            <div
                              key={item.symbol}
                              role="button"
                              tabIndex={0}
                              data-testid={`watchlist-symbol-${item.symbol}`}
                              onClick={() => applySymbolSelection(item.symbol)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  applySymbolSelection(item.symbol);
                                }
                              }}
                              className={menuItem(isActive)}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="min-w-0 flex items-baseline gap-1 cursor-pointer">
                                  <div className="shrink-0 text-[12px] font-semibold uppercase">{item.symbol}</div>
                                  <div className={`truncate text-[10px] ${text.muted}`}>{item.name}</div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {canUseCompareSeries && item.symbol !== symbol && (
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        toggleCompareSymbol(item.symbol);
                                      }}
                                      className={toggleButton(isCompared, "sm", "px-2")}
                                      title={isCompared ? `Remove ${item.symbol} comparison` : `Add ${item.symbol} as compare line`}
                                    >
                                      {isCompared ? "Compared" : "+ Compare"}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      removeWatchlistSymbol(item.symbol);
                                    }}
                                    aria-label="Remove"
                                    className={iconButton("ghost", "sm")}
                                    title={`Remove ${item.symbol} from watchlist`}
                                  >
                                    <span className="text-[16px] leading-none">×</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className={emptyState}>
                          Add symbols from the search column to build your watchlist.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <select
            value={period}
            onChange={(event) => {
              const next = event.target.value as Period;
              setReplayPlaying(false);
              setReplayInitialized(false);
              setPeriod(next);
              applyToVisible((adapter) => adapter.setPeriod(next));
            }}
            className={select("lg", "w-20 pl-1.5 pr-5 text-xs")}
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={chartStyle}
            onChange={(event) => {
              const next = event.target.value as ChartStyle;
              setChartStyle(next);
              applyToVisible((adapter) => adapter.setChartStyle(next));
            }}
            className={select("lg", "w-20 pl-1.5 pr-5 text-xs")}
            title="Chart Style"
          >
            <option value="candle">Candle</option>
            <option value="hollow">Hollow</option>
            <option value="line">Line</option>
            <option value="baseline">Base</option>
            <option value="area">Area</option>
            <option value="ha">Heikin</option>
            <option value="bar">Bar</option>
          </select>

          {/* Active Comparison Chips in Top Toolbar */}
          {canUseCompareSeries && compareSymbols.length > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              {compareSymbols.map((item, idx) => {
                const colors = ["#38bdf8", "#f59e0b", "#a78bfa", "#10b981", "#fb7185"];
                const color = colors[idx % colors.length];
                return (
                  <div
                    key={item}
                    className="flex items-center gap-1 px-2 h-8 rounded-md border border-[color:var(--border)] bg-[var(--control-bg)] text-xs font-semibold"
                  >
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="tracking-wide">{item}</span>
                    <button
                      type="button"
                      onClick={() => toggleCompareSymbol(item)}
                      className="ml-0.5 text-xs text-[color:var(--text-muted)] hover:text-red-400 font-semibold"
                      title={`Remove comparison for ${item}`}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Magnet Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !magnetMode;
              setMagnetMode(next);
              applyToVisible((adapter) => adapter.setMagnetMode(next));
            }}
            className={iconButton(magnetMode ? "primary" : "subtle", "lg")}
            title={magnetMode ? "Magnet Snapping: ON" : "Magnet Snapping: OFF"}
          >
            <Magnet size={17} />
          </button>

          <button
            data-transient-surface="settings"
            onClick={() => {
              setShowStyleMenu(false);
              setOpenSidebarTool(null);
              syncDrawingLayers();
              setShowSettings((v) => !v);
            }}
            className={`${iconButton(showSettings ? "primary" : "subtle", "lg")}`}
            title="Chart Settings"
          >
            <Settings size={18} />
          </button>

          {/* Quick Actions */}
          <button
            onClick={() => applyToVisible((adapter) => adapter.undo())}
            className={iconButton("subtle", "lg")}
            title="Undo"
          >
            <RotateCcw size={17} />
          </button>
          <button
            onClick={() => applyToVisible((adapter) => adapter.redo())}
            className={iconButton("subtle", "lg")}
            title="Redo"
          >
            <RotateCw size={17} />
          </button>
          <button
            onClick={() => {
              applyLayerMutation((adapter) => adapter.clearCurrentLayer());
              setActiveTool(undefined);
            }}
            className={iconButton("subtle", "lg")}
            title="Clear Current Layer"
          >
            <Eraser size={17} />
          </button>
          <button
            onClick={() => applyToVisible((adapter) => adapter.refresh())}
            className={iconButton("subtle", "lg")}
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={onScreenshot}
            className={iconButton("subtle", "lg")}
            title="Screenshot"
          >
            <Camera size={18} />
          </button>
          <button
            onClick={() => {
              if (document.fullscreenElement) {
                void document.exitFullscreen();
                return;
              }
              void rootRef.current?.requestFullscreen();
            }}
            className={iconButton("subtle", "lg")}
            title="Fullscreen"
          >
            <Maximize2 size={18} />
          </button>

          <div className={controlGroup("lg", "gap-0.5 px-1")} title="Replay date range">
            <input aria-label="Replay start date" type="date" value={replayStartDate} max={replayEndDate} onChange={(event) => { setReplayStartDate(event.target.value); setReplayPlaying(false); setReplayInitialized(false); }} className="ui-date h-7 w-[101px] bg-transparent px-1 text-[10px] text-[color:var(--text-main)] outline-none" />
            <span aria-hidden="true" className={`px-0.5 text-[10px] ${text.muted}`}>–</span>
            <input aria-label="Replay end date" type="date" value={replayEndDate} min={replayStartDate} onChange={(event) => { setReplayEndDate(event.target.value); setReplayPlaying(false); setReplayInitialized(false); }} className="ui-date h-7 w-[101px] bg-transparent px-1 text-[10px] text-[color:var(--text-main)] outline-none" />
            <button
              type="button"
              className={iconButton(replayPlaying ? "primary" : "ghost", "sm", "shrink-0")}
              title={replayPlaying ? "Pause replay" : "Play selected range"}
              aria-label={replayPlaying ? "Pause replay" : "Play replay"}
              onClick={() => {
                if (replayPlaying) { setReplayPlaying(false); return; }
                if (!replayInitialized) {
                  const start = new Date(`${replayStartDate}T00:00:00`).getTime();
                  const end = new Date(`${replayEndDate}T23:59:59.999`).getTime();
                  applyToVisible((adapter) => adapter.setReplayRange(start, end));
                  setReplayInitialized(true);
                }
                setReplayPlaying(true);
              }}
            >
              {replayPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>
        </div>

        {showSettings && (
          <div
            data-transient-surface="settings"
            data-testid="settings-menu"
            className={isCompactViewport
              ? `fixed right-1 top-[220px] z-[5200] max-h-[calc(100vh-228px)] w-[280px] overflow-y-auto p-2 ${surface.popover}`
              : `absolute top-[48px] left-[180px] z-40 max-h-[calc(100vh-72px)] w-[360px] p-2.5 ${surface.popover}`}
          >
            <div className={`mb-2 flex items-center gap-1 text-xs font-semibold ${text.main}`}>
              <Settings size={14} />
              <span>Chart Settings</span>
            </div>

            <div className="space-y-2">
              {/* Scale & Axis */}
              <div>
                <div className={cn("mb-1 flex items-center gap-1", text.label)}>
                  <span>Scale & Axis</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    data-testid="view-price-scale-normal"
                    onClick={() => {
                      setPriceScaleMode("normal");
                      applyToVisible((adapter) => adapter.setPriceScaleMode("normal"));
                    }}
                    className={toggleButton(priceScaleMode === "normal", "sm", "w-[80px] max-w-[80px] justify-center text-center truncate")}
                    title="Linear Price Scale"
                  >
                    Linear
                  </button>
                  <button
                    type="button"
                    data-testid="view-price-scale-log"
                    onClick={() => {
                      setPriceScaleMode("log");
                      applyToVisible((adapter) => adapter.setPriceScaleMode("log"));
                    }}
                    className={toggleButton(priceScaleMode === "log", "sm", "w-[80px] max-w-[80px] justify-center text-center truncate")}
                    title="Logarithmic Price Scale"
                  >
                    Log
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !invertScale;
                      setInvertScale(next);
                      applyToVisible((adapter) => adapter.setInvertScale(next));
                    }}
                    className={toggleButton(invertScale, "sm", "w-[80px] max-w-[80px] justify-center text-center truncate")}
                    title="Invert Price Axis"
                  >
                    Invert
                  </button>
                </div>
              </div>

              {/* Display & Files */}
              <div className="border-t border-[color:var(--border)] pt-1.5">
                <div className={cn("mb-1 flex items-center gap-1", text.label)}>
                  <span>Display & Files</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setThemeMode((mode) => (mode === "dark" ? "light" : "dark"));
                    }}
                    className={button("subtle", "sm", "w-[80px] max-w-[80px] justify-center text-center truncate")}
                    title="Toggle Theme"
                  >
                    {themeMode === "dark" ? "Dark" : "Light"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !watermarkVisible;
                      setWatermarkVisible(next);
                      applyToVisible((adapter) => adapter.toggleWatermark(next));
                    }}
                    className={toggleButton(watermarkVisible, "sm", "w-[80px] max-w-[80px] justify-center text-center truncate")}
                    title="Toggle Watermark"
                  >
                    Watermark
                  </button>
                  <button
                    type="button"
                    onClick={() => primaryAdapter()?.exportDrawings()}
                    className={button("subtle", "sm", "w-[80px] max-w-[80px] justify-center text-center truncate")}
                    title="Export Drawings JSON"
                  >
                    Export
                  </button>
                  <button
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                    className={button("subtle", "sm", "w-[80px] max-w-[80px] justify-center text-center truncate")}
                    title="Import Drawings JSON"
                  >
                    Import
                  </button>
                </div>
              </div>

              {/* Layout with Icons */}
              <div className="border-t border-[color:var(--border)] pt-1.5">
                <div className={cn("mb-1 flex items-center gap-1", text.label)}>
                  <span>Layout</span>
                </div>
                <div data-testid="layout-menu" className="flex flex-wrap gap-1">
                  {LAYOUT_OPTIONS.map((item) => (
                    <button
                      key={item.id}
                      data-layout-mode={item.id}
                      onClick={() => setLayout(item.id)}
                      className={toggleButton(layout === item.id, "sm", "w-[80px] max-w-[80px] justify-center items-center gap-1 text-center truncate")}
                      title={item.label}
                    >
                      <item.icon size={13} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drawing Layers (integrated into Settings) */}
              <div className="border-t border-[color:var(--border)] pt-1.5">
                <div className="mb-1.5 flex items-center justify-between gap-1">
                  <div className={cn("flex items-center gap-1", text.label)}>
                    <Layers size={13} />
                    <span>Drawing Layers</span>
                  </div>
                  <button
                    data-testid="create-drawing-layer"
                    onClick={() => {
                      applyLayerMutation((adapter) => {
                        const nextIndex = adapter.getDrawingLayers().length + 1;
                        adapter.createDrawingLayer(`Layer ${nextIndex}`);
                      });
                    }}
                    className={`${iconButton("subtle", "sm")} w-[80px] max-w-[80px] justify-center text-center`}
                    title="New Layer"
                  >
                    + New
                  </button>
                </div>
                <div className="space-y-1">
                  {(drawingLayers.length > 0 ? drawingLayers : [{ id: "layer_default", name: "Layer 1", overlays: [], createdAt: 0, updatedAt: 0 }]).map((layer) => (
                    <div key={layer.id} className="flex items-center gap-1">
                      <button
                        data-testid={`drawing-layer-${layer.id}`}
                        onClick={() => {
                          applyLayerMutation((adapter) => adapter.setActiveDrawingLayer(layer.id));
                        }}
                        className={toggleButton(activeDrawingLayerId === layer.id, "sm", "min-w-0 flex-1 justify-between text-left")}
                        title={layer.name}
                      >
                        <span className="truncate">{layer.name}</span>
                        <span className={badgeClass}>{layer.overlays.length}</span>
                      </button>
                      <button
                        onClick={() => {
                          applyLayerMutation((adapter) => adapter.deleteDrawingLayer(layer.id));
                        }}
                        disabled={drawingLayers.length <= 1}
                        className={`${iconButton("subtle", "sm")}`}
                        title="Delete Layer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <aside data-transient-surface="sidebar" className={`relative z-[3200] w-[52px] border-r flex flex-col items-center py-2.5 gap-1 ${surface.sidebar}`}>
          {DRAWING_TOOLS.map((tool) => (
            <div key={tool.id} className="relative">
              <button
                data-sidebar-drawing-tool={tool.id}
                onClick={() => {
                  if ("presets" in tool && tool.presets) {
                    setOpenSidebarTool((current) => current === tool.id ? null : tool.id);
                  } else {
                    setOpenSidebarTool(null);
                    activateDrawingTool(tool.id);
                  }
                }}
                className={iconButton(
                  activeTool === tool.id ||
                  Boolean(activeTool?.startsWith(tool.id.split(":")[0] + ":")) ||
                  Boolean("presets" in tool && tool.presets?.some((p) => p.id === activeTool))
                    ? "primary"
                    : "subtle",
                  "lg"
                )}
                title={tool.label}
              >
                <tool.icon size={16} />
              </button>
              {"presets" in tool && tool.presets && openSidebarTool === tool.id && (
                <div
                  data-testid={`sidebar-${tool.id.split(":")[0]}-menu`}
                  className={`absolute left-[44px] top-0 z-[3300] w-44 p-1 ${surface.popover}`}
                >
                  {tool.presets.map((preset) => (
                    <button
                      key={preset.id}
                      data-sidebar-drawing-tool={preset.id}
                      onClick={() => {
                        setOpenSidebarTool(null);
                        activateDrawingTool(preset.id);
                      }}
                      className={toggleButton(activeTool === preset.id, "md", "w-full justify-start text-left")}
                      title={preset.label}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="relative">
            <button
              onClick={() => {
                setOpenSidebarTool(null);
                setShowStyleMenu((v) => !v);
              }}
              className={iconButton(showStyleMenu ? "primary" : "subtle", "lg")}
              title="Line Color & Width"
            >
              <Palette size={16} />
            </button>
            {showStyleMenu && (
              <div
                data-transient-surface="styles"
                data-testid="drawing-style-controls"
                className={`absolute left-[44px] top-0 z-[3300] w-64 p-2 ${surface.popover}`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-1">
                  <span className={text.label}>Style Defaults</span>
                  <span className={badgeClass}>{drawingDefaults.lineWidth}px</span>
                </div>
                <div className="grid grid-cols-5 gap-1 mb-1.5">
                  {DRAWING_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Drawing color ${color}`}
                      onClick={() => updateDrawingDefaults({ color })}
                      className={colorSwatch(drawingDefaults.color === color)}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn("shrink-0", text.muted, "text-[10px]")}>Width</span>
                  <input
                    aria-label="Drawing line width"
                    type="range"
                    min={1}
                    max={6}
                    value={drawingDefaults.lineWidth}
                    onChange={(event) => updateDrawingDefaults({ lineWidth: Number(event.target.value) })}
                    className="ui-range min-w-0 flex-1"
                  />
                </div>
                <div className="mt-2 border-t border-[color:var(--border)] pt-2">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className={text.label}>Chart Background</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setChartBackground((value) => ({ ...value, mode: 'solid' }))} className={toggleButton(chartBackground.mode === 'solid', 'sm', 'px-2')}>Solid</button>
                      <button type="button" onClick={() => setChartBackground((value) => ({ ...value, mode: 'gradient' }))} className={toggleButton(chartBackground.mode === 'gradient', 'sm', 'px-2')}>Gradient</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2 text-[10px] text-[color:var(--text-muted)]">
                    <span>{chartBackground.mode === 'gradient' ? 'Top color' : 'Background color'}</span>
                    <input aria-label="Chart background top color" type="color" value={chartBackground.top} onChange={(event) => setChartBackground((value) => ({ ...value, top: event.target.value }))} className={colorInput()} />
                    {chartBackground.mode === 'gradient' && (
                      <>
                        <span>Bottom fade color</span>
                        <input aria-label="Chart background bottom color" type="color" value={chartBackground.bottom} onChange={(event) => setChartBackground((value) => ({ ...value, bottom: event.target.value }))} className={colorInput()} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="flex-1 min-w-0 bg-[var(--content-bg)] flex flex-wrap gap-0 overflow-hidden">
          {layoutClasses.map((className, index) => (
            <div
              key={`${layout}-${index}`}
              data-testid="chart-panel"
              data-layout-panel={layout}
              data-active-panel={activePanelIndex === index ? "true" : "false"}
              onPointerDownCapture={() => {
                if (isCompactViewport) {
                  closeTransientMenus();
                }
                setActivePanel(index);
              }}
              className={`${className} ${surface.panel} relative overflow-hidden ${activePanelIndex === index ? "ring-1 ring-blue-500/80" : ""}`}
            >
              <div className="absolute bottom-0 right-0 z-30 flex h-[22px] w-[55px] items-center justify-center pointer-events-none">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePanel(index);
                  }}
                  className={cn(
                    "pointer-events-auto flex h-[14px] min-w-[20px] px-1 items-center justify-center rounded-[3px] text-[10px] font-mono font-semibold leading-none transition-all duration-150 border",
                    activePanelIndex === index
                      ? "border-blue-500 bg-blue-600 text-white shadow-none"
                      : "border-[color:var(--border)] bg-[var(--control-bg)]/90 text-[color:var(--text-muted)] hover:bg-[var(--control-hover-bg)] hover:text-[color:var(--text-main)]",
                  )}
                  title={`Activate panel ${index + 1}`}
                >
                  P{index + 1}
                </button>
              </div>
              <span className="sr-only">P{index + 1} · {panelSymbols[index]}</span>

              <ChartViewport
                symbol={panelSymbols[index]}
                period={period}
                activeTool={activeTool}
                themeMode={themeMode}
                chartStyle={chartStyle}
                magnetMode={magnetMode}
                priceScaleMode={priceScaleMode}
                invertScale={invertScale}
                watermarkVisible={watermarkVisible}
                drawingDefaults={drawingDefaults}
                compareSymbols={canUseCompareSeries ? (panelCompareSymbols[index] ?? EMPTY_COMPARE_SYMBOLS) : EMPTY_COMPARE_SYMBOLS}
                chartBackground={chartBackground}
                onDrawingEnd={() => setActiveTool(undefined)}
                onReady={(adapter) => {
                  if (layout === "single" && index === 0) {
                    mainAdapter.current = adapter;
                    setDrawingLayers(adapter.getDrawingLayers());
                    setActiveDrawingLayerId(adapter.getActiveDrawingLayerId());
                  }
                  assignPanelAdapter(index, adapter);
                  if (index === 0 && layout !== "single") {
                    setDrawingLayers(adapter.getDrawingLayers());
                    setActiveDrawingLayerId(adapter.getActiveDrawingLayerId());
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
