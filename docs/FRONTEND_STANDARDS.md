# FusionCandlestick Frontend & UI/UX Standards

Version: 1.0.0  
Last updated: 2026-08-30  
Status: Active Engineering & Design System Standard  

---

## 1. Product Feel & Design Philosophy

FusionCandlestick functions both as an ultra-high-performance HTML5 Canvas K-line financial charting engine and as a professional terminal workspace shell (e.g., `/playground`). The visual language is rooted in **extreme density, subpixel precision, mathematical curvature continuity, and zero cognitive noise**.

### Core Tenets
1. **High Information Density**: Built on an `8px / 4px` rhythm ceiling; every pixel is utilized for market data scanning, indicator analysis, and drawing precision. Widths below `800px` are non-target analytical surfaces.
2. **Mathematical Curvature Continuity**: Container elements, floating toolbars, overlays, and modal dialogs strictly abandon abrupt circular fillets ($n=2$) in favor of **$n = 3$ Order Lamé Superellipses (Squircles)** ($G^2$ curvature continuous transitions).
3. **Subpixel & High-DPI Precision**: Direct Canvas rendering maps strictly to `devicePixelRatio` with integer coordinate snapping on 1px gridlines, preventing antialiasing blur on candles, crosshairs, and axes.
4. **Dark Financial Palette**: Deep OLED/slate backgrounds with high-contrast, non-glaring data tiers and internationalized semantic color tokens for rising/falling candles.
5. **Flat and Precise**: Prefer thin 1px borders, subtle opacity, and semantic separation over consumer-grade drop shadows or decorative gradients.

---

## 2. Mathematical Geometry Specification: order-3 superellipse (squircle), $n = 3$

Standard UI frameworks rely on circular fillets (`border-radius: r`), which produce a discontinuous curvature gradient ($G^1$ continuity) where straight edges meet circular arcs, causing visual "pinching" at the corners. FusionCandlestick strictly mandates **$n = 3$ Lamé Superellipse Geometry** for all bounded surfaces.

### 2.1 The Lamé Curve Equation
For a bounding box of dimensions $2a \times 2b$, the boundary conforms to:
$$\left| \frac{x}{a} \right|^3 + \left| \frac{y}{b} \right|^3 = 1$$

In parametric form:
$$x(t) = a \cdot \operatorname{sgn}(\cos t) \cdot |\cos t|^{2/3}$$
$$y(t) = b \cdot \operatorname{sgn}(\sin t) \cdot |\sin t|^{2/3}, \quad t \in [0, 2\pi)$$

### 2.2 Implementation Guidelines
* **CSS Implementation**: 
  ```css
  [data-lp-root] article,
  [data-lp-root] button,
  [data-lp-root] input,
  [data-lp-root] select,
  [data-lp-root] [class*="rounded-"],
  [data-lp-root] .surface-glass {
    corner-shape: superellipse(3);
  }
  ```
* **Canvas Overlays & Toolbars**: Floating HUDs, price badges, and crosshair tag rectangles rendered in Canvas 2D context must use the internal `drawSquircleN3(ctx, x, y, width, height, r)` path helper.
* **Component Targets**:
  - Main Chart Workspace Panels & Panes (Top toolbar, bottom indicator selector, right watchlist).
  - Floating Toolbars & Data Tooltips (OHLC readout HUD, drawing modifier bar).
  - Modal dialogues (indicator parameter configuration, symbol search modal).
  - Interactive Action Badges & Buttons (`4px` squircle equivalent).

---

## 3. Tech Stack & Engineering Contracts

FusionCandlestick maintains an ultralight, highly optimized dependency graph:

* **Framework**: Next.js `16.2.x` (App Router) + React `19.2.x` (React 19 Server/Client components)
* **Language & Type System**: TypeScript `6.0.3` (Strict mode, zero `any` policy)
* **Styling**: Tailwind CSS `v4` (`@tailwindcss/postcss`)
* **Renderer**: Native HTML5 2D Canvas + Web Workers for offscreen calculation / indicator streaming
* **Bundler & Exports**: `tsup` for multi-format artifacts (CJS, ESM, `.d.ts`, `/react`, `/datafeed`)

---

## 4. Field Naming & Data Contracts

**Critical rule**: All frontend and engine code uses canonical `camelCase` fields only.

* Do not read `snake_case` fields from API payloads.
* Do not add fallback alias chains for older names.
* Let TypeScript fail loudly when the backend contract drifts.

Common canonical fields:
| Domain | Canonical field | Prohibited examples |
| :--- | :--- | :--- |
| KLine Data | `timestamp`, `open`, `high`, `low`, `close`, `volume`, `turnover` | `time`, `vol`, `open_price`, `c` |
| Quote | `changesPercentage`, `marketCap`, `avgVolume` | `change_percent`, `market_cap`, `avg_volume` |
| Overlay | `points`, `color`, `lineWidth`, `magnetSnap` | `line_width`, `magnet_snap` |

