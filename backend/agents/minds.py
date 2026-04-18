"""Thin Minds AI client — just what Agent 4 needs."""

import asyncio
import json
from pathlib import Path

import httpx

from config import MINDS_API_KEY, MINDS_BASE_URL, MINDS_CONFIG_PATH


def load_config() -> dict:
    if not MINDS_CONFIG_PATH.exists():
        raise RuntimeError(
            f"Minds config not found at {MINDS_CONFIG_PATH}. "
            "Run backend/spikes/minds_setup.py first."
        )
    return json.loads(MINDS_CONFIG_PATH.read_text())


_HEADERS = {
    "Authorization": f"Bearer {MINDS_API_KEY}",
    "Content-Type": "application/json",
}


async def ask_spark(client: httpx.AsyncClient, spark_id: str, prompt: str) -> str:
    r = await client.post(
        f"{MINDS_BASE_URL}/sparks/{spark_id}/completion",
        headers=_HEADERS,
        json={"messages": [{"role": "user", "content": prompt}]},
    )
    r.raise_for_status()
    return r.json()["content"]


async def ask_panel_parallel(spark_ids: list[str], prompt: str) -> list[str]:
    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        return await asyncio.gather(
            *(ask_spark(client, sid, prompt) for sid in spark_ids)
        )
