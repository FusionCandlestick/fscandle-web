"use client";

import { useState } from "react";
import { Activity, Code2, SlidersHorizontal } from "lucide-react";
import { CodeBlock } from "../CodeBlock";
import { DemoChartFrame } from "../DemoChartFrame";
import { Reveal } from "../Reveal";
import { cn, segmentedButton, segmentedControl, surface, text } from "../styles";
import type { ChartDemoConfig } from "../DemoChart";
import type { LandingThemeTokens } from "../tokens";

export function IndicatorShowcase({ theme, className }: { theme: LandingThemeTokens; className?: string }) {
  const [viewMode, setViewMode] = useState<"controls" | "code">("controls");

  const config: ChartDemoConfig = {
    symbol: "BTCUSDT",
    chartStyle: "candle",
    period: "1d",
    indicators: [
      { kind: "ema", params: [20] },
      { kind: "macd", params: [12, 26, 9] },
    ],
    showVolume: true,
    dataCount: 160,
    frame: "feature",
    chrome: "clean",
    replay: false,
  };

  const codeSnippet = `import { createChart } from 'fscandle';

const chart = createChart('#chart', { style: 'candle', showVolume: true });
chart.setData(btcData);

// EMA(20) trend line on main candlestick price pane
chart.addEMASeries(20);

// MACD(12,26,9) oscillator on synchronized sub-pane
chart.createIndicator('MACD', { newPane: true, calcParams: [12, 26, 9] });`;

  return (
    <Reveal className={cn("w-full", className)} delayMs={80}>
      <article
        aria-labelledby="indicators-showcase-heading"
        className={cn(
          "w-full rounded-2xl p-2 min-[1000px]:p-4 grid grid-cols-1 min-[1000px]:grid-cols-2 xl:grid-cols-[minmax(0,4fr)_minmax(0,3fr)_minmax(0,3fr)] gap-2 min-[1000px]:gap-4 items-stretch xl:h-[376px] xl:overflow-hidden transition-all duration-300",
          surface.glass,
          "border border-[color:var(--lp-border)] shadow-xl",
        )}
      >
        {/* Column 1 (40% on xl, 1/2 on medium): Live Interactive Chart */}
        <div className="w-full min-w-0 flex flex-col justify-center">
          <div className="relative h-[340px] w-full rounded-xl overflow-hidden shadow-inner border border-[color:var(--lp-border)] bg-[var(--lp-panel-bg)]">
            <DemoChartFrame config={config} theme={theme} label="EMA(20) on price + MACD(12,26,9) sub-pane + Volume indicator demo" />
          </div>
        </div>

        {/* Column 2 (30% on xl, 1/2 on medium): Text Description */}
        <div className="w-full min-w-0 flex flex-col justify-between gap-2 py-1">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-purple-500 uppercase">
                <Activity size={14} />
                <span>Indicators & Sub-Panes</span>
              </div>

              {/* Controls vs Code Switcher Tabs for mobile */}
              <div className={cn("xl:hidden", segmentedControl)}>
                <button
                  type="button"
                  onClick={() => setViewMode("controls")}
                  className={segmentedButton(viewMode === "controls")}
                  title="Overview"
                >
                  <SlidersHorizontal size={12} />
                  <span>Overview</span>
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

            <h2 id="indicators-showcase-heading" className={cn("mt-2 text-[24px] font-extrabold leading-[1.2] tracking-[-0.02em]", text.main)}>
              Multi-Pane Technical Indicators
            </h2>
            <p className={cn("mt-2 text-xs leading-[1.4]", text.muted)}>
              Overlay trend indicators and real-time volume on the main price chart, while driving dedicated oscillator sub-panes (MACD, RSI, KDJ, ATR) with independent scaling and dynamic pane resizing.
            </p>
            <p className={cn("mt-2 text-xs leading-[1.4]", text.muted)}>
              Includes 16 built-ins: MA, EMA, BOLL, MACD, RSI, KDJ, WR, VOLMA, ATR, ADX, ROC, CCI, OBV, VWAP, Stochastic RSI, and PSAR. Volume is also available as a native series. Each can run in the price pane or an independently scaled sub-pane.
            </p>
          </div>

          {/* Medium/Small conditional code view */}
          <div className={cn("xl:hidden", viewMode === "code" ? "block" : "hidden")}>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[color:var(--lp-text-muted)] flex items-center justify-between">
                <span>Indicator Stack Code:</span>
                <span className="text-[10px] font-mono text-purple-400">EMA + MACD</span>
              </div>
              <CodeBlock code={codeSnippet} className="h-[200px]" />
            </div>
          </div>
        </div>

        {/* Column 3 (30% on xl, hidden on medium/small where it is accessible via tabs): Code Snippet */}
        <div className="hidden xl:flex flex-col min-w-0 h-full">
          <CodeBlock code={codeSnippet} className="h-full" />
        </div>
      </article>
    </Reveal>
  );
}
