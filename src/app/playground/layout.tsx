import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playground — Multi-Panel Charting Workspace",
  description:
    "An interactive FusionCandlestick workspace: switch symbols and periods, split into up to four synced panels, draw on layered overlays, add compare series, toggle chart styles, and export a screenshot — all running the real Canvas engine in the browser.",
  alternates: { canonical: "https://fusioncandlestick.dev/playground" },
  openGraph: {
    type: "website",
    url: "https://fusioncandlestick.dev/playground",
    title: "FusionCandlestick Playground — Multi-Panel Charting Workspace",
    description:
      "Try the FusionCandlestick Canvas engine: symbol and period switching, up to four synced panels, layered drawing tools, compare series, and screenshot export.",
  },
};

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