---

## 5. Color Palette & Token System

All color tokens are engineered for OLED and high-contrast professional monitors:

```css
/* Base Canvas & Backgrounds */
--fc-bg-canvas:        #0d1117;   /* Ultra-deep workspace backdrop */
--fc-bg-panel:         #161b22;   /* Structural panel & sidebar background */
--fc-bg-surface:       #21262d;   /* Floating cards, squircle dropdowns */
--fc-border-subtle:    #30363d;   /* 1px structural dividing lines */
--fc-border-focus:     #58a6ff;   /* Focus outline & active selection */

/* Financial Semantic Colors */
--fc-up-green:         #089981;   /* Bullish candles, upward indicators */
--fc-down-red:         #f23645;   /* Bearish candles, downward indicators */
--fc-neutral-axis:     #8b949e;   /* Axis ticks, timestamps, grid text */
--fc-crosshair-line:   #484f58;   /* Dotted / dashed crosshair guide */
--fc-overlay-accent:   #2962ff;   /* Fibonacci, trendline, drawing defaults */
```

---

## 6. Layout Architecture & Workspace Rhythm

### 6.1 Landing Page Showcase Grid (40% : 30% : 30%)
Large screens (`xl:` / `2xl:`) implement a strict 3-column proportional grid (`xl:grid-cols-[4fr_3fr_3fr]`):
* **Column 1 (40%)**: Live Canvas Chart Canvas (`h-[280px] sm:h-[320px] min-[1000px]:h-[350px] xl:h-[360px] 2xl:h-[375px]`).
* **Column 2 (30%)**: Text Description & Interactive Controls (`h-full flex flex-col justify-between`).
* **Column 3 (30%)**: Concise Modern API Code Example (`h-[330px] 2xl:h-[345px]`).

### 6.2 Terminal Workspace Layout (`/playground`)
The `/playground` layout implements a modular, high-density 4-zone grid:
```
+-------------------------------------------------------------------------+
| Top Bar: Symbol Search | Timeframes | Indicators | Chart Types | Export |
+-----------------------+---------------------------------+---------------+
| Left Drawing Toolbar  | Main Multi-Pane Chart Canvas    | Right Pane:   |
| (Trend, Fib, Shapes,  | - Main Price Pane (Candles/MA)  | - Watchlist   |
|  Text, Magnet Snap)   | - Sub-Pane 1 (Volume / VOLMA)   | - Order Book  |
| (n=3 Squircle Badges) | - Sub-Pane 2 (MACD / RSI / KDJ) | - Quick Trade |
+-----------------------+---------------------------------+---------------+
| Bottom Bar: Timezone Selector | Session Indicator | Connection Status   |
+-------------------------------------------------------------------------+
```

### 6.3 Subpixel Alignment
Translate Canvas coordinate context by `(0.5, 0.5)` for 1px line strokes to prevent blur:
```ts
ctx.translate(0.5, 0.5);
```

---

## 7. Directory Structure

```
src/
├── chart/              # Core Chart Engine (Rendering loop, scale models, viewport)
├── engine/             # Math kernel, CoordinateTransformer, OverlayManager
├── components/         # React wrappers and shared financial UI primitives
├── datafeed/           # Market data feeds, WebSocket adapters, replay generators
├── types/              # Canonical TypeScript contracts & options
└── app/                # Next.js App Router (Landing page, Playground sandbox, SEO)
    ├── components/landing/ # Showcase sections, ThemeContext, SiteHeader, Footer
    ├── playground/         # High-density multi-pane financial terminal
    ├── robots.ts           # Search engine crawling rules
    └── sitemap.ts          # Sitemap generator
```

---

## 8. Review & Quality Checklist

Before merging UI or chart engine changes into `FusionCandlestick`:

- [ ] **Curvature Check**: Do all floating containers, modals, and badges adhere to the $n=3$ order squircle geometry?
- [ ] **Render Performance**: Does the Canvas 120 FPS loop execute without layout thrashing or garbage-collection spikes during rapid pan/zoom?
- [ ] **Canonical Naming**: Are all data feed interfaces typed in `camelCase` without legacy snake_case leakage?
- [ ] **Subpixel Alignment**: Are price rails, crosshairs, and candle borders rendered razor-sharp on Retina / High-DPI displays?
- [ ] **Internationalization**: Do all toolbars and indicator names resolve through the 9-locale `i18n` dictionary?
- [ ] **SEO & Structured Data**: Are all public pages enriched with standard semantic tags, Schema.org `FAQPage` / `SoftwareApplication` JSON-LD, and robots/sitemap entries?
