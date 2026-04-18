"""LaunchLayer FastAPI entrypoint.

POST /api/launch — runs the full pipeline with a bounded self-correction loop:
  interpreter → signal_scout → (content → audience → stop?)×N  (N ≤ 3)
GET  /api/health — liveness probe.
GET  /api/fallback — return cached pipeline output for stage demos.
"""

import json
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents import interpreter, signal_scout, content_engine, audience_sim, monitor
from agents._llm import update_outcome as kalibr_update_outcome


app = FastAPI(title="Repocket")


@app.on_event("startup")
async def _boot_monitor_scheduler():
    monitor.start_scheduler()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FALLBACK_PATH = Path(__file__).parent / "fallback_data.json"
MAX_ITERATIONS = 3

_ENGAGEMENT_RANK = {"low": 0, "medium": 1, "high": 2}


def _score(audience: dict) -> int:
    """Composite score: engagement weighted higher than single-persona wins."""
    synthesis = audience.get("synthesis", {}) or {}
    engagement = synthesis.get("predicted_engagement", "").lower()
    rank = _ENGAGEMENT_RANK.get(engagement, -1)
    upvotes = sum(
        1 for p in audience.get("personas", []) if p.get("would_upvote")
    )
    # rank 0-2 × 3 → 0/3/6, plus 0-3 upvotes → max 9.
    return max(rank, 0) * 3 + upvotes


class LaunchRequest(BaseModel):
    input_text: str
    input_type: str = "github_url"
    use_fallback: bool = False
    max_iterations: int = MAX_ITERATIONS


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/fallback")
async def fallback():
    if not FALLBACK_PATH.exists():
        raise HTTPException(404, "no fallback data yet — run the pipeline once to seed it")
    return json.loads(FALLBACK_PATH.read_text())


@app.get("/api/monitor/{slug}")
async def monitor_get(slug: str):
    record = monitor.read(slug)
    if not record:
        raise HTTPException(404, f"no monitoring data for {slug}")
    return {
        **record,
        "next_scrape_in_seconds": monitor.seconds_until_next(record),
        "interval_hours": monitor.MONITOR_INTERVAL_HOURS,
    }


@app.post("/api/monitor/refresh/{slug}")
async def monitor_refresh(slug: str):
    record = monitor.read(slug)
    if not record:
        raise HTTPException(404, f"{slug} is not tracked yet")
    updated = await monitor.record_snapshot(
        slug, record["interpreter"], record["github_url"]
    )
    return {"ok": True, "snapshots": len(updated["snapshots"])}


def _should_stop(audience: dict, prev_score: int) -> tuple[bool, str]:
    """Return (stop?, reason).

    Stop when:
    - predicted engagement reaches 'high' (best we can claim)
    - all 3 personas would upvote (saturation)
    - composite score didn't improve vs last iteration (drift guard)
    """
    synthesis = audience.get("synthesis", {}) or {}
    engagement = synthesis.get("predicted_engagement", "").lower()

    if engagement == "high":
        return True, "engagement reached high"

    personas = audience.get("personas", []) or []
    if personas and all(p.get("would_upvote") for p in personas):
        return True, "all personas would upvote"

    score = _score(audience)
    if prev_score >= 0 and score <= prev_score:
        return True, f"no improvement over prev (score {prev_score}→{score}) — avoiding drift"

    return False, ""


@app.post("/api/launch")
async def launch(req: LaunchRequest):
    if req.use_fallback and FALLBACK_PATH.exists():
        return json.loads(FALLBACK_PATH.read_text())

    timings: dict = {}
    result: dict = {"meta": {"input": req.input_text, "input_type": req.input_type}}

    t0 = time.time()
    result["interpreter"] = await interpreter.run(req.input_text, req.input_type)
    timings["interpreter"] = round(time.time() - t0, 2)

    t0 = time.time()
    result["signal_scout"] = await signal_scout.run(result["interpreter"])
    timings["signal_scout"] = round(time.time() - t0, 2)

    iterations: list = []
    content_time_total = 0.0
    audience_time_total = 0.0
    prev_content: dict | None = None
    prev_audience: dict | None = None
    prev_score = -1
    stop_reason = "hit max iterations"

    for i in range(1, max(1, min(req.max_iterations, MAX_ITERATIONS)) + 1):
        t0 = time.time()
        content = await content_engine.run(
            result["interpreter"],
            result["signal_scout"],
            previous_attempt=prev_content,
            audience_feedback=prev_audience,
            iteration=i,
        )
        content_time_total += time.time() - t0

        t0 = time.time()
        audience = await audience_sim.run(content)
        audience_time_total += time.time() - t0

        engagement = (audience.get("synthesis") or {}).get("predicted_engagement", "").lower()
        iterations.append({
            "iteration": i,
            "engagement": engagement,
            "upvote_count": sum(1 for p in audience.get("personas", []) if p.get("would_upvote")),
            "content_engine": content,
            "audience_sim": audience,
        })

        stop, reason = _should_stop(audience, prev_score)
        if stop:
            stop_reason = reason
            break

        prev_content = content
        prev_audience = audience
        prev_score = _score(audience)

    # Final = last iteration's content + audience
    result["content_engine"] = iterations[-1]["content_engine"]
    result["audience_sim"] = iterations[-1]["audience_sim"]
    # Keep full content+audience per iteration so the UI can let users
    # click back and see exactly what changed between drafts.
    result["iterations"] = iterations

    # Feed the ground-truth audience score back to Kalibr for every
    # content_engine trace we produced. This is the outcome-aware learning
    # loop: future products get content from whichever Claude tier
    # historically produced drafts that real personas upvoted.
    final_audience = iterations[-1]["audience_sim"]
    final_score = _score(final_audience) / 9.0  # normalize 0..1
    for it in iterations:
        trace = (it["content_engine"].get("_kalibr") or {}).get("trace_id")
        if trace:
            await kalibr_update_outcome(
                trace,
                "launchlayer_generate_content",
                success=final_score >= 0.5,
                score=final_score,
            )

    timings["content_engine"] = round(content_time_total, 2)
    timings["audience_sim"] = round(audience_time_total, 2)
    result["meta"]["timings"] = timings
    result["meta"]["iteration_count"] = len(iterations)
    result["meta"]["stop_reason"] = stop_reason
    return result
