"""Agent 3 — Content Engine. Multi-channel content + guardrails.

Two modes:
- Initial generation: product + market signals → first draft
- Revision: initial args + previous_attempt + audience_feedback → revised draft
  that addresses the specific persona concerns.
"""

import json
from typing import Optional

from ._llm import claude_json


# Note: braces in _SCHEMA_BLOCK are doubled so str.format() passes them through as literals.
_SCHEMA_BLOCK = """Output ONLY JSON:
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


INITIAL_PROMPT = """You are a developer-focused content marketer. You write like a REAL developer sharing their work, not a marketer.

Product analysis:
{interpreter_json}

Market signals:
{signal_json}

RULES:
1. Dev-native tone — no "revolutionary", "game-changing", "unlock the power of"
2. Every factual claim must trace back to the product info or market data above
3. Each channel has its own voice: Reddit is casual/community, HN is technical/understated, X is punchy
4. Be specific and concrete

""" + _SCHEMA_BLOCK


REVISION_PROMPT = """You are revising a multi-channel launch draft based on direct feedback from 3 simulated audience personas.

Product analysis:
{interpreter_json}

Market signals:
{signal_json}

Previous draft (iteration {iteration}):
{previous_attempt}

Audience feedback on that draft:
{audience_feedback}

YOUR JOB: produce a revised version that concretely addresses the feedback. Specifically:
- Look at each persona's `key_concern` and `suggestion` — fix them in the new draft
- Apply the `recommended_changes` from the synthesis section
- Use the `optimized_title_suggestion` as inspiration (not necessarily verbatim)
- Keep the tone dev-native; do NOT drift into hype to compensate

Revision rules:
1. Only change what the feedback asks you to change. Preserve what the personas liked.
2. Every factual claim must still trace back to the product info or market data above. No new unsourced claims.
3. Output the FULL revised content (all 4 channels + guardrails), not a diff.

""" + _SCHEMA_BLOCK


async def run(
    interpreter_output: dict,
    signal_output: dict,
    previous_attempt: Optional[dict] = None,
    audience_feedback: Optional[dict] = None,
    iteration: int = 1,
) -> dict:
    signal_clean = {k: v for k, v in signal_output.items() if not k.startswith("_")}
    interp_json = json.dumps(interpreter_output, indent=2)
    signal_json = json.dumps(signal_clean, indent=2)

    if previous_attempt is not None and audience_feedback is not None:
        audience_clean = {k: v for k, v in audience_feedback.items() if not k.startswith("_")}
        prompt = REVISION_PROMPT.format(
            interpreter_json=interp_json,
            signal_json=signal_json,
            iteration=iteration - 1,
            previous_attempt=json.dumps(previous_attempt, indent=2),
            audience_feedback=json.dumps(audience_clean, indent=2),
        )
    else:
        prompt = INITIAL_PROMPT.format(
            interpreter_json=interp_json,
            signal_json=signal_json,
        )

    result, kalibr_meta = await claude_json(
        prompt, goal="generate_content", max_tokens=6000
    )
    result["_kalibr"] = kalibr_meta
    return result
