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
- The README's engine section no longer calls the vendored tarball a local
  candidate or says the registry package differs from it.
