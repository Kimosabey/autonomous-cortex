import os

from fastapi import FastAPI

SERVICE_SLUG = "autonomous-cortex"
PORT = int(os.getenv("PORT", "8104"))

app = FastAPI(
    title="Autonomous-Cortex",
    description="Agentic RAG + tools (scaffold).",
    version="0.1.0",
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": SERVICE_SLUG, "port": PORT}


@app.get("/")
def root() -> dict:
    return {
        "service": SERVICE_SLUG,
        "docs": "/docs",
        "health": "/health",
    }
