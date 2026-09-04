"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

import { useInView } from "./hooks/useInView";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { cn, surface } from "./styles";
import type { LandingThemeTokens } from "./tokens";
import type { ChartDemoConfig, DemoFrame } from "./DemoChart";
import { DEMO_FRAME_CLASSES } from "./DemoChart";

const LazyDemoChart = dynamic(() => import("./DemoChart").then((mod) => mod.DemoChart), {
  ssr: false,
});

function Skeleton({ frame }: { frame: DemoFrame }) {
  return <div className={cn("lp-skeleton w-full rounded-[10px]", DEMO_FRAME_CLASSES[frame])} />;
}

interface DemoChartFrameProps {
  config: ChartDemoConfig;
  theme: LandingThemeTokens;
  /** Skip the intersection gate — used for the one chart that should be
   * visible immediately (above the fold, and what keeps the e2e "canvas
   * count > 0 right after page load" assertion true without editing it). */
  eager?: boolean;
  label: string;
  className?: string;
}

export function DemoChartFrame({ config, theme, eager = false, label, className }: DemoChartFrameProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "200px 0px" });
  const reducedMotion = useReducedMotion();
  const shouldMount = eager || inView;
  const frame = config.frame ?? "feature";

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      className={cn("h-full overflow-hidden", surface.panel, "rounded-[10px]", className)}
    >
      {shouldMount ? (
        <Suspense fallback={<Skeleton frame={frame} />}>
          <LazyDemoChart config={config} theme={theme} reducedMotion={reducedMotion} />
        </Suspense>
      ) : (
        <Skeleton frame={frame} />
      )}
    </div>
  );
}
