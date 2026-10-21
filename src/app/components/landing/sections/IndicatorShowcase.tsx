"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { DemoChartFrame } from "../DemoChartFrame";
import { ShowcaseFrame, ShowcaseMobileCode, ShowcaseViewToggle } from "../ShowcaseFrame";
import { cn, text } from "../styles";
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
    <ShowcaseFrame
      headingId="indicators-showcase-heading"
      className={className}
      delayMs={80}
      code={codeSnippet}
      chart={<DemoChartFrame config={config} theme={theme} label="EMA(20) on price + MACD(12,26,9) sub-pane + Volume indicator demo" />}
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-purple-500 uppercase">
            <Activity size={14} />
            <span>Indicators & Sub-Panes</span>
          </div>

          <ShowcaseViewToggle view={viewMode} onChange={setViewMode} />
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

      <ShowcaseMobileCode
        view={viewMode}
        title="Indicator Stack Code:"
        badge={<span className="text-[10px] font-mono text-purple-400">EMA + MACD</span>}
        code={codeSnippet}
      />
    </ShowcaseFrame>
  );
}
