# Autonomous-Cortex — smoke tests

**Prerequisites:** Ollama (`OLLAMA_BASE_URL`); NeuralPulse (`8102`) and SpatialNexus (`8103`) reachable (or expect tool errors in SSE).

```text
BASE=http://127.0.0.1:8104
```

| Step | Expected |
|------|----------|
| `GET $BASE/health` | Shows `neural_pulse` and `spatial_nexus` base URLs |
| `POST $BASE/v1/investigate` with `{"message":"Search for pump fault and impact of PUMP-A1"}` (SSE) | Events include `tool` with real `response_excerpt` or `error`, then `answer` and `done` |
| **Tools (new)** `GET $BASE/v1/tools` | `200`; lists `neural_pulse.search`, `spatial_nexus.impact`, `ollama.generate` with resolved `target_url` (or `null` when env var unset) |
| **Audit log (new)** `GET $BASE/v1/audit-log?limit=20` | `200`; `items` ordered newest first; each entry has `request_id`, `asset_id`, `tools` counts |
| Audit log empty | Fresh process | `200`; `count: 0`, `items: []` |
| Audit log clamp | `?limit=99999` | `200`; effective `limit=200` |

```bash
# After several /v1/investigate calls:
curl -sS "$BASE/v1/tools"          | jq '.tools[].name'
curl -sS "$BASE/v1/audit-log?limit=5" | jq '.count, .items[0].asset_id'
```
