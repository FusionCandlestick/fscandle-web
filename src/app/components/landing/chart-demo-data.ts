/**
 * Synthetic OHLC data generation for landing-page chart demos. Pure
 * functions, no React/canvas dependency — safe to import eagerly from any
 * section (including ones whose chart is otherwise lazy-loaded), since this
 * module alone costs nothing to parse.
 */

import type { Overlay } from "fscandle";
import type { KLineData } from "fscandle";
import type { LandingThemeTokens } from "./tokens";

import { BTC_2025_DAILY_DATA } from "./btc-historical-data";
import {
  SPY_2025_DAILY_DATA,
  QQQ_2025_DAILY_DATA,
  NVDA_2025_DAILY_DATA,
  AAPL_2025_DAILY_DATA,
} from "./stock-historical-data";

export type Period = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";

export type OverlayInput = Omit<Overlay, "id"> & { id?: string };

const periodToMs = (period: Period): number =>
  ({ "1m": 60e3, "5m": 300e3, "15m": 900e3, "1h": 3600e3, "4h": 14400e3, "1d": 86400e3, "1w": 604800e3 })[period];

const seededRng = (n: number) => {
  const x = Math.sin(n) * 1e4;
  return x - Math.floor(x);
};

const symbolSeed = (symbol: string) => symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);

const basePriceBySymbol = (symbol: string) => {
  if (symbol.includes("BTC")) return 67450;
  if (symbol.includes("ETH")) return 3480;
  if (symbol.includes("SOL")) return 158;
  if (symbol.includes("NVDA")) return 124.5;
  if (symbol.includes("AAPL")) return 224.2;
  if (symbol.includes("QQQ")) return 482.6;
  if (symbol.includes("SPY")) return 562.4;
  return 500;
};

export const generateData = (symbol: string, period: Period, count = 240): KLineData[] => {
  if (period === "1d") {
    if (symbol.includes("BTC")) return BTC_2025_DAILY_DATA.slice(-count);
    if (symbol.includes("SPY")) return SPY_2025_DAILY_DATA.slice(-count);
    if (symbol.includes("QQQ")) return QQQ_2025_DAILY_DATA.slice(-count);
    if (symbol.includes("NVDA")) return NVDA_2025_DAILY_DATA.slice(-count);
    if (symbol.includes("AAPL")) return AAPL_2025_DAILY_DATA.slice(-count);
  }

  const base = basePriceBySymbol(symbol);
  const step = periodToMs(period);
  const seed = symbolSeed(symbol);
  let price = base;
  let timestamp = Date.now() - count * step;

  const isCrypto = symbol.includes("BTC") || symbol.includes("ETH") || symbol.includes("SOL");
  const volFactor = isCrypto ? 0.008 : 0.004;

  return Array.from({ length: count }, (_, index) => {
    const open = price;
    // Multi-frequency wave to produce realistic trend and pullbacks
    const macroCycle = Math.sin((index / 24) * Math.PI) * 0.004;
    const microNoise = (seededRng(seed + index * 13) - 0.49) * volFactor;
    const drift = (macroCycle + microNoise) * price;
    const close = Math.max(0.01, price + drift);
    
    const upperWick = seededRng(seed + index * 19) * price * (volFactor * 0.8);
    const lowerWick = seededRng(seed + index * 29) * price * (volFactor * 0.8);
    const high = Math.max(open, close) + upperWick;
    const low = Math.max(0.01, Math.min(open, close) - lowerWick);
    const volume = Math.floor((3000 + seededRng(seed + index * 31) * 12000) * (Math.abs(drift) / (price * volFactor) + 0.5));

    price = close;
    timestamp += step;

    return {
      timestamp: timestamp - step,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    };
  });
};

const normalizeData = (data: KLineData[]): KLineData[] => {
  const base = data[0]?.close ?? 1;
  if (!Number.isFinite(base) || base === 0) return data;

  return data.map((item) => ({
    ...item,
    open: (item.open / base) * 100,
    high: (item.high / base) * 100,
    low: (item.low / base) * 100,
    close: (item.close / base) * 100,
  }));
};

