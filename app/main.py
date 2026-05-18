import asyncio
import json
import os
import uuid
from collections.abc import AsyncIterator
from pathlib import Path

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

SERVICE_SLUG = "autonomous-cortex"
PORT = int(os.getenv("PORT", "8104"))
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "").rstrip("/")
CORTEX_MODEL = os.getenv("CORTEX_MODEL", "llama3.2")

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

_cors = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
ALLOW_ORIGINS = [o.strip() for o in _cors.split(",") if o.strip()]

app = FastAPI(
    title="Autonomous-Cortex",
    description="Agentic RAG + tools (scaffold).",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class InvestigateRequest(BaseModel):
    message: str = Field(min_length=1, max_length=40_000)


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


async def _ollama_reply(prompt: str) -> str | None:
    if not OLLAMA_BASE_URL:
        return None
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": CORTEX_MODEL,
                    "prompt": prompt,
                    "stream": False,
                },
            )
            r.raise_for_status()
            return str(r.json().get("response", "")).strip() or None
    except httpx.HTTPError:
        return None


async def _investigate_events(message: str) -> AsyncIterator[str]:
    rid = str(uuid.uuid4())
    yield _sse({"event": "start", "request_id": rid})

    await asyncio.sleep(0.05)
    yield _sse(
        {
            "event": "thought",
            "text": "Partitioning the investigation into retrieval and tool checks.",
        },
    )

    await asyncio.sleep(0.05)
    yield _sse(
        {
            "event": "tool",
            "name": "neural_pulse.search",
            "detail": {"q": message[:120], "building": None},
        },
    )

    await asyncio.sleep(0.05)
    yield _sse(
        {
            "event": "tool",
            "name": "spatial_nexus.impact",
            "detail": {"asset_id": "stub-asset"},
        },
    )

    prompt = (
        "You are an Autonomous Cortex analyst. Reply in 2–3 short sentences. "
        "Do not claim verified physical state.\n\nUser:\n"
        f"{message}"
    )
    answer = await _ollama_reply(prompt)
    if not answer:
        answer = (
            f"[Stub] Synthesized next steps for: “{message[:160]}…”. "
            "Attach NeuralPulse hits and SpatialNexus impact before acting."
        )

    yield _sse({"event": "answer", "text": answer})
    yield _sse({"event": "done", "request_id": rid})


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": SERVICE_SLUG, "port": PORT}


@app.post("/v1/investigate")
async def investigate_v1(body: InvestigateRequest) -> StreamingResponse:
    return StreamingResponse(
        _investigate_events(body.message),
        media_type="text/event-stream",
    )


if STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="spa")
else:

    @app.get("/")
    def root() -> dict:
        return {
            "service": SERVICE_SLUG,
            "docs": "/docs",
            "health": "/health",
            "ui": "(dev: Vite :5173 → proxy :8104)",
        }
