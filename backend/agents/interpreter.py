"""Agent 1 — Interpreter. Product understanding + Launch Score."""

import os
import re
from typing import Optional

import httpx

from ._llm import claude_json


GITHUB_URL_RE = re.compile(r"github\.com[/:]([\w.-]+)/([\w.-]+?)(?:\.git|/|$)")


async def _fetch_github_context(url: str) -> Optional[str]:
    m = GITHUB_URL_RE.search(url)
    if not m:
        return None
    owner, repo = m.group(1), m.group(2)

    token = os.environ.get("GITHUB_TOKEN")
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        meta_task = client.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers)
        readme_task = client.get(
            f"https://api.github.com/repos/{owner}/{repo}/readme",
            headers={**headers, "Accept": "application/vnd.github.v3.raw"},
        )
        commits_task = client.get(
            f"https://api.github.com/repos/{owner}/{repo}/commits",
            params={"per_page": 10},
            headers=headers,
        )
        meta_r, readme_r, commits_r = (
            await meta_task,
            await readme_task,
            await commits_task,
        )

    # Fail loudly rather than hallucinate from the bare URL.
    if meta_r.status_code == 403 or readme_r.status_code == 403:
        raise RuntimeError(
            "GitHub rate-limited the Interpreter. Set GITHUB_TOKEN in .env "
            "for 5000/hr instead of 60/hr."
        )
    if readme_r.status_code != 200:
        raise RuntimeError(
            f"Could not fetch README for {owner}/{repo} "
            f"(status={readme_r.status_code}). Refusing to interpret without it."
        )

    parts = [f"Repo: {owner}/{repo}"]
    if meta_r.status_code == 200:
        m_data = meta_r.json()
        parts.append(f"Description: {m_data.get('description') or 'n/a'}")
        parts.append(f"Language: {m_data.get('language') or 'n/a'}")
        parts.append(f"Stars: {m_data.get('stargazers_count', 0)}")
        parts.append(f"Topics: {', '.join(m_data.get('topics', [])) or 'n/a'}")
    parts.append(f"\n--- README (first 5000 chars) ---\n{readme_r.text[:5000]}")
    if commits_r.status_code == 200:
        commits = commits_r.json()[:10]
        commit_lines = [f"- {c['commit']['message'].splitlines()[0]}" for c in commits]
        parts.append("\n--- Recent 10 commits ---\n" + "\n".join(commit_lines))
    return "\n".join(parts)


PROMPT = """You are a product marketing expert who deeply understands developer tools.

Analyze the following product/update and output ONLY a JSON object (no markdown fences, no explanation).

Product information:
{context}

Required JSON output:
{{
  "product_name": "name of the product",
  "what_it_does": "one sentence description",
  "update_summary": "what changed or what this product does",
  "user_value": "concrete value to end users",
  "update_type": "feature | fix | improvement | infra | initial_launch",
  "target_audiences": ["audience 1", "audience 2", "audience 3"],
  "launch_score": {{
    "novelty": <1-5>,
    "user_impact": <1-5>,
    "shareability": <1-5>,
    "timing_relevance": <1-5>,
    "overall": <1.0-5.0>
  }},
  "launch_recommendation": "full_launch | soft_launch | skip",
  "key_angles": ["angle 1", "angle 2", "angle 3"],
  "search_keywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
}}"""


async def run(input_text: str, input_type: str = "github_url") -> dict:
    context = None
    if input_type == "github_url" or "github.com" in input_text:
        context = await _fetch_github_context(input_text)
    if context is None:
        context = input_text
    return await claude_json(PROMPT.format(context=context))
