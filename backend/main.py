"""LaunchLayer FastAPI entrypoint.

POST /api/launch — runs the 4-agent pipeline and returns the full result.
GET  /api/health — liveness probe.
"""

import json
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents import interpreter, signal_scout, content_engine, audience_sim


app = FastAPI(title="LaunchLayer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FALLBACK_PATH = Path(__file__).parent / "fallback_data.json"


class LaunchRequest(BaseModel):
    input_text: str
    input_type: str = "github_url"
    use_fallback: bool = False


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/fallback")
async def fallback():
    if not FALLBACK_PATH.exists():
        raise HTTPException(404, "no fallback data yet — run the pipeline once to seed it")
    return json.loads(FALLBACK_PATH.read_text())


@app.post("/api/launch")
async def launch(req: LaunchRequest):
    if req.use_fallback and FALLBACK_PATH.exists():
        return json.loads(FALLBACK_PATH.read_text())

    timings = {}
    result = {"meta": {"input": req.input_text, "input_type": req.input_type}}

    t0 = time.time()
    result["interpreter"] = await interpreter.run(req.input_text, req.input_type)
    timings["interpreter"] = round(time.time() - t0, 2)

    t0 = time.time()
    result["signal_scout"] = await signal_scout.run(result["interpreter"])
    timings["signal_scout"] = round(time.time() - t0, 2)

    t0 = time.time()
    result["content_engine"] = await content_engine.run(
        result["interpreter"], result["signal_scout"]
    )
    timings["content_engine"] = round(time.time() - t0, 2)

    t0 = time.time()
    result["audience_sim"] = await audience_sim.run(result["content_engine"])
    timings["audience_sim"] = round(time.time() - t0, 2)

    result["meta"]["timings"] = timings
    return result
