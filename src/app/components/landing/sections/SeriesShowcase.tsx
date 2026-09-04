"use client";

import { useEffect, useState } from "react";
import { Code2, Layers, SlidersHorizontal } from "lucide-react";
import { CodeBlock } from "../CodeBlock";
import { DemoChartFrame } from "../DemoChartFrame";
import { Reveal } from "../Reveal";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { cn, segmentedButton, segmentedControl, surface, text, toggleButton } from "../styles";
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

export function SeriesShowcase({ theme, className }: { theme: LandingThemeTokens; className?: string }) {
  const [cycleIndex, setCycleIndex] = useState(3); // Start with 'area' on live phase
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewMode, setViewMode] = useState<"controls" | "code">("controls");
  const reducedMotion = useReducedMotion();

  const [phases, setPhases] = useState<SegmentedPhase[]>([
    { fromIndex: 0, toIndex: 34, style: "candle", label: "Candle" },
    { fromIndex: 35, toIndex: 69, style: "ha", label: "Heikin-Ashi" },
    { fromIndex: 70, toIndex: 104, style: "baseline", label: "Baseline" },
    { fromIndex: 105, toIndex: 134, style: "bar", label: "OHLC Bar" },
    { fromIndex: 135, toIndex: 9999, style: "area", label: "Live: Area" },
  ]);

  // Auto-cycle through the styles on the live phase every 3.2s
  useEffect(() => {
    if (!autoRotate || reducedMotion) return;
    const timer = setInterval(() => {
      setCycleIndex((prev) => {
        const nextIdx = (prev + 1) % ALL_STYLES.length;
        const newStyle = ALL_STYLES[nextIdx].id;
        const info = ALL_STYLES[nextIdx];
        setPhases((oldPhases) => {
          const updated = [...oldPhases];
          const lastIdx = updated.length - 1;
          updated[lastIdx] = {
            ...updated[lastIdx],
            style: newStyle,
            label: `Live: ${info.label}`,
          };
          return updated;
        });
        return nextIdx;
      });
    }, 3200);
    return () => clearInterval(timer);
  }, [autoRotate, reducedMotion]);

  const selectedStyle = ALL_STYLES[cycleIndex % ALL_STYLES.length].id;
  const activeInfo = ALL_STYLES[cycleIndex % ALL_STYLES.length];

  const config: ChartDemoConfig = {
    symbol: "BTCUSDT",
    chartStyle: selectedStyle,
    segmentedPhases: phases,
    period: "1d",
    dataCount: 160,
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
      const info = ALL_STYLES[idx];
      setPhases((oldPhases) => {
        const updated = [...oldPhases];
        const lastIdx = updated.length - 1;
        updated[lastIdx] = {
          ...updated[lastIdx],
          style: id,
          label: `Live: ${info.label}`,
        };
        return updated;
      });
    }
  };

  const codeSnippet = `import { createChart } from 'fscandle';

// Multi-stage segmented series on a single continuous line
const chart = createChart(container, {
  segmentedPhases: [
    { fromIndex: 0,   toIndex: 34,  style: 'candle' },
    { fromIndex: 35,  toIndex: 69,  style: 'ha' },
    { fromIndex: 70,  toIndex: 104, style: 'baseline' },
    { fromIndex: 105, toIndex: 134, style: 'bar' },
    { fromIndex: 135, toIndex: 160, style: '${selectedStyle}' },
  ],
});
chart.setData(btcData);`;

  return (
    <Reveal className={cn("w-full", className)}>
      <article
        aria-labelledby="series-showcase-heading"
        className={cn(
          "w-full rounded-2xl p-2 min-[1000px]:p-4 grid grid-cols-1 min-[1000px]:grid-cols-2 xl:grid-cols-[minmax(0,4fr)_minmax(0,3fr)_minmax(0,3fr)] gap-2 min-[1000px]:gap-4 items-stretch xl:h-[376px] xl:overflow-hidden transition-all duration-300",
          surface.glass,
          "border border-[color:var(--lp-border)] shadow-xl",
        )}
      >
        {/* Column 1: replaying chart, renderer morphs on a timer */}
        <div className="w-full min-w-0 flex flex-col justify-center">
          <div className="relative h-[340px] w-full rounded-xl overflow-hidden shadow-inner border border-[color:var(--lp-border)] bg-[var(--lp-panel-bg)]">
            <div className="absolute top-2.5 left-3 z-10 pointer-events-none">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-black/60 backdrop-blur-md text-[color:var(--lp-text-main)] border border-white/10 shadow-lg">
                <span className={cn("w-1.5 h-1.5 rounded-full bg-blue-400", autoRotate && !reducedMotion && "animate-pulse")} />
                <span className="text-blue-400 font-semibold">{activeInfo.label}</span>
              </span>
            </div>
            <DemoChartFrame config={config} theme={theme} label={`BTC chart with segmented timeline, active: ${activeInfo.label}`} />
          </div>
        </div>

        {/* Column 2: description + the eight style pills */}
        <div className="w-full min-w-0 flex flex-col justify-between gap-2 py-1">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-blue-500 uppercase">
                <Layers size={14} />
                <span>Segmented Series</span>
              </div>

              {/* Controls vs Code switcher — mobile only */}
              <div className={cn("xl:hidden", segmentedControl)}>
                <button
                  type="button"
                  onClick={() => setViewMode("controls")}
                  className={segmentedButton(viewMode === "controls")}
                  title="Overview"
                >
                  <SlidersHorizontal size={12} />
                  <span>Styles</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("code")}
                  className={segmentedButton(viewMode === "code")}
                  title="API Code Example"
                >
                  <Code2 size={12} />
                  <span>Code</span>
                </button>
              </div>
            </div>

            <h2 id="series-showcase-heading" className={cn("mt-2 text-[24px] font-extrabold leading-[1.2] tracking-[-0.02em]", text.main)}>
              Multi-Stage Segmented Series
            </h2>
            <p className={cn("mt-2 text-xs leading-[1.4]", text.muted)}>
              Renders distinct series styles across consecutive time stages along a single continuous price stream — preserving historical phases in their original styles while live ticks stream into the active segment.
            </p>
          </div>

          {/* Mobile code view */}
          <div className={cn("xl:hidden", viewMode === "code" ? "block" : "hidden")}>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[color:var(--lp-text-muted)] flex items-center justify-between">
                <span>Series API Code:</span>
                <span className="text-[10px] font-mono text-blue-400">{selectedStyle}</span>
              </div>
              <CodeBlock code={codeSnippet} className="h-[190px]" />
            </div>
          </div>

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
        </div>

        {/* Column 3: code (desktop) */}
        <div className="hidden xl:flex flex-col min-w-0 h-full">
          <CodeBlock code={codeSnippet} className="h-full" />
        </div>
      </article>
    </Reveal>
  );
}
