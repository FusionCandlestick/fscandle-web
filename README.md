# fscandle-web

Marketing site and interactive playground for [**fscandle**](https://github.com/FusionCandlestick/fscandle) — the free-form HTML5 Canvas K-line chart engine.

Static site, no server runtime. Two routes are the whole surface:

- `/` — product homepage: capability tour, live demos, FAQ, SEO/GEO metadata
- `/playground` — a FusionQuant-style workspace shell: drawing tools and layers, compare series, watchlist, layouts, screenshot, fullscreen, symbol switching

## Develop

```bash
npm install
npm run dev
```

The `fscandle` engine is a normal npm dependency (`fscandle@^0.1.0`). To develop
against a local checkout of the engine instead, `npm link` it:

```bash
cd ../fscandle && npm run build:library && npm link
cd ../fscandle-web && npm link fscandle
```

## Deploy

`next.config.ts` sets `output: "export"`. Pushing to `main` runs
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
| `npm run lint` | ESLint (eslint-config-next) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:e2e` | Playwright — routes, gestures, screenshot regression |
| `npm run test:e2e:update` | refresh screenshot baselines |

## Data

`public/data/fmp/` holds cached daily/intraday OHLC JSON for the playground's
built-in symbols. `/playground` fetches these directly; there is no data API.

## License

Non-commercial, inherited from the engine. See
[fscandle/LICENSE](https://github.com/FusionCandlestick/fscandle/blob/main/LICENSE).
