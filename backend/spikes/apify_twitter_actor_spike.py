"""Call the underlying Twitter actor (61RPP7dywgiy0JPD0) with Axolotl-relevant searches."""

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from apify_client import ApifyClient
from config import APIFY_API_TOKEN

ACTOR_ID = "61RPP7dywgiy0JPD0"
client = ApifyClient(APIFY_API_TOKEN)

run_input = {
    "searchTerms": ["AI testing", "Playwright", "automated QA"],
    "maxItems": 20,
    "sort": "Top",
    "tweetLanguage": "en",
}

print(f"Calling actor {ACTOR_ID} with search terms…")
t0 = time.time()
run = client.actor(ACTOR_ID).call(run_input=run_input)
elapsed = time.time() - t0
print(f"Finished in {elapsed:.1f}s. Status: {run.get('status')}")

items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
print(f"Got {len(items)} items.\n")

real = [i for i in items if not i.get("noResults")]
print(f"Real tweets: {len(real)}")

if real:
    print("\n=== Keys ===")
    print(list(real[0].keys()))
    print("\n=== First 3 tweets ===")
    for t in real[:3]:
        author = (t.get("author") or {}).get("userName") or t.get("authorUsername") or "?"
        text = (t.get("text") or t.get("full_text") or "")[:150].replace("\n", " ")
        likes = t.get("likeCount") or t.get("favorite_count") or 0
        replies = t.get("replyCount") or 0
        retweets = t.get("retweetCount") or 0
        print(f"  @{author}: {text}  ({likes}♥ {replies}↩ {retweets}🔁)")

    out_path = "/Users/lizhuolun/cursor/Solo_GTM/backend/spikes/axolotl_twitter_seed.json"
    with open(out_path, "w") as f:
        json.dump(real, f, indent=2, default=str)
    print(f"\nSaved to {out_path}")
else:
    print("NO real tweets returned. Actor may be rate-limited or gated.")
