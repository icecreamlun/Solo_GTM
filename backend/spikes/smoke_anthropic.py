"""Smoke test the Anthropic SDK with the configured key and model."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from anthropic import Anthropic
from config import ANTHROPIC_API_KEY, CLAUDE_MODEL

client = Anthropic(api_key=ANTHROPIC_API_KEY)

msg = client.messages.create(
    model=CLAUDE_MODEL,
    max_tokens=256,
    messages=[{"role": "user", "content": "Reply with exactly: OK"}],
)

print("Model:", msg.model)
print("Stop reason:", msg.stop_reason)
print("Response:", msg.content[0].text)
