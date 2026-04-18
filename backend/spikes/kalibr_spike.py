"""Spike a live Kalibr Router.completion to learn response shape + trace_id access."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import kalibr  # noqa: F401 — must be before anthropic
from kalibr import Router

from config import ANTHROPIC_API_KEY  # noqa: F401 — side effect loads .env

router = Router(
    goal="launchlayer_spike",
    paths=["claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"],
)

resp = router.completion(
    messages=[{"role": "user", "content": "Reply with exactly: OK"}],
    max_tokens=20,
)

print("type:", type(resp).__name__)
print("repr(resp):", repr(resp)[:400])
print()

# Try common access patterns
for path in ["resp.kalibr_trace_id", "resp.trace_id", "getattr(resp, 'kalibr_trace_id', None)"]:
    try:
        v = eval(path)
        print(f"{path} = {v}")
    except Exception as e:
        print(f"{path}: {e}")

# Content access — try both OpenAI and Anthropic styles
print("\nContent access attempts:")
try:
    print("resp.choices[0].message.content:", resp.choices[0].message.content[:100])
except Exception as e:
    print("OpenAI-style failed:", e)
try:
    print("resp.content[0].text:", resp.content[0].text[:100])
except Exception as e:
    print("Anthropic-style failed:", e)

# Report outcome
print("\nrouter.report:")
try:
    router.report(success=True, score=1.0)
    print("  OK")
except Exception as e:
    print(f"  failed: {e}")

print(f"\ntrace_id on router: {getattr(router, 'last_trace_id', None)}")
