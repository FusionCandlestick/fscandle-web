# fscandle-web

Marketing site and interactive playground for [**fscandle**](https://github.com/FusionCandlestick/fscandle) — the free-form HTML5 Canvas K-line chart engine.

Static site, no server runtime. Two routes are the whole surface:

- `/` — product homepage: capability tour, live demos, FAQ, SEO/GEO metadata
- `/playground` — a FusionQuant-style workspace shell: drawing tools and layers, compare series, watchlist, layouts, screenshot, fullscreen, symbol switching

## Develop

Use Node 22 and install the committed dependency lock:

```bash
npm ci
npm run dev
```

The engine is pinned to `vendor/fscandle-0.1.2.tgz`. Its contents are identical to
the npm package `fscandle@0.1.2`, and the lockfile verifies the tarball's integrity.
No sibling checkout is needed to install. Local source-directory dependencies and
links remain forbidden.

For an engine update, build and test the engine in its own checkout, generate its
tarball with `npm pack --ignore-scripts`, and replace the vendored artifact.
Regenerate `package-lock.json` with `npm install --package-lock-only`, then verify
a clean `npm ci`, unit tests and static build. Keep the previous release artifact
for rollback.

The indicator library uses compiled templates in
`src/app/playground/indicatorPlugins.ts`, installed through `useIndicatorPlugin`.
The retired free-form editor is no longer executed; legacy formula records are
filtered when restoring a workspace. Plugin instances can be removed from the
chart legend, including their persisted workspace entries.

## Deploy

`next.config.ts` sets `output: "export"`. The build script selects Next.js's supported Webpack compiler; this avoids the Turbopack/PostCSS internal-port failure reproduced during the architecture review. Pushing to `main` runs
`.github/workflows/deploy.yml`, which builds with
`NEXT_PUBLIC_BASE_PATH=/fscandle-web` and publishes `out/` to GitHub Pages at
`https://fusioncandlestick.github.io/fscandle-web/`. Point `fetch()` targets and
`url(...)` assets through `src/app/lib/asset.ts` so the base path is applied.
Drop `NEXT_PUBLIC_BASE_PATH` once the site moves to a custom domain.

## Commands

| command | what it does |
| --- | --- |
| `npm run dev` | Next dev server |
| `npm run build` | static export to `out/` |
| `npm start` | Preview the built static export on loopback; set the same `NEXT_PUBLIC_BASE_PATH` as at build time |
| `npm run test:unit` | Compiled indicator plugins and static export filesystem boundaries |
| `npm run lint` | ESLint (eslint-config-next) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:e2e` | Playwright — routes, gestures, screenshot regression |
| `npm run test:e2e:update` | refresh screenshot baselines |

## Data

Bundled demonstration data lives in `public/data/fmp/<SYMBOL>/`. Each symbol's
`manifest.json` names Financial Modeling Prep as its source and lists no synthetic
series. The playground loads the bar files directly and does not read the manifests.
There is no data API. The files cover:

- Daily bars for calendar 2025: BTC has 365 bars; NVDA, QQQ and SPY have 250
  trading days each.
- Intraday bars over recent windows only, not the full year. 1-minute bars cover
  the last three days, 1-hour bars start in early October 2025, and 4-hour bars
  start in early July 2025.

The repository has no script that fetches these files, so their origin cannot be
checked here. An earlier version of this section said intraday bars were
synthesised from daily OHLC. The current manifests no longer say that, and the
bundled data does not settle the question. For the three days where BTC has both
1-minute and daily bars, the aggregated 1-minute high and low matched the daily
bar on only one day, so the two sets do not reconcile exactly.

Each item in `news.json` names a source site and URL. The repository does not
record when or how the items were retrieved, so they are not verified as reproduced
article text or as a point-in-time record.

Replay plays these bars back for demonstration. It is not a point-in-time research
or account receipt. Nothing in the bundled files establishes currency, adjustment,
or when a completed bar became available.

## License

Non-commercial, inherited from the engine. See
[fscandle/LICENSE](https://github.com/FusionCandlestick/fscandle/blob/main/LICENSE).
