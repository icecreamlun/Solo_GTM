import os
from pathlib import Path


def _load_env():
    env_path = Path(__file__).parent.parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())


_load_env()

ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
APIFY_API_TOKEN = os.environ["APIFY_API_TOKEN"]
MINDS_API_KEY = os.environ["MINDS_API_KEY"]
KALIBR_API_KEY = os.environ.get("KALIBR_API_KEY", "")
KALIBR_TENANT_ID = os.environ.get("KALIBR_TENANT_ID", "")

CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-5-20250929")
APIFY_REDDIT_ACTOR_ID = "FgJtjDwJCLhRH9saM"
APIFY_TWITTER_ACTOR_ID = "xquik/x-tweet-scraper"
MINDS_BASE_URL = "https://getminds.ai/api/v1"
MINDS_CONFIG_PATH = Path(__file__).parent / "minds_config.json"

USE_CACHED_APIFY = os.environ.get("USE_CACHED_APIFY", "false").lower() == "true"
CACHED_REDDIT_PATH = Path(__file__).parent / "spikes" / "axolotl_reddit_seed.json"
CACHED_TWITTER_PATH = Path(__file__).parent / "spikes" / "axolotl_twitter_seed.json"