export function buildCompareData(symbol: string, period: Period, count: number) {
  if (period === "1d") {
    const refData = SPY_2025_DAILY_DATA.slice(-count);
    let raw: KLineData[];
    if (symbol.includes("BTC")) {
      raw = refData.map((ref) => {
        const btcItem =
          BTC_2025_DAILY_DATA.find((b) => b.timestamp === ref.timestamp) ||
          BTC_2025_DAILY_DATA.reduce((prev, curr) =>
            Math.abs(curr.timestamp - ref.timestamp) < Math.abs(prev.timestamp - ref.timestamp) ? curr : prev,
          );
        return {
          ...btcItem,
          timestamp: ref.timestamp,
        };
      });
    } else if (symbol.includes("SPY")) {
      raw = SPY_2025_DAILY_DATA.slice(-count);
    } else if (symbol.includes("QQQ")) {
      raw = QQQ_2025_DAILY_DATA.slice(-count);
    } else if (symbol.includes("NVDA")) {
      raw = NVDA_2025_DAILY_DATA.slice(-count);
    } else if (symbol.includes("AAPL")) {
      raw = AAPL_2025_DAILY_DATA.slice(-count);
    } else {
      raw = generateData(symbol, period, count);
    }
    return normalizeData(raw);
  }
  return normalizeData(generateData(symbol, period, count));
}

export type DrawingOverlayKind =
  | "line:trend"
  | "channel:parallel"
  | "fibonacci"
  | "measure"
  | "annotation:tag"
  | "annotation:arrow"
  | "annotation:image";

const eventBadge =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='68' height='36' viewBox='0 0 68 36'%3E%3Crect width='68' height='36' rx='7' fill='%23059669'/%3E%3Ctext x='34' y='16' text-anchor='middle' font-family='Arial' font-size='9' font-weight='700' fill='white'%3EEARNINGS%3C/text%3E%3Ctext x='34' y='28' text-anchor='middle' font-family='Arial' font-size='8' fill='%23d1fae5'%3EBeat %2B12%25%3C/text%3E%3C/svg%3E";

const extrema = (data: KLineData[], from: number, to: number, side: "high" | "low") => {
  const start = Math.max(0, Math.floor(data.length * from));
  const end = Math.min(data.length, Math.max(start + 1, Math.floor(data.length * to)));
  return data.slice(start, end).reduce((best, bar) =>
    side === "high" ? (bar.high > best.high ? bar : best) : (bar.low < best.low ? bar : best),
  data[start]);
};

/**
 * Build one market-meaningful overlay per chart. Anchors are derived from real
 * swing highs/lows in the displayed data rather than arbitrary percentages, so
 * every thumbnail demonstrates how the tool would actually be used by a trader.
 */
