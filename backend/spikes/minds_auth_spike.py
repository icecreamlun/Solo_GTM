"""Step 1 of Minds AI spike: verify auth and list existing sparks."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import httpx

from config import MINDS_API_KEY, MINDS_BASE_URL

BASE = MINDS_BASE_URL
HEADERS = {"Authorization": f"Bearer {MINDS_API_KEY}", "Content-Type": "application/json"}


def main():
    with httpx.Client(timeout=15.0, follow_redirects=True) as c:
        print("GET /auth/me")
        r = c.get(f"{BASE}/auth/me", headers=HEADERS)
        print(f"  status={r.status_code}")
        print(f"  body={r.text[:500]}")

        print("\nGET /sparks")
        r = c.get(f"{BASE}/sparks", headers=HEADERS)
        print(f"  status={r.status_code}")
        print(f"  body={r.text[:1500]}")

        print("\nGET /panels")
        r = c.get(f"{BASE}/panels", headers=HEADERS)
        print(f"  status={r.status_code}")
        print(f"  body={r.text[:1500]}")


if __name__ == "__main__":
    main()
