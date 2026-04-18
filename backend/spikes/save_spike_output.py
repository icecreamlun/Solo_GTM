"""Re-run a short Apify query with Axolotl-relevant keywords and persist output as fallback seed."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from apify_client import ApifyClient
from config import APIFY_API_TOKEN, APIFY_REDDIT_ACTOR_ID

ACTOR_ID = APIFY_REDDIT_ACTOR_ID
client = ApifyClient(APIFY_API_TOKEN)

run_input = {
    "searches": ["AI test automation", "Playwright alternative", "QA developer tools"],
    "searchPosts": True,
    "searchComments": False,
    "searchCommunities": False,
    "searchUsers": False,
    "sort": "relevance",
    "includeNSFW": False,
    "maxItems": 15,
    "maxPostCount": 15,
    "maxComments": 0,
    "scrollTimeout": 40,
    "proxy": {"useApifyProxy": True, "apifyProxyGroups": ["RESIDENTIAL"]},
    "debugMode": False,
}

print("Running Apify with Axolotl-relevant keywords (expect ~30-60s)…")
run = client.actor(ACTOR_ID).call(run_input=run_input)
items = list(client.dataset(run["defaultDatasetId"]).iterate_items())

out = Path(__file__).parent / "axolotl_reddit_seed.json"
out.write_text(json.dumps(items, indent=2, default=str))
print(f"Saved {len(items)} items to {out}")
for it in items[:5]:
    print(f"  [{it.get('communityName')}] {it.get('title')[:80]} ({it.get('upVotes')}↑ {it.get('numberOfComments')}c)")
