"""Run the full 4-agent pipeline with Axolotl and save as fallback_data.json."""

import asyncio
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents import interpreter, signal_scout, content_engine, audience_sim


async def main():
    out = {"meta": {"input": "https://github.com/Axolotl-QA/Axolotl", "input_type": "github_url"}}
    timings = {}

    print("\n[1/4] Interpreter…")
    t = time.time()
    out["interpreter"] = await interpreter.run(out["meta"]["input"], "github_url")
    timings["interpreter"] = round(time.time() - t, 2)
    print(f"  done in {timings['interpreter']}s — Launch Score {out['interpreter']['launch_score']['overall']}")

    print("\n[2/4] Signal Scout (Apify + HN — expect ~30-60s)…")
    t = time.time()
    out["signal_scout"] = await signal_scout.run(out["interpreter"])
    timings["signal_scout"] = round(time.time() - t, 2)
    print(f"  done in {timings['signal_scout']}s — sources: {out['signal_scout'].get('_meta')}")

    print("\n[3/4] Content Engine…")
    t = time.time()
    out["content_engine"] = await content_engine.run(out["interpreter"], out["signal_scout"])
    timings["content_engine"] = round(time.time() - t, 2)
    print(f"  done in {timings['content_engine']}s — quality: {out['content_engine'].get('guardrails', {}).get('quality_score')}")

    print("\n[4/4] Audience Sim…")
    t = time.time()
    out["audience_sim"] = await audience_sim.run(out["content_engine"])
    timings["audience_sim"] = round(time.time() - t, 2)
    print(f"  done in {timings['audience_sim']}s — engagement: {out['audience_sim'].get('synthesis', {}).get('predicted_engagement')}")

    out["meta"]["timings"] = timings

    fallback_path = Path(__file__).parent.parent / "fallback_data.json"
    fallback_path.write_text(json.dumps(out, indent=2, default=str))
    print(f"\n✅ Saved full pipeline output to {fallback_path}")
    print(f"   Total: {sum(timings.values()):.1f}s")


asyncio.run(main())
