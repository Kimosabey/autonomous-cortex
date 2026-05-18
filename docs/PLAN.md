# Autonomous-Cortex — implementation plan

**Repo:** [Kimosabey/autonomous-cortex](https://github.com/Kimosabey/autonomous-cortex) · **API:** port `8104`

## Product goal

**Agentic RAG:** **ReAct** loop + **tools** (telemetry, NeuralPulse, SpatialNexus, docs); **read-only** to field systems by default; **dry-run** only for control suggestions.

## Suite UI standards

**Vite + React + TS**, **Tailwind (light-only)**, **Framer Motion** + **Aceternity-style** (e.g. animated borders on tool timeline), **Lucide**, **TanStack Query**, **RHF + Zod**, **React Router**. Primary pattern: **SSE** for streaming thoughts / tool calls / final answer.

## Milestones

| Phase | Backend | Web UI |
|-------|---------|--------|
| **M1** | `POST /v1/investigate` stub + **SSE** mock events (`thought`, `tool`, `message`) | Scaffold `web/`; **chat** layout + **sidebar tool log** with motion |
| **M2** | Real ReAct + tool registry; timeouts | Live stream UI; cancel / timeout feedback |
| **M3** | HTTP clients to **NeuralPulse** / **SpatialNexus** (env URLs) | Display tool payloads + deep links |
| **M4** | RBAC, audit logging | User role indicators |

## Current status

- FastAPI scaffold + `/health` live.
- **`web/`** and agent pipeline **not started**.

## Dependency on other services

Configure: `NEURAL_PULSE_BASE_URL`, `SPATIAL_NEXUS_BASE_URL` (when those APIs exist).
