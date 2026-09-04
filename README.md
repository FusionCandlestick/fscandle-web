# fscandle-web

Marketing site and interactive playground for [**fscandle**](https://github.com/FusionCandlestick/fscandle) — the free-form HTML5 Canvas K-line chart engine.

Deploys to `fusioncandlestick.dev`. Two routes are the whole surface:

- `/` — product homepage: capability tour, live demos, FAQ, SEO/GEO metadata
- `/playground` — a FusionQuant-style workspace shell: drawing tools and layers, compare series, watchlist, layouts, screenshot, fullscreen, symbol switching

Every route prerenders to static HTML; there is no server runtime.

## Develop

```bash
npm install          # links ../fscandle as the `fscandle` dependency
npm run dev
```

The `fscandle` engine is consumed as a local `file:` dependency during
development. `next.config.ts` pins the Turbopack workspace root one level up so
the symlink resolves, and lists `fscandle` in `transpilePackages`. When the
package is published, swap the dependency in `package.json` for a version range.

If you change the engine, rebuild it so the `dist/` the app imports is current:

```bash
cd ../fscandle && npm run build:library
```

## Commands

| command | what it does |
| --- | --- |
| `npm run dev` | Next dev server |
| `npm run build` | production build (static export-ready) |
| `npm run start` | serve the production build |
| `npm run lint` | ESLint (eslint-config-next) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:e2e` | Playwright — routes, gestures, screenshot regression |
| `npm run test:e2e:update` | refresh screenshot baselines |
| `npm run capture:media` | regenerate the engine README screenshots from a production build |

## Data

`public/data/fmp/` holds cached daily/intraday OHLC JSON for the playground's
built-in symbols. `/playground` fetches these directly; there is no data API.

## License

Non-commercial. See [`../fscandle/LICENSE`](https://github.com/FusionCandlestick/fscandle/blob/main/LICENSE).
