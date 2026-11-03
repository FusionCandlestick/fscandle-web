# FusionCandlestick frontend conventions

Scope: the current static homepage and `/playground`. This document describes
existing ownership and review criteria; older layout sketches are not a feature queue.
Dependency versions and commands are defined by `package.json` and its lockfile.

## Ownership

- Next.js App Router exports HTML/CSS/JS to `out/`; production has no data API.
- The engine is the pinned `vendor/fscandle-0.1.2.tgz` artifact. Rendering,
  indicators and package exports belong to the engine repository. Update the
  artifact using [README](../README.md#develop), preserving its identity and rollback.
- Workspace state belongs to `src/store/WorkspaceStore.ts`; chart instances and
  imperative adapters belong to `src/app/playground/PlaygroundChart.tsx`.
- The indicator library uses compiled plugins. Retired formula strings are not
  executable inputs. Keep restored indicators attached to their original panel.

## Themes, typography and geometry

Homepage tokens/styles live in `src/app/components/landing/`; workspace tokens
and controls live in `src/app/ui/`. Their palettes and control sizes differ.
Do not merge them solely because token names match. Keep border and seam semantics.

`globals.css` owns system body/mono fonts, typography variables, native field
styling and the `corner-shape` enhancement. `next/font/google` supplies Outfit for
`Wordmark`. Browser support and actual contrast require visual acceptance; CSS
syntax alone does not prove mathematical curvature or accessible contrast.

Use the owning surface's class helpers and existing sizes. Preserve native
select/date/color/range controls, visible keyboard focus, disabled states and
popover wrapping. Keep separate browser-specific range selectors: unsupported
pseudo-elements can invalidate a combined selector list.

## Layout and behavior

The homepage showcase is one column below 1000px, two from 1000px, and a 4:3:3
chart/controls/code grid at `xl`. The article is 376px high at `xl`, with a 340px
chart. Smaller layouts switch controls/code through the existing toggle.

The workspace has a top toolbar, left drawing sidebar and one, two or four
chart panels. Watchlist and comparison actions live in the symbol picker;
comparison is exposed only in single-panel mode. Settings own drawing layers.
There is no current right-side order book, quick-trade panel or bottom status bar.
Preserve mobile controls and active panel identity across layout changes.

Keep deferred chart loading, reduced-motion behavior, stale-request protection,
and timer/subscription/chart cleanup. A successful build does not establish
correct drawing, replay, fullscreen, download or touch behavior.

## Data and acceptance

Convert provider fields once at the loader boundary to the engine's camelCase
contract; do not add aliases throughout components. Preserve missing values and
fixed panel positions. Bundled bars are demonstration inputs, not proof of
historical identity, currency, adjustment, account holdings or execution provenance.
The playground's UTC-encoded exchange wall clock is a display convention, not an
assertion of the real UTC trading instant.

Use the relevant existing lint, type, unit and build commands. Browser suites
cover routes, indicators, gestures and screenshots; run them when the environment
supports them. Do not remove meaningful assertions to pass or regenerate image
baselines without reviewing the visual change. The optional browser performance
command runs separately from CI/build; page RAF intervals and sampled heap changes
are limited evidence, not guaranteed chart FPS or leak freedom.

Keep canonical URLs and structured data tied to actual content and deployment.
FAQ JSON-LD belongs with the homepage FAQ. Custom-domain metadata and GitHub Pages
base paths need deployment verification; do not infer it from local output.
