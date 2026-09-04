"use client";

import { useState } from "react";
import { Code2, PencilRuler, SlidersHorizontal } from "lucide-react";
import { CodeBlock } from "../CodeBlock";
import { DemoChartFrame } from "../DemoChartFrame";
import { Reveal } from "../Reveal";
import { cn, segmentedButton, segmentedControl, surface, text, toggleButton } from "../styles";
import { drawingOverlayFactory, type DrawingOverlayKind } from "../chart-demo-data";
import type { ChartDemoConfig } from "../DemoChart";
import type { LandingThemeTokens } from "../tokens";

// Colours mirror chart-demo-data: cyan = straight-edge geometry, amber = the
// Fibonacci grid, green = annotations.
const GEOMETRY = "#22d3ee";
const FIB = "#fbbf24";
const MEASURE = "#a78bfa";
const NOTE = "#22c55e";

const DRAWING_PRESETS = [
  { id: "line:trend", label: "Trendline", desc: "2 points", swatch: GEOMETRY },
  { id: "channel:parallel", label: "Channel", desc: "3 points", swatch: GEOMETRY },
  { id: "fibonacci", label: "Fibonacci", desc: "2 points", swatch: FIB },
  { id: "measure", label: "Price range", desc: "2 points", swatch: MEASURE },
  { id: "annotation:tag", label: "Price tag", desc: "1 point", swatch: NOTE },
  { id: "annotation:arrow", label: "Signal", desc: "1 point", swatch: NOTE },
  { id: "annotation:image", label: "Image", desc: "1 point", swatch: NOTE },
] as const;

export function DrawingShowcase({ theme, className }: { theme: LandingThemeTokens; className?: string }) {
  const [activeTool, setActiveTool] = useState<DrawingOverlayKind | null>(null);
  const [viewMode, setViewMode] = useState<"controls" | "code">("controls");

  const config: ChartDemoConfig = {
    symbol: "NVDA",
    chartStyle: "candle",
    period: "1d",
    dataCount: 120,
    frame: "feature",
    chrome: "axis",
    fitContent: true,
    magnetMode: true,
    overlayFactory: drawingOverlayFactory,
    activeDrawingTool: activeTool,
  };

  const activeInfo = DRAWING_PRESETS.find((t) => t.id === activeTool);

  const codeSnippet = `import { createChart } from 'fscandle';

const chart = createChart(container);
chart.setData(klineData);

// Snap new points to nearby OHLC values, then arm a tool
chart.setMagnetMode(true);
chart.setDrawingMode('${activeTool || "fibonacci"}');`;

  return (
    <Reveal className={cn("w-full", className)} delayMs={120}>
      <article
        aria-labelledby="drawing-showcase-heading"
        className={cn(
          "w-full rounded-2xl p-2 min-[1000px]:p-4 grid grid-cols-1 min-[1000px]:grid-cols-2 xl:grid-cols-[minmax(0,4fr)_minmax(0,3fr)_minmax(0,3fr)] gap-2 min-[1000px]:gap-4 items-stretch xl:h-[376px] xl:overflow-hidden transition-all duration-300",
          surface.glass,
          "border border-[color:var(--lp-border)] shadow-xl",
        )}
      >
        {/* Column 1: one chart carrying every overlay at once. */}
        <div className="w-full min-w-0 flex flex-col justify-center">
          <div className="relative h-[340px] w-full rounded-xl overflow-hidden shadow-inner border border-[color:var(--lp-border)] bg-[var(--lp-panel-bg)]">
            <DemoChartFrame
              config={config}
              theme={theme}
              label="One NVDA daily chart carrying every overlay at once: trendline, parallel channel, Fibonacci retracement, price/bar range, price tag, signal arrow, and an image badge"
            />
          </div>
        </div>

        {/* Column 2: heading + tool legend (or code on mobile). */}
        <div className="w-full min-w-0 flex flex-col justify-between gap-2 py-1">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] font-mono font-semibold uppercase text-emerald-500">
                <PencilRuler size={14} />
                <span>Overlay studio</span>
              </div>

              <div className={cn("xl:hidden", segmentedControl)}>
                <button
                  type="button"
                  onClick={() => setViewMode("controls")}
                  className={segmentedButton(viewMode === "controls")}
                  title="Interactive Tools"
                >
                  <SlidersHorizontal size={12} />
                  <span>Tools</span>
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

            <h2 id="drawing-showcase-heading" className={cn("mt-2 text-[24px] font-extrabold leading-[1.2] tracking-[-0.02em]", text.main)}>
              Geometric Drawing &amp; Overlays
            </h2>
            <p className={cn("mt-2 text-xs leading-[1.4]", text.muted)}>
              Every tool below is drawn once on this NVDA chart. Each overlay is editable, persists to
              local state, and stays anchored to a price and a timestamp.
            </p>
          </div>

          {/* Mobile code view */}
          <div className={cn("xl:hidden", viewMode === "code" ? "block" : "hidden")}>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[color:var(--lp-text-muted)] flex items-center justify-between">
                <span>Overlay Extension Code:</span>
                <span className="text-[10px] font-mono text-emerald-400">{activeTool || "tag"}</span>
              </div>
              <CodeBlock code={codeSnippet} className="h-[200px]" />
            </div>
          </div>

          {/* Tool legend / arming controls */}
          <div className={cn("min-h-0 space-y-2", viewMode === "controls" ? "block" : "hidden xl:block")}>
            <div className="flex items-center justify-between text-xs font-semibold text-[color:var(--lp-text-muted)]">
              <span>Arm a tool to redraw it</span>
              <span className="text-[10px] font-normal text-emerald-400">
                {activeInfo ? `${activeInfo.label} · ${activeInfo.desc}` : "showing all seven"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 gap-1">
              {DRAWING_PRESETS.map((tool) => {
                const isSelected = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setActiveTool(isSelected ? null : (tool.id as DrawingOverlayKind))}
                    className={toggleButton(isSelected, "sm", "justify-start gap-2 py-1.5 text-xs font-medium")}
                    aria-pressed={isSelected}
                    aria-label={`${tool.label}, ${tool.desc}`}
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 flex-none rounded-[3px]"
                      style={{ backgroundColor: tool.swatch }}
                    />
                    <span className="truncate">{tool.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Column 3: code (xl only). */}
        <div className="hidden xl:flex flex-col min-w-0 h-full gap-2">
          <div className="flex items-center justify-between px-0.5 text-[10px] font-mono uppercase text-[color:var(--lp-text-muted)]">
            <span className="flex items-center gap-1">
              <Code2 size={12} className="text-emerald-400" /> Overlay API
            </span>
            <span className="text-emerald-400">{activeTool || "fibonacci"}</span>
          </div>
          <CodeBlock code={codeSnippet} className="h-full" />
        </div>
      </article>
    </Reveal>
  );
}
