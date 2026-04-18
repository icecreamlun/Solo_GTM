"""Shared LLM client with Kalibr outcome-aware routing.

Every Claude call goes through a per-goal Kalibr Router, which:
  - Picks a model from the goal's candidate paths based on past outcomes
  - Auto-reports success on completion
  - Exposes a trace_id so we can later call update_outcome() with the real
    engagement score once the self-correction loop converges

Claude is the only provider we have a key for, so each goal's paths are
different Claude tiers. Kalibr still learns which tier wins per goal.
"""

# Must be loaded before Anthropic SDK so kalibr can monkey-patch the class.
from config import (  # noqa: F401 — side effect loads .env
    ANTHROPIC_API_KEY,
    CLAUDE_MODEL,
    KALIBR_API_KEY,
    KALIBR_TENANT_ID,
)

import asyncio
import json
import re
import time

import kalibr  # noqa: F401 — monkey-patches Anthropic SDK at import time
from kalibr import Router, update_outcome as _kalibr_update_outcome
from anthropic import APIError, APIStatusError


_ROUTING_ENABLED = bool(KALIBR_API_KEY and KALIBR_TENANT_ID)


# One entry per agent goal. First path is the conservative default; second is
# a variant Kalibr can test when it wants to explore (faster/cheaper or smarter).
GOAL_PATHS: dict[str, list[str]] = {
    "interpret_product":   ["claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"],
    "synthesize_signals":  ["claude-sonnet-4-5-20250929", "claude-opus-4-7"],
    "generate_content":    ["claude-sonnet-4-5-20250929", "claude-opus-4-7"],
    "structure_personas":  ["claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"],
}

_RETRY_STATUSES = {500, 502, 503, 504, 529}


def _extract_json(text: str) -> dict:
    text = text.strip()
    fence = re.match(r"^```(?:json)?\s*(.*?)```$", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        text = text[start : end + 1]
    return json.loads(text)


def _call_sync(goal: str, prompt: str, max_tokens: int, max_retries: int = 3) -> tuple[str, dict]:
    """Run one Claude completion through Kalibr's Router.

    Returns (text, kalibr_meta) where kalibr_meta is safe to attach to the
    caller's output dict so main.py can later update outcomes.
    """
    paths = GOAL_PATHS.get(goal, [CLAUDE_MODEL])
    full_goal = f"launchlayer_{goal}"
    router = Router(goal=full_goal, paths=paths)

    attempt = 0
    while True:
        try:
            resp = router.completion(
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
            )
            text = resp.choices[0].message.content
            meta = {
                "goal": full_goal,
                "trace_id": getattr(resp, "kalibr_trace_id", None),
                "model": getattr(resp, "model", None),
                "routing_enabled": _ROUTING_ENABLED,
            }
            return text, meta
        except APIStatusError as e:
            status = getattr(e, "status_code", None)
            if attempt >= max_retries or status not in _RETRY_STATUSES:
                raise
        except APIError:
            if attempt >= max_retries:
                raise
        wait = 2 ** attempt
        print(f"[claude] transient failure on goal={goal}, retrying in {wait}s…")
        time.sleep(wait)
        attempt += 1


async def claude_json(prompt: str, *, goal: str, max_tokens: int = 4096) -> tuple[dict, dict]:
    """Call Claude and parse JSON response.

    Returns (parsed, kalibr_meta). Callers typically attach meta to their
    result dict as `_kalibr` so main.py can feed composite scores back later.
    """
    text, meta = await asyncio.to_thread(_call_sync, goal, prompt, max_tokens)
    try:
        return _extract_json(text), meta
    except json.JSONDecodeError as e:
        # Override Kalibr's auto-reported success with our parse failure.
        trace_id = meta.get("trace_id")
        if trace_id:
            try:
                _kalibr_update_outcome(
                    trace_id,
                    meta["goal"],
                    success=False,
                    failure_category="malformed_output",
                )
            except Exception:
                pass
        raise RuntimeError(f"Claude did not return valid JSON: {e}\nRaw: {text[:500]}")


async def update_outcome(trace_id: str, goal: str, *, success: bool, score: float | None = None) -> None:
    """Update a previously-auto-reported outcome with ground-truth data.

    Used by main.py after the self-correction loop converges, so Kalibr learns
    which model wrote content that actually got persona upvotes.
    """
    if not trace_id or not _ROUTING_ENABLED:
        return
    try:
        await asyncio.to_thread(
            _kalibr_update_outcome, trace_id, goal, success=success, score=score
        )
    except Exception as e:
        print(f"[kalibr] update_outcome failed for {trace_id[:8]}…: {e}")
