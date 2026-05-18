# Autonomous-Cortex — screenshots to capture

PNG, 1600×1000, into `docs/img/`.

| File | Shows |
|------|-------|
| `docs/img/banner.svg`           | Mission Console banner (committed) |
| `docs/img/01-hero.png`          | Hero with radar sweep + status LEDs |
| `docs/img/02-message-form.png`  | Message form with example briefs |
| `docs/img/03-stream-tools.png`  | Tool timeline mid-stream (NP + SN events) |
| `docs/img/04-answer.png`        | Final answer panel |
| `docs/img/05-tools-endpoint.png` | `GET /v1/tools` JSON snapshot |
| `docs/img/06-audit-log.png`     | `GET /v1/audit-log` snapshot after several runs |

Run NeuralPulse + SpatialNexus first so tools resolve real payloads; otherwise
the timeline shows `error` strings instead of `hits`/`nodes` counts (this is
fine to capture — it demonstrates the failure UX).
