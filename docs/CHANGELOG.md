# Changelog — Autonomous-Cortex

## [Unreleased]

### Fixed
- Restored `ctx_parts = [` opener — without it the module failed to import,
  so `/v1/investigate` never started.

### Added
- `GET /v1/tools` — tool discovery (name, method, path, url_env, resolved
  target URL, purpose). Useful for ops + downstream chaining.
- `GET /v1/audit-log?limit=` — in-memory ring buffer (max 200) of recent
  investigations with tool hit/error counts and answer excerpts.
- Mission Console UI theme — amber alert + slate ops + Manrope display +
  JetBrains Mono, radar-sweep watermark, status LED row, dashed amber accent.
- WCAG primitives: skip-link, reduced-motion, focus rings.
- LAN-IP CORS via `CORS_ORIGIN_REGEX`; suite share-URL script wired in.
- Docs: `API.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `SCREENSHOTS.md`, banner SVG.

### Changed
- README: banner header, URL grid (localhost + LAN), doc index, new endpoint rows.

## [0.2.0]

- ReAct streaming with real HTTP calls to NeuralPulse + SpatialNexus.
- Initial Vite + React UI with SSE tool timeline.
