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

---

## Unicharm E2E scenario (live Ollama + real tools)

> Suite-level guide: [docs/E2E_TESTING.md](../../docs/E2E_TESTING.md)

```bash
BASE=http://127.0.0.1:8104
```

**Ollama synthesis model:** `llama3.2` on `http://100.125.103.28:11434`  
**Requires:** NeuralPulse (:8102) and SpatialNexus (:8103) running with data.

### Pre-flight check

```bash
curl $BASE/v1/tools
# neural_pulse.search  target_url: http://127.0.0.1:8102
# spatial_nexus.impact target_url: http://127.0.0.1:8103
# ollama.generate      target_url: http://100.125.103.28:11434
```

### Investigation chip tests

| ID | Chip | Extracted asset | NP hits | SN nodes | Expected answer content |
|----|------|----------------|---------|----------|------------------------|
| E2E-CX1 | Chiller 1 trip | CH-0001b00000 | 1+ (with doc) | 3 | PRISEQ-0001cb0000 and PV-0001b20000 at risk |
| E2E-CX2 | Condenser pump fail | CONDPU-0001b40000 | 1+ | 8+ | CT-0001b70000 and cooling circuit at risk |
| E2E-CX3 | Cooling tower offline | CT-0001b70000 | 1+ | 17 | Reduced condenser capacity; both chillers affected |
| E2E-CX4 | Energy meter anomaly | EM-0001000000 | 1+ | 1 | Calibration check; EM-0001 monitors CH-0001b00000 |
| E2E-CX5 | Primary pump low flow | PV-0001b20000 | 1+ | 4 | ZONE-RISER-A loses cooling |
| E2E-CX6 | Post-outage restart | PLANT-UNICHARM | 1+ | 39 | Restart order: MWP → CT → CONDPU → CHILLER → PP |

**Note:** NP hits require the Unicharm sample doc to be ingested first (see NeuralPulse E2E).  
SN nodes are always available — Neo4j is seeded.

### SSE stream shape (curl)

```bash
curl -N -X POST $BASE/v1/investigate \
  -H 'Content-Type: application/json' \
  -d '{"message":"CH-0001b00000 tripped on high condenser pressure. Downstream impact?"}'
```

Expected event sequence:
```
data: {"event":"start","request_id":"..."}
data: {"event":"thought","text":"Calling NeuralPulse hybrid search..."}
data: {"event":"tool","name":"neural_pulse.search","detail":{"response_excerpt":{...},"error":null}}
data: {"event":"tool","name":"spatial_nexus.impact","detail":{"nodes":[...],"error":null}}
data: {"event":"answer","text":"Based on the data, PRISEQ-0001cb0000 and PV-0001b20000 are downstream..."}
data: {"event":"done","request_id":"..."}
```

### Audit log verification

```bash
curl "$BASE/v1/audit-log?limit=5"
# Each entry: request_id, asset_id (CH-0001b00000), tool counts, answer_excerpt
```

### Asset-ID extraction cases

| Input message | Extracted asset |
|---|---|
| `CH-0001b00000 tripped` | `CH-0001b00000` (lowercase hex preserved) |
| `CONDPU-0001b40000 bearing noise` | `CONDPU-0001b40000` |
| `cooling tower CT-0001b70000` | `CT-0001b70000` |
| `pump PV-0001b20000 cavitation` | `PV-0001b20000` |
| `no asset id mentioned` | fallback `PUMP-A1` |
