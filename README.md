# Autonomous-Cortex

Agentic RAG — investigation flow with streamed **thoughts**, **tool** steps, and final **answer** (SSE). Optional Ollama for synthesis.

**GitHub:** [Kimosabey/autonomous-cortex](https://github.com/Kimosabey/autonomous-cortex)

```bash
git clone git@github.com:Kimosabey/autonomous-cortex.git
```

Uses your existing `~/.ssh/config` for GitHub.

| | |
|--|--|
| **API port** | `8104` (override with `PORT`) |
| **OpenAPI** | `/docs` |
| **Roadmap** | [docs/PLAN.md](docs/PLAN.md) |
| **UI rules** | [docs/UI.md](docs/UI.md) |

## API

- `GET /health`
- `POST /v1/investigate` — JSON: `message`; response `text/event-stream` with `data: {JSON}` lines (`event`: `start`, `thought`, `tool`, `answer`, `done`)

### Environment

| Variable | Purpose |
|----------|---------|
| `PORT` | Default `8104` |
| `OLLAMA_BASE_URL` | Optional LLM |
| `CORTEX_MODEL` | Default synthesis model id |
| `CORS_ORIGINS` | Comma-separated allowed origins |

See [.env.example](.env.example).

### Local (API only)

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8104
```

## Web UI (`web/`)

Investigation console: main brief + sidebar tool/timeline (SSE). Dev proxy → **8104**.

```bash
cd web
npm install
npm run dev
```

[web/README.md](web/README.md)

## Docker

```bash
docker compose up --build
```

- [http://localhost:8104](http://localhost:8104), [http://localhost:8104/health](http://localhost:8104/health), [http://localhost:8104/docs](http://localhost:8104/docs)
