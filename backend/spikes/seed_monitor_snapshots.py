"""Seed a monitor record for Axolotl with 3 historical snapshots (3d, 1d, now).

Reuses cached Apify data so 3 snapshots take ~25s total instead of ~7 min.
Each signal_scout call's Claude analysis varies due to LLM stochasticity,
producing 3 genuinely different snapshots.
"""

import asyncio
import json
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Force cached Apify mode BEFORE importing config/agents.
os.environ["USE_CACHED_APIFY"] = "true"

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents import signal_scout, monitor  # noqa: E402


AXOLOTL_URL = "https://github.com/Axolotl-QA/Axolotl"
SLUG = "Axolotl-QA-Axolotl"
OFFSETS = [timedelta(days=3), timedelta(days=1), timedelta(hours=3)]


async def main():
    fb = json.loads((Path(__file__).parent.parent / "fallback_data.json").read_text())
    interp = fb["interpreter"]

    snapshots = []
    for i, offset in enumerate(OFFSETS):
        print(f"[{i+1}/{len(OFFSETS)}] Generating snapshot ({offset} ago)…")
        signal = await signal_scout.run(interp)
        ts = (datetime.now(timezone.utc) - offset).isoformat()
        snapshots.append(
            {
                "timestamp": ts,
                "signal_scout": monitor._compact_signal(signal),
            }
        )
        topics = signal.get("trending_topics", [])
        print(f"    ts={ts}  top: {topics[0] if topics else '(n/a)'}")

    record = {
        "repo_slug": SLUG,
        "github_url": AXOLOTL_URL,
        "interpreter": interp,
        "snapshots": snapshots,
    }
    monitor.write(SLUG, record)
    print(f"\n✅ Seeded {len(snapshots)} snapshots into {monitor._path_for(SLUG)}")


asyncio.run(main())
