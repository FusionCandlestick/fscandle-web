# Changelog

All notable changes to the fscandle-web site are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The site
versions with the engine it pins: `fscandle` 0.1.2.

## [0.1.2] - 2026-11-03

### Changed

- The engine is `fscandle` 0.1.2 (`vendor/fscandle-0.1.2.tgz`, identical in
  content to the npm package). It fixes pointer placement when the top time ruler
  is off, limits magnet snapping to 12px, and adds WebSocket feed reconnection
  with backoff.
- The structured data (`softwareVersion`) and `public/llms.txt` report 0.1.2.
- Bundled data is described as demonstration data with unverified provenance.
  README, `llms.txt` and the playground comments no longer say intraday bars are
  full-year history or that they are authenticated. Each symbol's manifest names
  Financial Modeling Prep as its source and lists no synthetic series. Daily bars
  cover 2025; intraday bars cover only recent windows. The repository has no fetch
  script, and the daily and 1-minute bars do not reconcile exactly, so the origin
  cannot be confirmed from here. News items name their source site but are not
  recorded as retrieved, so they are not verified as reproduced text.
- The README's engine section no longer calls the vendored tarball a local
  candidate or says the registry package differs from it.
