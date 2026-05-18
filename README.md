# Autonomous-Cortex

Agentic RAG — ReAct + tools, optional HTTP to NeuralPulse / SpatialNexus.

**GitHub:** [Kimosabey/autonomous-cortex](https://github.com/Kimosabey/autonomous-cortex)

`git clone git@github.com:Kimosabey/autonomous-cortex.git` (uses your existing `~/.ssh/config` for GitHub)

**API port:** `8104`

## Run

**Docker:** `docker compose up --build` → [http://localhost:8104/health](http://localhost:8104/health)

**Local:** `pip install -r requirements.txt` → `uvicorn app.main:app --reload --host 0.0.0.0 --port 8104`

OpenAPI: [http://localhost:8104/docs](http://localhost:8104/docs)
