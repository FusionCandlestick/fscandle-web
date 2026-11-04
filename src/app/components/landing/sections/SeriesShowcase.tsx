"use client";

import { useEffect, useMemo, useState } from "react";
import { Layers } from "lucide-react";
import { DemoChartFrame } from "../DemoChartFrame";
import { ShowcaseFrame, ShowcaseMobileCode, ShowcaseViewToggle } from "../ShowcaseFrame";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { cn, text, toggleButton } from "../styles";
import { replaySeedCount } from "../replay";
import type { ChartDemoConfig, ChartStyle, SegmentedPhase } from "../DemoChart";
import type { LandingThemeTokens } from "../tokens";

const ALL_STYLES: Array<{ id: ChartStyle; label: string; desc: string }> = [
  { id: "candle", label: "Candlestick", desc: "Classic high-contrast OHLC candles" },
  { id: "hollow", label: "Hollow Candle", desc: "Open/close body colour distinction" },
  { id: "ha", label: "Heikin Ashi", desc: "Smoothed candles that filter trend noise" },
  { id: "area", label: "Area", desc: "Gradient fill under the close line" },
  { id: "baseline", label: "Baseline", desc: "Dynamic bull/bear baseline area split" },
  { id: "bar", label: "OHLC Bar", desc: "Compact open-high-low-close ticks" },
  { id: "line", label: "Line", desc: "Close price as a single connected line" },
  { id: "step", label: "Step Line", desc: "Discrete rate / staircase changes" },
];

const DATA_COUNT = 160;

export function SeriesShowcase({ theme, className }: { theme: LandingThemeTokens; className?: string }) {
  const [cycleIndex, setCycleIndex] = useState(3); // Start with 'area' on live phase
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewMode, setViewMode] = useState<"controls" | "code">("controls");
  const reducedMotion = useReducedMotion();

  // Auto-cycle through the styles on the live phase every 3.2s.
  useEffect(() => {
    if (!autoRotate || reducedMotion) return;
    const timer = setInterval(() => {
      setCycleIndex((prev) => (prev + 1) % ALL_STYLES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [autoRotate, reducedMotion]);

  const activeInfo = ALL_STYLES[cycleIndex % ALL_STYLES.length];
  const selectedStyle = activeInfo.id;
  // The replay shows the first `seed` bars, then streams the rest. The live
  // segment starts at the seed, so every bar the replay streams takes the active
  // style and the chart matches the highlighted pill.
  const phases = useMemo<SegmentedPhase[]>(() => {
    const seed = replaySeedCount(DATA_COUNT);
    const quarter = Math.floor(seed / 4);
    return [
      { fromIndex: 0, toIndex: quarter - 1, style: "candle", label: "Candle" },
      { fromIndex: quarter, toIndex: quarter * 2 - 1, style: "ha", label: "Heikin-Ashi" },
      { fromIndex: quarter * 2, toIndex: quarter * 3 - 1, style: "baseline", label: "Baseline" },
      { fromIndex: quarter * 3, toIndex: seed - 1, style: "bar", label: "OHLC Bar" },
      { fromIndex: seed, toIndex: 9999, style: activeInfo.id, label: `Live: ${activeInfo.label}` },
    ];
  }, [activeInfo]);

  const config: ChartDemoConfig = {
    symbol: "BTCUSDT",
    chartStyle: selectedStyle,
    segmentedPhases: phases,
    period: "1d",
    dataCount: DATA_COUNT,
    rightMargin: 0.08,
    frame: "feature",
    chrome: "clean",
    replay: true,
  };

  const handleSelectStyle = (id: ChartStyle) => {
    const idx = ALL_STYLES.findIndex((s) => s.id === id);
    if (idx !== -1) {
      setCycleIndex(idx);
      setAutoRotate(false); // Pause auto-rotation on explicit manual click
    }
  };

  const codeSnippet = `import { createChart } from 'fscandle';

const chart = createChart(container);
chart.setData(btcData);

// Switch the active style; the segmented demo uses a custom renderer.
chart.setChartStyle('${selectedStyle}');`;

  return (
    <ShowcaseFrame
      headingId="series-showcase-heading"
      className={className}
      code={codeSnippet}
      chart={<>
        <div className="absolute top-2.5 left-3 z-10 pointer-events-none">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-black/60 backdrop-blur-md text-[color:var(--lp-text-main)] border border-white/10 shadow-lg">
            <span className={cn("w-1.5 h-1.5 rounded-full bg-blue-400", autoRotate && !reducedMotion && "animate-pulse")} />
            <span className="text-blue-400 font-semibold">{activeInfo.label}</span>
          </span>
        </div>
        <DemoChartFrame config={config} theme={theme} label={`BTC chart with segmented timeline, active: ${activeInfo.label}`} />
      </>}
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-blue-500 uppercase">
            <Layers size={14} />
            <span>Segmented Series</span>
          </div>

          <ShowcaseViewToggle view={viewMode} onChange={setViewMode} label="Styles" />
        </div>

        <h2 id="series-showcase-heading" className={cn("mt-2 text-[24px] font-extrabold leading-[1.2] tracking-[-0.02em]", text.main)}>
          Multi-Stage Segmented Series
        </h2>
        <p className={cn("mt-2 text-xs leading-[1.4]", text.muted)}>
          Renders distinct series styles across consecutive time stages along a single continuous price stream — preserving historical phases in their original styles while live ticks stream into the active segment.
        </p>
      </div>

      <ShowcaseMobileCode
        view={viewMode}
        title="Series API Code:"
        badge={<span className="text-[10px] font-mono text-blue-400">{selectedStyle}</span>}
        code={codeSnippet}
        height="h-[190px]"
      />

      {/* Eight style pills */}
      <div className={cn("space-y-2", viewMode === "controls" ? "block" : "hidden xl:block")}>
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4 gap-1">
          {ALL_STYLES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectStyle(item.id)}
              className={toggleButton(item.id === selectedStyle, "sm", "font-medium text-xs justify-center py-1.5")}
              aria-pressed={item.id === selectedStyle}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </ShowcaseFrame>
  );
}
