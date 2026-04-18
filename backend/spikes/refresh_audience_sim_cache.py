"""Swap only the audience_sim section of fallback_data.json with a fresh Minds AI run."""

import asyncio
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents import audience_sim


async def main():
    fb_path = Path(__file__).parent.parent / "fallback_data.json"
    fallback = json.loads(fb_path.read_text())

    print("Running Minds AI audience_sim on cached content_engine…")
    t0 = time.time()
    new_aud = await audience_sim.run(fallback["content_engine"])
    elapsed = time.time() - t0
    print(f"  done in {elapsed:.1f}s")

    fallback["audience_sim"] = new_aud
    fallback["meta"]["timings"]["audience_sim"] = round(elapsed, 2)
    fb_path.write_text(json.dumps(fallback, indent=2, ensure_ascii=False))
    print(f"\n✅ Overwrote {fb_path}")
    print(f"   Personas: {[p['name'] for p in new_aud['personas']]}")
    print(f"   Engagement: {new_aud['synthesis'].get('predicted_engagement')}")
    print(f"   Source: {new_aud['_meta']['source']}")


asyncio.run(main())
