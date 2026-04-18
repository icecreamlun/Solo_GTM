"""Agent 2 — Signal Scout. Apify Reddit + Apify Twitter + HN Algolia + Claude analysis."""

import asyncio
import json
from typing import List

import httpx
from apify_client import ApifyClient

from config import (
    APIFY_API_TOKEN,
    APIFY_REDDIT_ACTOR_ID,
    APIFY_TWITTER_ACTOR_ID,
    USE_CACHED_APIFY,
    CACHED_REDDIT_PATH,
    CACHED_TWITTER_PATH,
)

from ._llm import claude_json


_apify = ApifyClient(APIFY_API_TOKEN)


def _call_apify_reddit_sync(keywords: List[str]) -> list:
    run_input = {
        "searches": keywords[:3],
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
    run = _apify.actor(APIFY_REDDIT_ACTOR_ID).call(run_input=run_input)
    return list(_apify.dataset(run["defaultDatasetId"]).iterate_items())


def _call_apify_twitter_sync(keywords: List[str]) -> list:
    run_input = {
        "searchTerms": keywords[:2],
        "maxItems": 20,
        "sort": "Top",
        "tweetLanguage": "en",
    }
    run = _apify.actor(APIFY_TWITTER_ACTOR_ID).call(run_input=run_input)
    items = list(_apify.dataset(run["defaultDatasetId"]).iterate_items())
    # Drop Apify's sandbox {"noResults": true} placeholders if they ever sneak in
    return [i for i in items if not i.get("noResults") and (i.get("text") or i.get("full_text"))]


async def _load_reddit(keywords: List[str]) -> list:
    if USE_CACHED_APIFY and CACHED_REDDIT_PATH.exists():
        return json.loads(CACHED_REDDIT_PATH.read_text())
    try:
        return await asyncio.to_thread(_call_apify_reddit_sync, keywords)
    except Exception as e:
        print(f"[signal_scout] Apify Reddit failed ({e}); falling back to cached seed")
        if CACHED_REDDIT_PATH.exists():
            return json.loads(CACHED_REDDIT_PATH.read_text())
        return []


async def _load_twitter(keywords: List[str]) -> list:
    if USE_CACHED_APIFY and CACHED_TWITTER_PATH.exists():
        return json.loads(CACHED_TWITTER_PATH.read_text())
    try:
        return await asyncio.to_thread(_call_apify_twitter_sync, keywords)
    except Exception as e:
        print(f"[signal_scout] Apify Twitter failed ({e}); falling back to cached seed")
        if CACHED_TWITTER_PATH.exists():
            return json.loads(CACHED_TWITTER_PATH.read_text())
        return []


async def _fetch_hn(keywords: List[str]) -> list:
    async with httpx.AsyncClient(timeout=10.0) as client:
        tasks = [
            client.get(
                "https://hn.algolia.com/api/v1/search",
                params={"query": kw, "tags": "story", "hitsPerPage": 10},
            )
            for kw in keywords[:2]
        ]
        try:
            responses = await asyncio.gather(*tasks, return_exceptions=True)
        except Exception:
            return []
    out = []
    for r in responses:
        if isinstance(r, Exception):
            continue
        try:
            out.extend(r.json().get("hits", []))
        except Exception:
            continue
    return out


def _summarize_reddit(items: list) -> str:
    lines = []
    for it in items[:30]:
        sub = it.get("communityName", "r/?")
        title = (it.get("title") or "").replace("\n", " ")[:120]
        up = it.get("upVotes", 0)
        comments = it.get("numberOfComments", 0)
        lines.append(f"[{sub}] {title} ({up}↑ {comments}c)")
    return "\n".join(lines) if lines else "(no Reddit results)"


def _summarize_twitter(items: list) -> str:
    lines = []
    for it in items[:25]:
        author = (it.get("author") or {})
        handle = author.get("username") or author.get("screen_name") or "?"
        followers = author.get("followers") or 0
        text = (it.get("text") or it.get("full_text") or "").replace("\n", " ")[:160]
        likes = it.get("likeCount") or 0
        retweets = it.get("retweetCount") or 0
        lines.append(f"@{handle} ({followers}f): {text} ({likes}♥ {retweets}🔁)")
    return "\n".join(lines) if lines else "(no Twitter results)"


def _summarize_hn(items: list) -> str:
    lines = []
    for it in items[:20]:
        title = (it.get("title") or "").replace("\n", " ")[:120]
        points = it.get("points", 0)
        num_comments = it.get("num_comments", 0)
        lines.append(f"{title} ({points}pts, {num_comments}c)")
    return "\n".join(lines) if lines else "(no HN results)"


PROMPT = """You are a GTM strategist for developer tools.

Based on REAL community data scraped from Reddit (via Apify), Twitter/X (via Apify), and Hacker News, analyze market signals.

Product info:
- product_name: {product_name}
- what_it_does: {what_it_does}
- update_summary: {update_summary}
- target_audiences: {target_audiences}
- key_angles: {key_angles}

Reddit data (scraped via Apify, {n_reddit} posts analyzed):
{reddit_summary}

Twitter/X data (scraped via Apify, {n_twitter} tweets analyzed):
{twitter_summary}

Hacker News data ({n_hn} stories analyzed):
{hn_summary}

Output ONLY JSON:
{{
  "trending_topics": ["topic1", "topic2", "topic3"],
  "community_pain_points": ["pain1", "pain2"],
  "recommended_narrative": "best angle based on real market data",
  "recommended_channels": [
    {{"channel": "r/SubredditName", "reason": "why", "fit_score": "high|medium|low"}},
    {{"channel": "Hacker News", "reason": "why", "fit_score": "high|medium|low"}},
    {{"channel": "Twitter/X", "reason": "who to engage, what hashtags/angle lands", "fit_score": "high|medium|low"}}
  ],
  "competitive_angle": "how to differentiate",
  "timing_insight": "why now is good or bad",
  "signal_confidence": "high|medium|low",
  "data_sources_count": {total_sources},
  "key_data_points": [
    {{"source": "r/programming | twitter | HN", "insight": "what we learned", "relevance": "high|medium"}}
  ]
}}"""


async def run(interpreter_output: dict) -> dict:
    keywords = interpreter_output.get("search_keywords", [])[:3]
    if not keywords:
        keywords = [interpreter_output.get("product_name", "developer tools")]

    # Fire all three data sources in parallel — Twitter is ~13s, Reddit ~130s, HN ~2s
    reddit_items, twitter_items, hn_items = await asyncio.gather(
        _load_reddit(keywords),
        _load_twitter(keywords),
        _fetch_hn(keywords),
    )

    prompt = PROMPT.format(
        product_name=interpreter_output.get("product_name", ""),
        what_it_does=interpreter_output.get("what_it_does", ""),
        update_summary=interpreter_output.get("update_summary", ""),
        target_audiences=interpreter_output.get("target_audiences", []),
        key_angles=interpreter_output.get("key_angles", []),
        n_reddit=len(reddit_items),
        reddit_summary=_summarize_reddit(reddit_items),
        n_twitter=len(twitter_items),
        twitter_summary=_summarize_twitter(twitter_items),
        n_hn=len(hn_items),
        hn_summary=_summarize_hn(hn_items),
        total_sources=len(reddit_items) + len(twitter_items) + len(hn_items),
    )
    result = await claude_json(prompt)
    result["_meta"] = {
        "reddit_count": len(reddit_items),
        "twitter_count": len(twitter_items),
        "hn_count": len(hn_items),
        "used_cached_apify": USE_CACHED_APIFY,
    }
    return result
