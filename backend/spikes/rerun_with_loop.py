"""Regenerate fallback_data.json with the new Interpreter + self-correction loop.

Reuses cached signal_scout (Apify is the 130s bottleneck — no reason to re-run).
Re-runs Interpreter (new: 10 commits, 5K README). Runs full loop for
content_engine + audience_sim up to 3 iterations.
"""

import asyncio
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents import interpreter, content_engine, audience_sim
from main import _should_stop, _ENGAGEMENT_RANK, MAX_ITERATIONS


async def main():
    fb_path = Path(__file__).parent.parent / "fallback_data.json"
    fallback = json.loads(fb_path.read_text())
    cached_signals = fallback["signal_scout"]

    out = {"meta": fallback["meta"]}

    print("\n[1] Interpreter (10 commits, 5K README)…")
    t = time.time()
    out["interpreter"] = await interpreter.run(
        "https://github.com/Axolotl-QA/Axolotl", "github_url"
    )
    interp_time = time.time() - t
    print(f"  {interp_time:.1f}s — Launch Score {out['interpreter']['launch_score']['overall']}")

    out["signal_scout"] = cached_signals
    print(f"\n[2] Signal Scout — reused cache ({cached_signals['_meta']})")

    print("\n[3+4] Self-correction loop (max 3 iterations)…")
    iterations = []
    content_total = 0.0
    audience_total = 0.0
    prev_content = None
    prev_audience = None
    prev_rank = -1
    stop_reason = "hit max iterations"

    for i in range(1, MAX_ITERATIONS + 1):
        print(f"\n  --- iteration {i} ---")
        t = time.time()
        content = await content_engine.run(
            out["interpreter"], out["signal_scout"],
            previous_attempt=prev_content, audience_feedback=prev_audience, iteration=i,
        )
        dt = time.time() - t
        content_total += dt
        print(f"  content_engine: {dt:.1f}s — '{content['reddit_post']['title'][:70]}'")

        t = time.time()
        audience = await audience_sim.run(content)
        dt = time.time() - t
        audience_total += dt
        engagement = (audience.get("synthesis") or {}).get("predicted_engagement", "")
        upvotes = sum(1 for p in audience.get("personas", []) if p.get("would_upvote"))
        print(f"  audience_sim:   {dt:.1f}s — engagement={engagement}, upvotes={upvotes}/3")

        rank = _ENGAGEMENT_RANK.get(engagement.lower(), -1)
        iterations.append({
            "iteration": i,
            "engagement": engagement.lower(),
            "upvote_count": upvotes,
            "content_engine": content,
            "audience_sim": audience,
        })

        stop, reason = _should_stop(audience, prev_rank)
        if stop:
            stop_reason = reason
            print(f"  ▶ STOP: {reason}")
            break
        print(f"  → continue (previous_rank={prev_rank}, current_rank={rank})")
        prev_content = content
        prev_audience = audience
        prev_rank = rank

    out["content_engine"] = iterations[-1]["content_engine"]
    out["audience_sim"] = iterations[-1]["audience_sim"]
    out["iterations"] = [
        {
            "iteration": it["iteration"],
            "engagement": it["engagement"],
            "upvote_count": it["upvote_count"],
            "reddit_title": (it["content_engine"].get("reddit_post") or {}).get("title"),
        }
        for it in iterations
    ]
    out["meta"]["iteration_count"] = len(iterations)
    out["meta"]["stop_reason"] = stop_reason
    out["meta"]["timings"] = {
        "interpreter": round(interp_time, 2),
        "signal_scout": fallback["meta"]["timings"].get("signal_scout", 0),
        "content_engine": round(content_total, 2),
        "audience_sim": round(audience_total, 2),
    }

    fb_path.write_text(json.dumps(out, indent=2, ensure_ascii=False))
    print(f"\n✅ Saved {fb_path}")
    print(f"   iterations={len(iterations)}, stop_reason={stop_reason}")
    print(f"   evolution: {' → '.join(it['engagement'] for it in iterations)}")


asyncio.run(main())
