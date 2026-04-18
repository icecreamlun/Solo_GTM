"""Override task input with Axolotl search terms. If still noResults, it's a free-plan wall."""

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from apify_client import ApifyClient
from config import APIFY_API_TOKEN

TASK_ID = "Zu5XsCddE1QXAmLQY"
client = ApifyClient(APIFY_API_TOKEN)

override = {
    "searchTerms": ["AI testing", "Playwright"],
    "startUrls": [],
    "twitterHandles": [],
    "maxItems": 10,
    "sort": "Top",
    "tweetLanguage": "en",
}

print(f"Calling task {TASK_ID} with OVERRIDDEN input…")
t0 = time.time()
run = client.task(TASK_ID).call(task_input=override)
elapsed = time.time() - t0
print(f"Finished in {elapsed:.1f}s. Status: {run.get('status')}")

items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
real = [i for i in items if not i.get("noResults")]
print(f"Total items: {len(items)}, real: {len(real)}")

if real:
    print("\n=== First item keys ===")
    print(list(real[0].keys()))
    print("\n=== First 3 tweets (truncated) ===")
    for t in real[:3]:
        print(json.dumps({k: (str(v)[:120] if isinstance(v, str) else v) for k, v in list(t.items())[:12]}, indent=2, default=str))
else:
    print("Still noResults. Free-plan wall confirmed — actor 61RPP7dywgiy0JPD0 requires paid plan.")
