"""Learn the Twitter item shape so we can summarize correctly."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from apify_client import ApifyClient
from config import APIFY_API_TOKEN

client = ApifyClient(APIFY_API_TOKEN)
run = client.actor("xquik/x-tweet-scraper").call(
    run_input={"searchTerms": ["AI testing"], "maxItems": 3, "sort": "Top"}
)
items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
if items:
    it = items[0]
    print("author:", json.dumps(it.get("author"), indent=2, default=str)[:500])
    print()
    print("summary line test:")
    author = it.get("author") or {}
    print(
        f"  @{author.get('userName') or author.get('screen_name') or '?'}: "
        f"{(it.get('text') or '')[:120]} "
        f"({it.get('likeCount', 0)}♥ {it.get('retweetCount', 0)}🔁 {it.get('replyCount', 0)}↩)"
    )
