/**
 * Single source of truth for the landing FAQ.
 *
 * Consumed both by `FAQSection` (visible accordion) and by the JSON-LD
 * `FAQPage` graph in `app/layout.tsx`. Google requires the structured data to
 * match the visible content, so there is exactly one list and both readers
 * import it. Plain `.ts`, no `"use client"`, so the server layout can import
 * it without pulling a client component into the server graph.
 */

export interface FAQItem {
  question: string;
  answer: string;
  category: "General" | "Performance" | "Technical" | "Integration";
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    category: "General",
    question:
      "What is FusionCandlestick and how does it differ from TradingView Lightweight Charts or KLineCharts?",
    answer:
      "FusionCandlestick is a non-commercial source-available financial charting engine that renders directly to HTML5 Canvas rather than wrapping an existing library. Commercial use requires a separate written license. It draws every bar in one Canvas pass with no per-bar DOM nodes and includes timezone-aware sessions and a multi-pane terminal workspace.",
  },
  {
    category: "Performance",
    question: "How does FusionCandlestick keep rendering fast on large datasets?",
    answer:
      "Candle bars never touch the browser DOM; they are drawn in a single high-DPI-aware Canvas pass. The data store keeps sorted OHLC with O(1) logical-index conversion, hover lookups are cached rather than re-scanned each frame, and price-extent scans avoid the argument-count limits of Math.min / Math.max spreads. A browser frame benchmark (npm run test:perf:browser) fails the build on median or p95 frame-interval and heap-growth regressions.",
  },
  {
    category: "Integration",
    question:
      "How do I integrate FusionCandlestick into React, Next.js App Router, or another framework?",
    answer:
      "For React and Next.js, import FusionCandlestickChartComponent from 'fscandle/react' — it ships the 'use client' directive so it can be imported straight from an App Router server component. For any other framework or vanilla JavaScript, call createChart(container, options) from 'fscandle'. react and react-dom (>=18) are peer dependencies needed only for the React entry.",
  },
  {
    category: "Technical",
    question: "Which technical indicators and chart series styles are natively supported?",
    answer:
      "Eight series renderers — candlestick, hollow candle, Heikin-Ashi, OHLC bar, area, line, step line, and baseline — plus a volume mode. Sixteen built-in indicators: MA, EMA, BOLL, MACD, RSI, KDJ, WR, VOLMA, ATR, ADX, ROC, CCI, OBV, VWAP, STOCHRSI, and PSAR, with automatic cross-pane time and cursor synchronization.",
  },
  {
    category: "Technical",
    question: "Can I implement custom series types or proprietary drawing tools?",
    answer:
      "Yes. chart.defineSeriesType() registers a custom Canvas series renderer, chart.registerOverlayTemplate() registers custom overlays, and ChartPrimitive is the single extension model for pane views, axis views, hit testing, and pointer interactions.",
  },
  {
    category: "Integration",
    question: "Does FusionCandlestick support real-time streaming and replay data sources?",
    answer:
      "The datafeed entry (fscandle/datafeed) ships generic static, replay, polling, and WebSocket helpers via bindMarketDataFeed. They cover historical playback and live tick sources; transport concerns such as reconnection and heartbeats are the datafeed implementation's responsibility, not the chart's.",
  },
];
