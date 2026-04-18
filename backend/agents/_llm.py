"""Shared Claude client + JSON extraction helper."""

import asyncio
import json
import re

from anthropic import Anthropic

from config import ANTHROPIC_API_KEY, CLAUDE_MODEL

_client = Anthropic(api_key=ANTHROPIC_API_KEY)


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


def _call_sync(prompt: str, max_tokens: int = 4096) -> str:
    msg = _client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text


async def claude_json(prompt: str, max_tokens: int = 4096) -> dict:
    """Call Claude and parse the response as JSON."""
    text = await asyncio.to_thread(_call_sync, prompt, max_tokens)
    try:
        return _extract_json(text)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Claude did not return valid JSON: {e}\nRaw: {text[:500]}")
