"""Spike xquik/x-tweet-scraper — pay-per-result actor ($0.15/1K) that works on free plan credit."""

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from apify_client import ApifyClient
from config import APIFY_API_TOKEN

client = ApifyClient(APIFY_API_TOKEN)

# Try a few reasonable input shapes. The actor's docs are opaque from its slug alone.
run_input = {
    "searchTerms": ["AI testing tools", "Playwright alternative"],
    "maxItems": 15,
    "sort": "Top",
    "tweetLanguage": "en",
}

print("Calling actor xquik/x-tweet-scraper with search terms…")
t0 = time.time()
try:
    run = client.actor("xquik/x-tweet-scraper").call(run_input=run_input)
    elapsed = time.time() - t0
    print(f"Finished in {elapsed:.1f}s. Status: {run.get('status')}")
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
    real = [i for i in items if not i.get("noResults") and (i.get("text") or i.get("full_text") or i.get("content"))]
    print(f"Total items: {len(items)}  Real tweets: {len(real)}")
    if real:
        print("\n=== Keys ===")
        print(list(real[0].keys()))
        print("\n=== First 3 ===")
        for t in real[:3]:
            author = (
                (t.get("author") or {}).get("userName")
                or t.get("authorUsername")
                or t.get("username")
                or "?"
            )
            text = (t.get("text") or t.get("full_text") or t.get("content") or "")[:160].replace("\n", " ")
            likes = t.get("likeCount") or t.get("favorite_count") or 0
            print(f"  @{author}: {text}  ({likes}♥)")
    else:
        print("Sample item (to debug input shape):")
        if items:
            print(json.dumps({k: (str(v)[:160] if isinstance(v, str) else v) for k, v in list(items[0].items())[:15]}, indent=2, default=str))
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
