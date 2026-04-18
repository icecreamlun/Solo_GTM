"""Run JUST the content+audience loop on top of already-cached interpreter + signal_scout.

Used when we want to regenerate downstream content without re-hitting
GitHub (which may be rate-limited). Requires fallback_data.json to already
contain a correct interpreter + signal_scout.
"""

import asyncio
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents import content_engine, audience_sim
from agents._llm import update_outcome as kalibr_update_outcome
from main import _should_stop, _score, MAX_ITERATIONS


async def main():
    fb_path = Path(__file__).parent.parent / "fallback_data.json"
    fallback = json.loads(fb_path.read_text())

    interp = fallback["interpreter"]
    signals = fallback["signal_scout"]
    print(f"Interpreter (cached): {interp['product_name']} — {interp['what_it_does'][:80]}")
    print(f"Signals (cached): {signals['_meta']}")

    print("\nSelf-correction loop (max 3 iterations)…")
    iterations = []
    content_total = 0.0
    audience_total = 0.0
    prev_content = None
    prev_audience = None
    prev_score = -1
    stop_reason = "hit max iterations"

    for i in range(1, MAX_ITERATIONS + 1):
        print(f"\n  --- iteration {i} ---")
        t = time.time()
        content = await content_engine.run(
            interp, signals,
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

        iterations.append({
            "iteration": i,
            "engagement": engagement.lower(),
            "upvote_count": upvotes,
            "content_engine": content,
            "audience_sim": audience,
        })

        stop, reason = _should_stop(audience, prev_score)
        if stop:
            stop_reason = reason
            print(f"  ▶ STOP: {reason}")
            break
        prev_content = content
        prev_audience = audience
        prev_score = _score(audience)

    fallback["content_engine"] = iterations[-1]["content_engine"]
    fallback["audience_sim"] = iterations[-1]["audience_sim"]
    fallback["iterations"] = iterations

    # Feed ground-truth engagement back to Kalibr for content_engine traces.
    final_score = _score(iterations[-1]["audience_sim"]) / 9.0
    for it in iterations:
        trace = (it["content_engine"].get("_kalibr") or {}).get("trace_id")
        if trace:
            await kalibr_update_outcome(
                trace, "launchlayer_generate_content",
                success=final_score >= 0.5, score=final_score,
            )
    print(f"   reported final_score={final_score:.2f} to Kalibr for {len(iterations)} content traces")
    fallback["meta"]["iteration_count"] = len(iterations)
    fallback["meta"]["stop_reason"] = stop_reason
    fallback["meta"]["timings"]["content_engine"] = round(content_total, 2)
    fallback["meta"]["timings"]["audience_sim"] = round(audience_total, 2)

    fb_path.write_text(json.dumps(fallback, indent=2, ensure_ascii=False))
    print(f"\n✅ Saved {fb_path}")
    print(f"   iterations={len(iterations)}, stop_reason={stop_reason}")
    print(f"   evolution: {' → '.join(it['engagement'] for it in iterations)}")


asyncio.run(main())
