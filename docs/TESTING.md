# Autonomous-Cortex — smoke tests

**Prerequisites:** Ollama (`OLLAMA_BASE_URL`); NeuralPulse (`8102`) and SpatialNexus (`8103`) reachable (or expect tool errors in SSE).

```text
BASE=http://127.0.0.1:8104
```

| Step | Expected |
|------|----------|
| `GET $BASE/health` | Shows `neural_pulse` and `spatial_nexus` base URLs |
| `POST $BASE/v1/investigate` with `{"message":"Search for pump fault and impact of PUMP-A1"}` (SSE) Events include `tool` with real `response_excerpt` or `error`, then `answer` and `done` |