const drawingOverlayFactoryFor = (kind: DrawingOverlayKind) =>
  (data: KLineData[], _theme: LandingThemeTokens): OverlayInput[] => {
    if (data.length < 40) return [];

    // One shared palette so the full demo reads as a system, not a rainbow:
    // cyan for straight-edge geometry, amber for the Fibonacci grid, green for
    // annotations. Each tool owns a contiguous slice of the timeline; the three
    // point annotations sit at price extremes clear of the line work.
    const GEOMETRY = "#22d3ee";
    const FIB = "#fbbf24";
    const MEASURE = "#a78bfa";
    const NOTE = "#22c55e";

    // The demo chart clamps to roughly the last two-thirds of the series, so
    // anchors are placed within that window (v maps 0..1 onto the visible span)
    // and are allowed to overlap — the point is to show every tool at once.
    const v = (f: number) => 0.34 + f * 0.62;
    const trendLowA = extrema(data, v(0.02), v(0.14), "low");
    const trendLowB = extrema(data, v(0.48), v(0.60), "low");
    const fibLow = extrema(data, v(0.02), v(0.14), "low");
    const fibHigh = extrema(data, v(0.34), v(0.48), "high");
    const channelLowA = extrema(data, v(0.42), v(0.52), "low");
    const channelLowB = extrema(data, v(0.74), v(0.84), "low");
    const channelHigh = extrema(data, v(0.48), v(0.64), "high");
    const zoneLow = extrema(data, v(0.58), v(0.68), "low");
    const zoneHigh = extrema(data, v(0.82), v(0.94), "high");
    const tagPoint = extrema(data, v(0.02), v(0.10), "high");
    const eventPoint = extrema(data, v(0.36), v(0.44), "low");
    const breakoutPoint = extrema(data, v(0.92), v(0.99), "high");

    switch (kind) {
      case "line:trend":
        return [{
          type: "line",
          points: [
            { timestamp: trendLowA.timestamp, value: trendLowA.low },
            { timestamp: trendLowB.timestamp, value: trendLowB.low },
          ],
          color: GEOMETRY,
          lineWidth: 2,
          line: { direction: "free" },
        }];
      case "channel:parallel":
        return [{
          type: "channel",
          points: [
            { timestamp: channelLowA.timestamp, value: channelLowA.low },
            { timestamp: channelLowB.timestamp, value: channelLowB.low },
            { timestamp: channelHigh.timestamp, value: channelHigh.high },
          ],
          color: GEOMETRY,
          lineWidth: 2,
          channel: { mode: "parallel" },
        }];
      case "fibonacci": {
        return [{
          type: "fibonacci",
          points: [
            { timestamp: fibLow.timestamp, value: fibLow.low },
            { timestamp: fibHigh.timestamp, value: fibHigh.high },
          ],
          color: FIB,
          lineWidth: 1.5,
        }];
      }
      case "measure":
        return [{
          type: "measure",
          points: [
            { timestamp: zoneLow.timestamp, value: zoneLow.low },
            { timestamp: zoneHigh.timestamp, value: zoneHigh.high },
          ],
          color: MEASURE,
          lineWidth: 1.5,
        }];
      case "annotation:tag":
        return [{
          type: "annotation",
          points: [
            { timestamp: tagPoint.timestamp, value: tagPoint.high },
            { timestamp: tagPoint.timestamp, value: tagPoint.high * 1.02 },
          ],
          color: NOTE,
          backgroundColor: NOTE,
          backgroundOpacity: 0.92,
          lineWidth: 1.5,
          annotation: { kind: "tag", placement: "bottom" },
          text: `$${tagPoint.high.toFixed(2)}`,
        }];
      case "annotation:arrow":
        return [{
          type: "annotation",
          points: [
            { timestamp: breakoutPoint.timestamp, value: breakoutPoint.high },
          ],
          color: NOTE,
          backgroundColor: NOTE,
          backgroundOpacity: 0.94,
          lineWidth: 2,
          annotation: { kind: "arrow", placement: "bottom" },
          text: "Breakout",
        }];
      case "annotation:image":
        return [{
          type: "annotation",
          points: [
            { timestamp: eventPoint.timestamp, value: eventPoint.low },
            { timestamp: eventPoint.timestamp, value: eventPoint.low * 0.97 },
          ],
          color: NOTE,
          lineWidth: 1.5,
          annotation: { kind: "image", placement: "bottom" },
          imageUrl: eventBadge,
          text: "Earnings beat",
        }];
    }
  };

/** Full overlay set retained for API examples and downstream consumers. */
export const drawingOverlayFactory = (data: KLineData[], theme: LandingThemeTokens): OverlayInput[] =>
  ([
    "line:trend",
    "channel:parallel",
    "fibonacci",
    "measure",
    "annotation:tag",
    "annotation:arrow",
    "annotation:image",
  ] as DrawingOverlayKind[]).flatMap((kind) => drawingOverlayFactoryFor(kind)(data, theme));
