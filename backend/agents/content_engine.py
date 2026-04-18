"""Agent 3 — Content Engine. Multi-channel content + guardrails."""

import json

from ._llm import claude_json


PROMPT = """You are a developer-focused content marketer. You write like a REAL developer sharing their work, not a marketer.

Product analysis:
{interpreter_json}

Market signals:
{signal_json}

RULES:
1. Dev-native tone — no "revolutionary", "game-changing", "unlock the power of"
2. Every factual claim must trace back to the product info or market data above
3. Each channel has its own voice: Reddit is casual/community, HN is technical/understated, X is punchy
4. Be specific and concrete

Output ONLY JSON:
{{
  "x_thread": {{
    "tweets": [
      "Tweet 1 — hook (grab attention, first line matters most)",
      "Tweet 2 — what you built and why it matters",
      "Tweet 3 — concrete proof point or metric",
      "Tweet 4 — CTA (try it / star it / feedback welcome)"
    ],
    "angle": "which narrative angle",
    "hook_type": "curiosity | pain_point | achievement | trend"
  }},
  "reddit_post": {{
    "title": "r/SideProject style title",
    "body": "full post, 150-300 words, first person, conversational, includes what it does + why you built it + what's next + link",
    "target_subreddit": "r/SideProject",
    "flair": "Show"
  }},
  "hn_post": {{
    "title": "Show HN: Product Name – short factual description (under 80 chars)",
    "body": "brief, technical, no hype, 2-3 paragraphs max"
  }},
  "changelog": {{
    "title": "v1.x — Feature Name",
    "bullets": ["what changed 1", "what changed 2", "what changed 3"]
  }},
  "guardrails": {{
    "all_claims_sourced": true,
    "flags": [
      {{
        "claim": "the specific text being flagged",
        "confidence": 0.0,
        "source": "where it comes from or 'unverified'",
        "action": "approve|review|remove"
      }}
    ],
    "tone_check": "pass|warning",
    "overclaim_check": "pass|flagged",
    "quality_score": "ready|needs_edit|major_issues"
  }}
}}"""


async def run(interpreter_output: dict, signal_output: dict) -> dict:
    # Strip _meta from signal before prompting
    signal_clean = {k: v for k, v in signal_output.items() if not k.startswith("_")}
    prompt = PROMPT.format(
        interpreter_json=json.dumps(interpreter_output, indent=2),
        signal_json=json.dumps(signal_clean, indent=2),
    )
    return await claude_json(prompt, max_tokens=6000)
