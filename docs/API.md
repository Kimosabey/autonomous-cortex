# Autonomous-Cortex — API reference

Base URL — `http://127.0.0.1:8104` (or `http://<LAN_IP>:8104`). OpenAPI at `/docs`.

## Endpoint summary

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/health` | service liveness + target URLs |
| `POST` | `/v1/investigate` | streamed agentic investigation (SSE) |
| `GET`  | `/v1/tools` | **NEW** — discovery of registered tools |
| `GET`  | `/v1/audit-log` | **NEW** — ring buffer of recent investigations |

## POST /v1/investigate  (SSE)

Body:

```json
{ "message": "Chilled-water pump P-CP-S3 trips every 20 minutes — what should we check?" }
```

Event sequence (Server-Sent Events):

```
data: {"event":"start","request_id":"…"}
data: {"event":"thought","text":"Calling NeuralPulse hybrid search and SpatialNexus graph impact."}
data: {"event":"tool","name":"neural_pulse.search","detail":{"url":"…","response_excerpt":{…},"error":null}}
data: {"event":"tool","name":"spatial_nexus.impact","detail":{"asset_id":"P-CP-S3","response_excerpt":{…},"error":null}}
data: {"event":"answer","text":"…"}
data: {"event":"done","request_id":"…"}
```

Tools called: `neural_pulse.search` and `spatial_nexus.impact` over HTTP, plus
`ollama.generate` (synthesizer) when `OLLAMA_BASE_URL` is set. Tool failures
are reported in `detail.error` and the synthesizer is asked to acknowledge them.

## GET /v1/tools  (new)

```json
{
  "tools": [
    { "name":"neural_pulse.search", "method":"POST", "path":"/v1/search",
      "url_env":"NEURAL_PULSE_BASE_URL", "target_url":"http://127.0.0.1:8102",
      "purpose":"Hybrid lexical + vector search …" },
    { "name":"spatial_nexus.impact", "method":"POST", "path":"/v1/impact",
      "url_env":"SPATIAL_NEXUS_BASE_URL", "target_url":"http://127.0.0.1:8103",
      "purpose":"Neo4j topology — downstream dependencies + narrative." },
    { "name":"ollama.generate", "method":"POST", "path":"/api/generate",
      "url_env":"OLLAMA_BASE_URL", "target_url":null,
      "purpose":"Local synthesis model for the analyst summary." }
  ]
}
```

`target_url` is `null` when the env var is unset (e.g. Ollama not configured).

## GET /v1/audit-log  (new)

Query string: `?limit=50` (1..200, default 50).

```json
{
  "count": 12,
  "limit": 50,
  "items": [
    {
      "request_id": "…",
      "ts": 1736400000.12,
      "message_excerpt": "Chilled-water pump P-CP-S3 …",
      "asset_id": "P-CP-S3",
      "tools": {
        "neural_pulse.search":  {"hits": 4, "error": null},
        "spatial_nexus.impact": {"nodes": 7, "error": null}
      },
      "answer_excerpt": "…"
    }
  ]
}
```

In-memory ring buffer (max 200) suitable for the on-prem POC. Swap for
Postgres-backed logging if retention requirements demand it.
