import json
import os
import re
import uuid
from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

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
NEURAL_PULSE_BASE_URL = os.getenv("NEURAL_PULSE_BASE_URL", "http://127.0.0.1:8102").rstrip("/")
SPATIAL_NEXUS_BASE_URL = os.getenv("SPATIAL_NEXUS_BASE_URL", "http://127.0.0.1:8103").rstrip("/")
TOOL_TIMEOUT = float(os.getenv("CORTEX_TOOL_TIMEOUT", "45"))

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

_cors = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
ALLOW_ORIGINS = [o.strip() for o in _cors.split(",") if o.strip()]

ASSET_RE = re.compile(r"\b[A-Z]{2,10}-[A-Z0-9][A-Z0-9-]*\b")

app = FastAPI(
    title="Autonomous-Cortex",
    description="Agentic workflow with live NeuralPulse + SpatialNexus tools.",
    version="0.2.0",
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


def _pick_asset_id(message: str, search_payload: dict[str, Any] | None) -> str:
    m = ASSET_RE.search(message.upper())
    if m:
        return m.group(0)
    if search_payload and search_payload.get("hits"):
        hit = search_payload["hits"][0]
        pn = hit.get("part_number")
        if isinstance(pn, str) and ASSET_RE.search(pn.upper()):
            return ASSET_RE.search(pn.upper()).group(0)
        hid = hit.get("id")
        if isinstance(hid, str) and ASSET_RE.search(hid.upper()):
            return ASSET_RE.search(hid.upper()).group(0)
    return "PUMP-A1"


def _truncate(obj: Any, limit: int = 3500) -> str:
    s = json.dumps(obj, default=str)
    if len(s) <= limit:
        return s
    return s[: limit - 3] + "..."


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

    yield _sse(
        {
            "event": "thought",
            "text": "Calling NeuralPulse hybrid search and SpatialNexus graph impact.",
        },
    )

    search_payload: dict[str, Any] | None = None
    impact_payload: dict[str, Any] | None = None
    neural_err: str | None = None
    spatial_err: str | None = None

    async with httpx.AsyncClient(timeout=TOOL_TIMEOUT) as client:
        try:
            r = await client.post(
                f"{NEURAL_PULSE_BASE_URL}/v1/search",
                json={"q": message.strip()[:2000]},
            )
            if r.is_success:
                search_payload = r.json()
            else:
                neural_err = f"HTTP {r.status_code}: {r.text[:400]}"
        except httpx.HTTPError as e:
            neural_err = str(e)

        asset_id = _pick_asset_id(message, search_payload)

        try:
            r2 = await client.post(
                f"{SPATIAL_NEXUS_BASE_URL}/v1/impact",
                json={"asset_id": asset_id, "horizon_hours": 24},
            )
            if r2.is_success:
                impact_payload = r2.json()
            else:
                spatial_err = f"HTTP {r2.status_code}: {r2.text[:400]}"
        except httpx.HTTPError as e:
            spatial_err = str(e)

    yield _sse(
        {
            "event": "tool",
            "name": "neural_pulse.search",
            "detail": {
                "url": f"{NEURAL_PULSE_BASE_URL}/v1/search",
                "response_excerpt": search_payload,
                "error": neural_err,
            },
        },
    )

    yield _sse(
        {
            "event": "tool",
            "name": "spatial_nexus.impact",
            "detail": {
                "url": f"{SPATIAL_NEXUS_BASE_URL}/v1/impact",
                "asset_id": asset_id,
                "response_excerpt": impact_payload,
                "error": spatial_err,
            },
        },
    )

    tool_errs = [x for x in (neural_err, spatial_err) if x]
        "Tool results (verbatim JSON excerpts for analyst):",
        "NeuralPulse:",
        _truncate(search_payload) if search_payload else "(no data)",
        "SpatialNexus:",
        _truncate(impact_payload) if impact_payload else "(no data)",
    ]
    if tool_errs:
        ctx_parts.append("Errors: " + "; ".join(tool_errs))

    prompt = (
        "You are an Autonomous Cortex analyst. Synthesize in 3–5 short sentences using the tool JSON. "
        "Do not claim verified physical state. If a tool errored, say so.\n\n"
        f"User message:\n{message.strip()}\n\n"
        + "\n".join(ctx_parts)
    )

    answer = await _ollama_reply(prompt)
    if not answer:
        if tool_errs and not search_payload and not impact_payload:
            answer = "Investigation incomplete: all tools failed. " + " ".join(tool_errs[:2])
        elif not OLLAMA_BASE_URL:
            answer = "OLLAMA_BASE_URL is not set — configure Ollama for narrative synthesis. Raw tools only: see prior events."
        else:
            answer = (
                "The synthesis model did not return text. Summary from tools only — "
                f"NeuralPulse hits: {len((search_payload or {}).get('hits') or [])}, "
                f"SpatialNexus nodes: {len((impact_payload or {}).get('nodes') or [])}."
            )

    yield _sse({"event": "answer", "text": answer})
    yield _sse({"event": "done", "request_id": rid})


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": SERVICE_SLUG,
        "port": PORT,
        "neural_pulse": NEURAL_PULSE_BASE_URL,
        "spatial_nexus": SPATIAL_NEXUS_BASE_URL,
    }


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
