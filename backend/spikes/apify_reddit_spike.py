"""Apify Reddit actor spike — verify actor input schema and search capability.

Runs the actor the user provided (FgJtjDwJCLhRH9saM) with a search-style input.
If it returns reddit posts, Signal Scout agent can use it.
If not, we'll swap to trudax/reddit-scraper.
"""

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from apify_client import ApifyClient
from config import APIFY_API_TOKEN, APIFY_REDDIT_ACTOR_ID

ACTOR_ID = APIFY_REDDIT_ACTOR_ID
client = ApifyClient(APIFY_API_TOKEN)

# Try search-style input (what Signal Scout needs)
run_input = {
    "searches": ["AI testing tools"],
    "searchPosts": True,
    "searchComments": False,
    "searchCommunities": False,
    "searchUsers": False,
    "sort": "relevance",
    "includeNSFW": False,
    "maxItems": 5,
    "maxPostCount": 5,
    "maxComments": 2,
    "scrollTimeout": 40,
    "proxy": {"useApifyProxy": True, "apifyProxyGroups": ["RESIDENTIAL"]},
    "debugMode": False,
}

print(f"Starting actor {ACTOR_ID} with search input…")
t0 = time.time()
run = client.actor(ACTOR_ID).call(run_input=run_input)
elapsed = time.time() - t0
print(f"Run finished in {elapsed:.1f}s. Status: {run.get('status')}")
print(f"Dataset id: {run['defaultDatasetId']}")

items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
print(f"\nGot {len(items)} items.\n")

if items:
    print("=== First item keys ===")
    print(list(items[0].keys()))
    print("\n=== First item (truncated) ===")
    sample = {k: (str(v)[:200] if not isinstance(v, (int, float, bool)) else v) for k, v in items[0].items()}
    print(json.dumps(sample, indent=2, default=str))
else:
    print("NO ITEMS returned. Input schema likely wrong — try different param names.")
