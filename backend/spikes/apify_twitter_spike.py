"""Spike the Twitter/X Apify task the user gave us.

Task ID: Zu5XsCddE1QXAmLQY — pre-configured task (no runtime input in user's example)
Question: does it support custom input? What fields come back? How fast?
"""

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from apify_client import ApifyClient
from config import APIFY_API_TOKEN

TASK_ID = "Zu5XsCddE1QXAmLQY"
client = ApifyClient(APIFY_API_TOKEN)

print(f"Calling task {TASK_ID} with NO override (uses saved input)…")
t0 = time.time()
run = client.task(TASK_ID).call()
elapsed = time.time() - t0
print(f"Finished in {elapsed:.1f}s. Status: {run.get('status')}")

items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
print(f"Got {len(items)} items.")
if items:
    print("\n=== First item keys ===")
    print(list(items[0].keys()))
    print("\n=== First item (truncated) ===")
    sample = {}
    for k, v in items[0].items():
        if isinstance(v, (int, float, bool)) or v is None:
            sample[k] = v
        elif isinstance(v, str):
            sample[k] = v[:200]
        else:
            sample[k] = str(v)[:200]
    print(json.dumps(sample, indent=2, default=str))

# Peek at task config to learn what input it was configured with
print("\n=== Task config (what input is pre-set?) ===")
task_obj = client.task(TASK_ID).get()
if task_obj:
    print("actId:", task_obj.get("actId"))
    print("Input keys:", list(task_obj.get("input", {}).keys()) if task_obj.get("input") else "(none visible)")
    saved_input = task_obj.get("input") or {}
    print("Saved input sample:", json.dumps(saved_input, indent=2, default=str)[:800])
