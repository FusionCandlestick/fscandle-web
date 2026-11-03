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

The engine is pinned to `vendor/fscandle-0.1.2.tgz`. This local candidate
contains the indicator plugin APIs required by the site; the registry package
with the same version does not. The lockfile verifies tarball integrity; no sibling
checkout is needed to install. Local source-directory dependencies and links
remain forbidden.

For an engine update, build and test the engine in its own checkout, generate
its tarball with `npm pack --ignore-scripts`, and replace the vendored artifact.
Regenerate `package-lock.json` with `npm install --package-lock-only`, then verify a clean `npm ci`, unit tests and static build. Keep the
previous release artifact for rollback; version text alone does not identify
these local candidates.

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

`public/data/fmp/` holds bundled demonstration OHLC JSON. Its per-symbol manifests
declare Yahoo daily cache inputs and intraday bars synthesised from daily OHLC;
the directory name does not establish an FMP source. `/playground` fetches bars
directly and does not load those manifests. There is no data API.

These files do not establish currency, adjustment, historical identity or when
a completed weekly bar became available. Replay is a chart demonstration, not
a point-in-time research/account receipt; synthetic intraday bars are not real trades.

## License

Non-commercial, inherited from the engine. See
[fscandle/LICENSE](https://github.com/FusionCandlestick/fscandle/blob/main/LICENSE).
