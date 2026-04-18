"""Create 3 LaunchLayer personas as Minds sparks + a panel. Save IDs for runtime use."""

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import httpx

from config import MINDS_API_KEY, MINDS_BASE_URL

BASE = MINDS_BASE_URL
HEADERS = {"Authorization": f"Bearer {MINDS_API_KEY}", "Content-Type": "application/json"}

PERSONAS = [
    {
        "name": "Sarah — Senior Backend Engineer",
        "description": "A senior backend engineer at a Series B startup with 5 years experience. Allergic to hype, asks hard technical questions, values reliability and architecture over novelty.",
        "mode": "keywords",
        "type": "expert",
        "discipline": "Backend Engineering",
        "keywords": [
            "reliability",
            "flaky tests",
            "performance",
            "clean architecture",
            "production incidents",
            "technical depth",
            "skeptical of AI hype",
        ],
    },
    {
        "name": "Mike — Indie Hacker",
        "description": "Solo founder running a $5K MRR SaaS. Values time savings and practical tools. Optimistic, pragmatic, always asking 'can I use this today?'",
        "mode": "keywords",
        "type": "creative",
        "discipline": "Indie Hacking",
        "keywords": [
            "solo founder",
            "bootstrapping",
            "ship fast",
            "time savings",
            "simple tools",
            "MRR growth",
            "side projects",
        ],
    },
    {
        "name": "Alex — HN Power User",
        "description": "Reads Hacker News daily, comments on every Show HN. Skeptical first, respectful of good work. Always asks 'how is this different from X?'",
        "mode": "keywords",
        "type": "expert",
        "discipline": "Hacker News commentary",
        "keywords": [
            "open source",
            "intellectual honesty",
            "prior art",
            "skeptical",
            "how is this different",
            "Show HN",
            "technical differentiation",
        ],
    },
]


def create_spark(client, spec):
    print(f"\nPOST /sparks ({spec['name']})")
    r = client.post(f"{BASE}/sparks", headers=HEADERS, json=spec)
    print(f"  status={r.status_code}  url={r.url}")
    print(f"  headers-location={r.headers.get('location')}")
    print(f"  body={r.text[:600]}")
    r.raise_for_status()
    body = r.json()
    return body["data"]


def wait_for_spark_ready(client, spark_id, timeout=120):
    t0 = time.time()
    while time.time() - t0 < timeout:
        r = client.get(f"{BASE}/sparks/{spark_id}", headers=HEADERS)
        if r.status_code == 200:
            d = r.json().get("data", {})
            status = d.get("status") or d.get("processing", {}).get("status") or "unknown"
            if status in ("ready", "active", "completed") or d.get("systemPrompt"):
                print(f"  {spark_id[:8]}… ready ({status})")
                return d
            print(f"  {spark_id[:8]}… {status}, waiting…")
        time.sleep(3)
    print(f"  {spark_id[:8]}… TIMED OUT")
    return None


def create_panel(client, spark_ids):
    print("\nPOST /panels")
    payload = {
        "name": "LaunchLayer Audience Panel",
        "description": "3 dev personas that review Reddit/HN launch posts before publish",
        "sparkIds": spark_ids,
    }
    r = client.post(f"{BASE}/panels", headers=HEADERS, json=payload)
    print(f"  status={r.status_code}")
    body = r.json()
    print(f"  id={body.get('data', {}).get('id')}")
    return body["data"]


def main():
    with httpx.Client(timeout=30.0, follow_redirects=True) as c:
        sparks = [create_spark(c, p) for p in PERSONAS]
        spark_ids = [s["id"] for s in sparks]

        print("\nWaiting for sparks to be ready…")
        for sid in spark_ids:
            wait_for_spark_ready(c, sid)

        panel = create_panel(c, spark_ids)

        ids = {
            "sparks": {
                "sarah": spark_ids[0],
                "mike": spark_ids[1],
                "alex": spark_ids[2],
            },
            "panel_id": panel["id"],
        }
        out = Path(__file__).parent.parent / "minds_config.json"
        out.write_text(json.dumps(ids, indent=2))
        print(f"\nSaved IDs to {out}")
        print(json.dumps(ids, indent=2))


if __name__ == "__main__":
    main()
