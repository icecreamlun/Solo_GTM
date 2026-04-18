"""Per-repo signal monitoring.

Stores a timestamped log of Signal Scout runs per tracked repo. A background
scheduler re-runs Signal Scout every `MONITOR_INTERVAL_HOURS` hours for every
tracked repo, appending to its snapshot file.

File layout: backend/monitor/<slug>.json
  {
    "repo_slug": "Axolotl-QA-Axolotl",
    "github_url": "...",
    "interpreter": {...},          # frozen first-seen interpreter snapshot
    "snapshots": [
      {"timestamp": "...", "signal_scout": {...}},
      ...
    ]
  }
"""

import asyncio
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from . import signal_scout


MONITOR_DIR = Path(__file__).parent.parent / "monitor"
MONITOR_DIR.mkdir(exist_ok=True)

MONITOR_INTERVAL_HOURS = 6
_GITHUB_URL_RE = re.compile(r"github\.com[/:]([\w.-]+)/([\w.-]+?)(?:\.git|/|$)")


def slug_from_url(url: str) -> Optional[str]:
    m = _GITHUB_URL_RE.search(url)
    return f"{m.group(1)}-{m.group(2)}" if m else None


def _path_for(slug: str) -> Path:
    return MONITOR_DIR / f"{slug}.json"


def read(slug: str) -> Optional[dict]:
    p = _path_for(slug)
    if not p.exists():
        return None
    return json.loads(p.read_text())


def write(slug: str, record: dict) -> None:
    _path_for(slug).write_text(json.dumps(record, indent=2, ensure_ascii=False))


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _compact_signal(signal: dict) -> dict:
    """Strip fields we don't need to keep per snapshot to save space."""
    return {
        "trending_topics": signal.get("trending_topics", []),
        "community_pain_points": signal.get("community_pain_points", []),
        "recommended_narrative": signal.get("recommended_narrative", ""),
        "competitive_angle": signal.get("competitive_angle", ""),
        "timing_insight": signal.get("timing_insight", ""),
        "signal_confidence": signal.get("signal_confidence", ""),
        "key_data_points": signal.get("key_data_points", [])[:5],
        "_meta": signal.get("_meta", {}),
    }


async def record_snapshot(slug: str, interpreter_output: dict, github_url: str) -> dict:
    """Run signal_scout for this interpreter and append a snapshot."""
    signal = await signal_scout.run(interpreter_output)

    existing = read(slug) or {
        "repo_slug": slug,
        "github_url": github_url,
        "interpreter": interpreter_output,
        "snapshots": [],
    }
    existing["snapshots"].append(
        {
            "timestamp": _now_iso(),
            "signal_scout": _compact_signal(signal),
        }
    )
    # Keep at most 30 snapshots (roughly a week at 6h intervals).
    existing["snapshots"] = existing["snapshots"][-30:]
    write(slug, existing)
    return existing


def list_tracked() -> list[str]:
    return sorted(p.stem for p in MONITOR_DIR.glob("*.json"))


def seconds_until_next(record: dict, interval_hours: int = MONITOR_INTERVAL_HOURS) -> int:
    """How many seconds until the next scheduled scrape for this repo."""
    snaps = record.get("snapshots") or []
    if not snaps:
        return 0
    last = datetime.fromisoformat(snaps[-1]["timestamp"])
    if last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)
    next_time = last.timestamp() + interval_hours * 3600
    return max(0, int(next_time - datetime.now(timezone.utc).timestamp()))


# ---- background scheduler -----------------------------------------------

_scheduler_task: Optional[asyncio.Task] = None


async def _scheduler_loop(interval_hours: int = MONITOR_INTERVAL_HOURS) -> None:
    """Every `interval_hours`, re-run signal_scout for each tracked repo."""
    while True:
        try:
            for slug in list_tracked():
                record = read(slug)
                if not record:
                    continue
                wait = seconds_until_next(record, interval_hours)
                if wait > 0:
                    continue
                try:
                    await record_snapshot(slug, record["interpreter"], record["github_url"])
                    print(f"[monitor] refreshed {slug}")
                except Exception as e:
                    print(f"[monitor] refresh failed for {slug}: {e}")
        except Exception as e:
            print(f"[monitor] scheduler tick failed: {e}")
        # Check every 5 minutes; per-repo wait is enforced by seconds_until_next.
        await asyncio.sleep(5 * 60)


def start_scheduler() -> None:
    global _scheduler_task
    if _scheduler_task is None or _scheduler_task.done():
        _scheduler_task = asyncio.create_task(_scheduler_loop())
