"""Refresh interpreter + signal_scout in fallback so they carry Kalibr traces.

Leaves iterations, content_engine, audience_sim as-is. Uses cached Apify data.
"""

import asyncio
import json
import os
import sys
from pathlib import Path

os.environ["USE_CACHED_APIFY"] = "true"

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents import interpreter, signal_scout


async def main():
    fb_path = Path(__file__).parent.parent / "fallback_data.json"
    fallback = json.loads(fb_path.read_text())

    print("Re-running interpreter…")
    fallback["interpreter"] = await interpreter.run(
        "https://github.com/Axolotl-QA/Axolotl", "github_url"
    )
    k = fallback["interpreter"].get("_kalibr", {})
    print(f"  trace {str(k.get('trace_id',''))[:12]} model {k.get('model')}")

    print("Re-running signal_scout (cached Apify)…")
    fallback["signal_scout"] = await signal_scout.run(fallback["interpreter"])
    k = fallback["signal_scout"].get("_kalibr", {})
    print(f"  trace {str(k.get('trace_id',''))[:12]} model {k.get('model')}")
    print(f"  sources: {fallback['signal_scout']['_meta']}")

    fb_path.write_text(json.dumps(fallback, indent=2, ensure_ascii=False))
    print(f"\n✅ Saved {fb_path}")


asyncio.run(main())
