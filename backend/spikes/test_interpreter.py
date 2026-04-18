"""End-to-end smoke test of Agent 1 with the real Axolotl repo."""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents import interpreter


async def main():
    result = await interpreter.run("https://github.com/Axolotl-QA/Axolotl", "github_url")
    print(json.dumps(result, indent=2))


asyncio.run(main())
