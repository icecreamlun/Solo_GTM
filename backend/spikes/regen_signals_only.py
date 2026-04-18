"""Regenerate just the signal_scout block of fallback_data.json with Reddit + Twitter + HN."""

import asyncio
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents import signal_scout


async def main():
    fb_path = Path(__file__).parent.parent / "fallback_data.json"
    fallback = json.loads(fb_path.read_text())

    print("Regenerating signal_scout (Reddit + Twitter + HN)…")
    t0 = time.time()
    fallback["signal_scout"] = await signal_scout.run(fallback["interpreter"])
    elapsed = time.time() - t0
    fallback["meta"]["timings"]["signal_scout"] = round(elapsed, 2)

    fb_path.write_text(json.dumps(fallback, indent=2, ensure_ascii=False))
    meta = fallback["signal_scout"]["_meta"]
    print(f"\n✅ Saved in {elapsed:.1f}s")
    print(f"   sources: Reddit={meta['reddit_count']}, Twitter={meta['twitter_count']}, HN={meta['hn_count']}")
    print(f"   confidence: {fallback['signal_scout']['signal_confidence']}")


asyncio.run(main())
