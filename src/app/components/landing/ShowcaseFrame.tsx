"use client";

import type { ReactNode } from "react";
import { Code2, SlidersHorizontal } from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import { Reveal } from "./Reveal";
import { cn, segmentedButton, segmentedControl, surface } from "./styles";

export type ShowcaseView = "controls" | "code";

export function ShowcaseFrame({
  headingId, chart, children, code, codeHeader, className, delayMs,
}: {
  headingId: string;
  chart: ReactNode;
  children: ReactNode;
  code: string;
  codeHeader?: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  return (
    <Reveal className={cn("w-full", className)} delayMs={delayMs}>
      <article
        aria-labelledby={headingId}
        className={cn(
          "w-full rounded-2xl p-2 min-[1000px]:p-4 grid grid-cols-1 min-[1000px]:grid-cols-2 xl:grid-cols-[minmax(0,4fr)_minmax(0,3fr)_minmax(0,3fr)] gap-2 min-[1000px]:gap-4 items-stretch xl:h-[376px] xl:overflow-hidden transition-all duration-300",
          surface.glass,
          "border border-[color:var(--lp-border)] shadow-xl",
        )}
      >
        <div className="w-full min-w-0 flex flex-col justify-center">
          <div className="relative h-[340px] w-full rounded-xl overflow-hidden shadow-inner border border-[color:var(--lp-border)] bg-[var(--lp-panel-bg)]">
            {chart}
          </div>
        </div>
        <div className="w-full min-w-0 flex flex-col justify-between gap-2 py-1">
          {children}
        </div>
        <div className={cn("hidden xl:flex flex-col min-w-0 h-full", codeHeader && "gap-2")}>
          {codeHeader}
          <CodeBlock code={code} className="h-full" />
        </div>
      </article>
    </Reveal>
  );
}

export function ShowcaseViewToggle({
  view, onChange, label = "Overview", title = "Overview",
}: {
  view: ShowcaseView;
  onChange: (view: ShowcaseView) => void;
  label?: string;
  title?: string;
}) {
  return (
    <div className={cn("xl:hidden", segmentedControl)}>
      <button
        type="button"
        onClick={() => onChange("controls")}
        className={segmentedButton(view === "controls")}
        title={title}
      >
        <SlidersHorizontal size={12} />
        <span>{label}</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("code")}
        className={segmentedButton(view === "code")}
        title="API Code Example"
      >
        <Code2 size={12} />
        <span>Code</span>
      </button>
    </div>
  );
}

export function ShowcaseMobileCode({
  view, title, badge, code, height = "h-[200px]",
}: {
  view: ShowcaseView;
  title: string;
  badge: ReactNode;
  code: string;
  height?: string;
}) {
  return (
    <div className={cn("xl:hidden", view === "code" ? "block" : "hidden")}>
      <div className="space-y-2">
        <div className="text-xs font-semibold text-[color:var(--lp-text-muted)] flex items-center justify-between">
          <span>{title}</span>
          {badge}
        </div>
        <CodeBlock code={code} className={height} />
      </div>
    </div>
  );
}
