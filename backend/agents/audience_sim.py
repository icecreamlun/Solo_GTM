"""Agent 4 — Audience Simulator.

Each of the 3 personas lives as a real Minds AI spark. We ask all three in
parallel, then run a small Claude post-processing pass to extract structured
fields (sentiment, would_upvote, concern, suggestion) + panel synthesis.
"""

import asyncio
import json

from ._llm import claude_json
from .minds import ask_panel_parallel, load_config


PERSONA_META = {
    "sarah": {"name": "Sarah", "role": "Senior Backend Engineer", "emoji": "👩‍💻"},
    "mike": {"name": "Mike", "role": "Indie Hacker", "emoji": "🚀"},
    "alex": {"name": "Alex", "role": "HN Power User", "emoji": "🤨"},
}


USER_PROMPT_TEMPLATE = (
    "You're scrolling r/{subreddit} and this post appears in your feed. "
    "Respond AS YOURSELF — in character, 2-4 sentences, like a real Reddit comment. "
    "Don't be polite for politeness' sake. If it's vague, call it out. If you love it, say so.\n\n"
    "Title: {title}\n\n"
    "{body}"
)


STRUCTURE_PROMPT = """You are extracting structured analysis from 3 Reddit-style comments left by 3 distinct personas on a draft Reddit post.

The draft post:
Title: {title}
Body: {body}
Subreddit: {subreddit}

The 3 personas and their raw comments:

1. Sarah — Senior Backend Engineer (skeptical, technical, allergic to hype)
COMMENT: {sarah_comment}

2. Mike — Indie Hacker (practical, time-focused, "can I use this today?")
COMMENT: {mike_comment}

3. Alex — HN Power User (asks "how is this different from X?")
COMMENT: {alex_comment}

For each persona, infer from their comment:
- sentiment: positive | neutral | negative
- would_upvote: true | false (would they actually upvote this post?)
- key_concern: what they care most about
- suggestion: one specific change that would resonate with them

Then synthesize panel-level insights.

Output ONLY JSON (no markdown fences):
{{
  "per_persona": {{
    "sarah": {{"sentiment": "...", "would_upvote": true, "key_concern": "...", "suggestion": "..."}},
    "mike": {{"sentiment": "...", "would_upvote": true, "key_concern": "...", "suggestion": "..."}},
    "alex": {{"sentiment": "...", "would_upvote": true, "key_concern": "...", "suggestion": "..."}}
  }},
  "synthesis": {{
    "predicted_engagement": "high|medium|low",
    "strongest_point": "what works best in the current messaging",
    "biggest_weakness": "what will cause people to scroll past or downvote",
    "recommended_changes": ["change 1", "change 2"],
    "optimized_title_suggestion": "a better title based on panel feedback"
  }}
}}"""


async def run(content_output: dict) -> dict:
    reddit = content_output.get("reddit_post", {}) or {}
    title = reddit.get("title", "")
    body = reddit.get("body", "")
    subreddit = (reddit.get("target_subreddit") or "r/SideProject").lstrip("r/")

    cfg = load_config()
    spark_ids = [cfg["sparks"]["sarah"], cfg["sparks"]["mike"], cfg["sparks"]["alex"]]

    user_prompt = USER_PROMPT_TEMPLATE.format(title=title, body=body, subreddit=subreddit)

    sarah_raw, mike_raw, alex_raw = await ask_panel_parallel(spark_ids, user_prompt)

    structured, kalibr_meta = await claude_json(
        STRUCTURE_PROMPT.format(
            title=title,
            body=body,
            subreddit=subreddit,
            sarah_comment=sarah_raw,
            mike_comment=mike_raw,
            alex_comment=alex_raw,
        ),
        goal="structure_personas",
        max_tokens=2500,
    )

    per = structured.get("per_persona", {})
    personas = []
    for key, raw in (("sarah", sarah_raw), ("mike", mike_raw), ("alex", alex_raw)):
        meta = PERSONA_META[key]
        p = per.get(key, {})
        personas.append({
            "name": meta["name"],
            "role": meta["role"],
            "emoji": meta["emoji"],
            "comment": raw.strip(),
            "sentiment": p.get("sentiment", "neutral"),
            "would_upvote": bool(p.get("would_upvote", False)),
            "key_concern": p.get("key_concern", ""),
            "suggestion": p.get("suggestion", ""),
        })

    return {
        "personas": personas,
        "synthesis": structured.get("synthesis", {}),
        "_meta": {
            "source": "Minds AI",
            "spark_ids": {k: v[:8] for k, v in cfg["sparks"].items()},
            "panel_id": cfg.get("panel_id", "")[:8],
        },
        "_kalibr": kalibr_meta,
    }
