"""Shared Claude client + JSON extraction helper."""

import asyncio
import json
import re
import time

from anthropic import Anthropic, APIError, APIStatusError

from config import ANTHROPIC_API_KEY, CLAUDE_MODEL

_client = Anthropic(api_key=ANTHROPIC_API_KEY)

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


def _call_sync(prompt: str, max_tokens: int = 4096, *, max_retries: int = 3) -> str:
    """Call Claude with simple exponential backoff on transient errors."""
    attempt = 0
    while True:
        try:
            msg = _client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}],
            )
            return msg.content[0].text
        except APIStatusError as e:
            status = getattr(e, "status_code", None)
            if attempt >= max_retries or status not in _RETRY_STATUSES:
                raise
        except APIError:
            if attempt >= max_retries:
                raise
        wait = 2 ** attempt
        print(f"[claude] transient failure, retrying in {wait}s…")
        time.sleep(wait)
        attempt += 1


async def claude_json(prompt: str, max_tokens: int = 4096) -> dict:
    """Call Claude and parse the response as JSON."""
    text = await asyncio.to_thread(_call_sync, prompt, max_tokens)
    try:
        return _extract_json(text)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Claude did not return valid JSON: {e}\nRaw: {text[:500]}")
