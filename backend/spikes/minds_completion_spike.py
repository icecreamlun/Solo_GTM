"""Test a direct /completion against Sarah + check spark detail structure."""

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import httpx

from config import MINDS_API_KEY, MINDS_BASE_URL

BASE = MINDS_BASE_URL
HEADERS = {"Authorization": f"Bearer {MINDS_API_KEY}", "Content-Type": "application/json"}

config = json.loads(Path(__file__).parent.parent.joinpath("minds_config.json").read_text())
SARAH = config["sparks"]["sarah"]

with httpx.Client(timeout=60.0, follow_redirects=True) as c:
    print(f"GET /sparks/{SARAH}")
    r = c.get(f"{BASE}/sparks/{SARAH}", headers=HEADERS)
    print(f"  status={r.status_code}")
    body = r.json()
    data = body.get("data", {})
    print(f"  name={data.get('name')}")
    print(f"  status={data.get('status')}")
    print(f"  all top-level keys={list(data.keys())}")
    print(f"  systemPrompt length={len(data.get('systemPrompt') or '')}")

    print("\nPOST /sparks/<sarah>/completion")
    t0 = time.time()
    r = c.post(
        f"{BASE}/sparks/{SARAH}/completion",
        headers=HEADERS,
        json={
            "messages": [
                {
                    "role": "user",
                    "content": (
                        "You're scrolling r/SideProject and see this post. Write a 2-4 sentence "
                        "reply AS YOURSELF, in character:\n\n"
                        "Title: Built an AI VS Code extension that auto-generates browser tests for PRs (with visual proof)\n\n"
                        "Body: I've been working on Axolotl – a VS Code extension that automatically "
                        "generates and runs real browser tests when you push code changes. It analyzes "
                        "what changed in your PR, generates browser tests for those specific changes, "
                        "runs them in real browsers, and gives you GIFs showing the tests actually passing."
                    ),
                }
            ]
        },
    )
    elapsed = time.time() - t0
    print(f"  status={r.status_code} elapsed={elapsed:.1f}s")
    print(f"  body (first 2000 chars):\n{r.text[:2000]}")
