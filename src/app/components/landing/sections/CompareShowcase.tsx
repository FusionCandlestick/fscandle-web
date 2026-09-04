"use client";

import { useState } from "react";
import { Code2, GitCompareArrows, SlidersHorizontal } from "lucide-react";
import { CodeBlock } from "../CodeBlock";
import { DemoChartFrame } from "../DemoChartFrame";
import { Reveal } from "../Reveal";
import { cn, segmentedButton, segmentedControl, surface, text } from "../styles";
import type { ChartDemoConfig } from "../DemoChart";
import type { LandingThemeTokens } from "../tokens";

const CONFIG: ChartDemoConfig = {
  symbol: "BTC",
  chartStyle: "line",
  period: "1d",
  compareSymbols: ["SPY", "QQQ"],
  compareMode: "overlay",
  priceScaleMode: "log",
  dataCount: 249,
  frame: "feature",
  chrome: "full",
  replay: true,
};

export function CompareShowcase({ theme, className }: { theme: LandingThemeTokens; className?: string }) {
  const [viewMode, setViewMode] = useState<"controls" | "code">("controls");

  const codeSnippet = `import { createChart } from 'fscandle';

const chart = createChart(container);
chart.setChartStyle('line');
chart.setData(btcData);

// Overlay each benchmark as its own line series...
for (const [symbol, data] of Object.entries(compareData)) {
  chart.addLineSeries({ color: colorFor(symbol) }).setData(data);
}

// ...and read them on a logarithmic (relative %) scale
chart.setPriceScaleMode('log');`;

  return (
    <Reveal className={cn("w-full", className)} delayMs={40}>
      <article
        aria-labelledby="compare-showcase-heading"
        className={cn(
          "w-full rounded-2xl p-2 min-[1000px]:p-4 grid grid-cols-1 min-[1000px]:grid-cols-2 xl:grid-cols-[minmax(0,4fr)_minmax(0,3fr)_minmax(0,3fr)] gap-2 min-[1000px]:gap-4 items-stretch xl:h-[376px] xl:overflow-hidden transition-all duration-300",
          surface.glass,
          "border border-[color:var(--lp-border)] shadow-xl",
        )}
      >
        {/* Column 1 (40% on xl, 1/2 on medium): Live Interactive Chart */}
        <div className="w-full min-w-0 flex flex-col justify-center">
          <div className="relative h-[340px] w-full rounded-xl overflow-hidden shadow-inner border border-[color:var(--lp-border)] bg-[var(--lp-panel-bg)]">
            <DemoChartFrame config={CONFIG} theme={theme} label="BTC vs SPY / QQQ multi-symbol comparison chart demo" />
          </div>
        </div>

        {/* Column 2 (30% on xl, 1/2 on medium): Text Description */}
        <div className="w-full min-w-0 flex flex-col justify-between gap-2 py-1">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-amber-500 uppercase">
                <GitCompareArrows size={14} />
                <span>Benchmark & Multi-Asset</span>
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

            <h2 id="compare-showcase-heading" className={cn("mt-2 text-[24px] font-extrabold leading-[1.2] tracking-[-0.02em]", text.main)}>
              Multi-Asset Benchmark Compare
            </h2>
            <p className={cn("mt-2 text-xs leading-[1.4]", text.muted)}>
              Overlay multiple disparate crypto and equity assets on a normalized, logarithmic percentage scale to analyze relative performance and alpha over identical time windows.
            </p>
            <p className={cn("mt-2 text-xs leading-[1.4]", text.muted)}>
              Unlike raw-price overlays, every instrument is rebased to a common starting value and evaluated on a logarithmic relative-return scale. Crypto, equities, ETFs, and indices with radically different price levels become directly comparable without visual distortion.
            </p>
          </div>

          {/* Medium/Small conditional code view */}
          <div className={cn("xl:hidden", viewMode === "code" ? "block" : "hidden")}>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[color:var(--lp-text-muted)] flex items-center justify-between">
                <span>Multi-Asset Overlay Code:</span>
                <span className="text-[10px] font-mono text-amber-400">log mode</span>
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
