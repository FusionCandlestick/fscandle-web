import Link from "next/link";
import { CandlestickChart } from "lucide-react";

import { GitHubIcon } from "./icons";
import { DemoChartFrame } from "./DemoChartFrame";
import { button, cn, text } from "./styles";
import type { ChartDemoConfig } from "./DemoChart";
import type { LandingThemeTokens } from "./tokens";

const HERO_CHART_CONFIG: ChartDemoConfig = {
  symbol: "BTCUSDT",
  chartStyle: "candle",
  period: "1d",
  indicators: [{ kind: "boll", params: [20, 2] }],
  dataCount: 160,
  frame: "feature",
  chrome: "full",
  replay: true,
};

export function Hero({ theme }: { theme: LandingThemeTokens }) {
  return (
    <section
      id="landing-hero"
      aria-labelledby="hero-main-title"
      className="relative overflow-hidden border-b border-[color:var(--lp-seam)] px-4 min-[1000px]:px-12 pt-4 pb-8 min-[1000px]:pt-4 min-[1000px]:pb-12"
    >
      <div className="relative z-10 mx-auto grid max-w-[1600px] items-stretch gap-2 min-[1000px]:grid-cols-[0.92fr_1.08fr] 2xl:grid-cols-[0.85fr_1.15fr] min-[1000px]:gap-4">
        {/* Left Column: Value Proposition & Key Specs (Static without slide animation) */}
        <div>
          <h1
            id="hero-main-title"
            className={cn(
              "text-[32px] min-[1000px]:text-[48px] font-extrabold leading-[1.2] tracking-[-0.02em]",
              text.main
            )}
          >
            Next-Gen High-Performance Canvas Candlestick Engine
          </h1>

          <p className={cn("mt-4 max-w-xl text-[16px] leading-[1.4]", text.muted)}>
            A <strong className={text.main}>from-scratch HTML5 Canvas candlestick chart library</strong> for JavaScript and TypeScript &mdash; no SVG, no per-bar DOM. One surface renders 8 series types, 16 technical indicators, multi-pane synced layouts and a full drawing suite from a <strong className={text.main}>~67&nbsp;KB gzipped</strong> core, with React components and static / replay / polling / WebSocket datafeed adapters.
          </p>

          {/* Action CTAs: 3 Buttons with Equal Width (Static without slide effect) */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl">
            <Link
              href="/playground"
              className={cn(button("primary", "lg", "w-full justify-center font-semibold gap-1.5 shadow-lg shadow-black/20"))}
            >
              <CandlestickChart size={15} />
              <span>Playground</span>
            </Link>
            <a
              href="https://github.com/FusionCandlestick/fscandle"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(button("primary", "lg", "w-full justify-center font-semibold gap-1.5 shadow-lg shadow-black/20"))}
            >
              <GitHubIcon size={15} />
              <span>GitHub</span>
            </a>
          </div>
        </div>

        {/* Right Column: Live Chart Frame */}
        <div className="min-w-0 h-full">
          <div className="pointer-events-none relative h-full min-h-[320px] sm:min-h-[380px] min-[1000px]:min-h-[440px] w-full rounded-xl overflow-hidden shadow-xl border border-[color:var(--lp-border)] bg-[var(--lp-panel-bg)] select-none">
            <DemoChartFrame
              config={HERO_CHART_CONFIG}
              theme={theme}
              eager
              label="Live-replaying BTCUSDT candlestick chart"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
