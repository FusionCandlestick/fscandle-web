"use client";

import { useState } from "react";
import { GitCompareArrows } from "lucide-react";
import { DemoChartFrame } from "../DemoChartFrame";
import { ShowcaseFrame, ShowcaseMobileCode, ShowcaseViewToggle } from "../ShowcaseFrame";
import { cn, text } from "../styles";
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
    <ShowcaseFrame
      headingId="compare-showcase-heading"
      className={className}
      delayMs={40}
      code={codeSnippet}
      chart={<DemoChartFrame config={CONFIG} theme={theme} label="BTC vs SPY / QQQ multi-symbol comparison chart demo" />}
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-amber-500 uppercase">
            <GitCompareArrows size={14} />
            <span>Benchmark & Multi-Asset</span>
          </div>

          <ShowcaseViewToggle view={viewMode} onChange={setViewMode} />
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

      <ShowcaseMobileCode
        view={viewMode}
        title="Multi-Asset Overlay Code:"
        badge={<span className="text-[10px] font-mono text-amber-400">log mode</span>}
        code={codeSnippet}
      />
    </ShowcaseFrame>
  );
}
