"""Seed Axolotl-relevant Twitter data for demo fallback."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from apify_client import ApifyClient
from config import APIFY_API_TOKEN, APIFY_TWITTER_ACTOR_ID, CACHED_TWITTER_PATH

client = ApifyClient(APIFY_API_TOKEN)

run = client.actor(APIFY_TWITTER_ACTOR_ID).call(run_input={
    "searchTerms": ["AI test automation", "Playwright alternative", "browser testing AI"],
    "maxItems": 30,
    "sort": "Top",
    "tweetLanguage": "en",
})
items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
real = [i for i in items if not i.get("noResults") and (i.get("text") or i.get("full_text"))]

CACHED_TWITTER_PATH.write_text(json.dumps(real, indent=2, default=str))
print(f"Saved {len(real)} tweets to {CACHED_TWITTER_PATH}")
for t in real[:5]:
    author = (t.get("author") or {})
    handle = author.get("username") or "?"
    text = (t.get("text") or "")[:100].replace("\n", " ")
    print(f"  @{handle}: {text} ({t.get('likeCount', 0)}♥)")
