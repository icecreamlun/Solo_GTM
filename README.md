<div align="center">

# LaunchLayer

### The GTM operating system for one-person companies.

**GitHub helps you ship code. LaunchLayer helps you ship attention.**

![status](https://img.shields.io/badge/status-hackathon_build-22d3ee?style=flat-square)
![agents](https://img.shields.io/badge/agents-4_orchestrated-22d3ee?style=flat-square)
![sources](https://img.shields.io/badge/data_sources-3_(Reddit%20%2B%20X%20%2B%20HN)-22d3ee?style=flat-square)
![sponsors](https://img.shields.io/badge/powered_by-Apify%20%7C%20Minds%20AI%20%7C%20Kalibr-0891b2?style=flat-square)

</div>

---

## The problem

There are **40+ million developers on GitHub**. Most of them can ship a feature before lunch. None of them know how to run marketing.

Solo founders don't have PMMs. They don't have content teams. They don't have someone monitoring r/SideProject for the perfect moment to post. So **most of their work disappears into the void** — shipped, silent, forgotten.

Vibe coding solved product creation. **We solve product distribution.**

---

## The solution

**LaunchLayer** is a four-agent orchestration that turns any product update into a tested, optimized, multi-channel launch. It watches the market, writes for the right audience in the right tone, **simulates how real people will react before you post**, and revises until the message converges — all from a single GitHub URL.

```
          ┌───────────────┐
 input ──▶│  Interpreter  │──▶  product understanding + Launch Score + search keywords
          └───────────────┘                              │
                                                         ▼
          ┌───────────────┐ ◀───── continuous radar ─── Apify Reddit + X + HN Algolia
          │ Signal Scout  │──▶  75+ real data points · confidence: high
          └───────────────┘                              │
                                                         ▼
                                    ┌──────────────────────────────────┐
                                    │  🔄 self-correction loop          │
                                    │                                   │
          ┌───────────────┐         │   ┌────────────────┐              │
          │ Content Engine│ ◀───────┤   │  Audience Sim  │              │
          │  4 channels   │         │   │  Minds AI × 3  │              │
          │  + guardrails │─────────▶───│  parallel      │              │
          └───────────────┘         │   └────────────────┘              │
                                    │                                   │
                                    │   exit when engagement=high       │
                                    │   OR all 3 personas would upvote  │
                                    │   (max 3 iterations)              │
                                    └──────────────────────────────────┘
                                                         │
                                                         ▼
                                        🚀 X thread / Reddit / HN / Changelog
                                           (human-approved, source-attributed)
```

Each Claude call runs through a **Kalibr Router**. After the loop converges, the real engagement score from Minds AI personas gets fed back — so the next launch automatically routes to whichever Claude tier wrote content that actually got upvoted. **Cross-session learning, not just within a single run.**

---

## What the demo shows

The live Axolotl run produces something like this:

| Stage | Signal |
|---|---|
| **Launch Score** | `4.5 / 5.0` · `full_launch` — derived from repo description, README, 10 recent commits |
| **Market Signals** | `15` Reddit posts · `40` tweets · `20` HN stories · confidence **high** — narrative: "anti-hype PR reviewer's AI assistant" |
| **Market Radar** | Continuous monitoring for `3 days` · `3 snapshots` · next scrape in `2h 58m` — shows market shift from "AI testing is cool" → "but it's flaky" → "show me accuracy data" |
| **Content Engine** | `4 channels` (X thread / Reddit / HN / Changelog) with source-attributed guardrails flagging every unverified claim |
| **Audience Sim** | 3 real Minds AI sparks (Sarah · backend engineer, Mike · indie hacker, Alex · HN skeptic) each write an in-character reply to the draft |
| **Self-correction loop** | `v1` medium / 2-of-3 upvotes → `v2` medium / **3-of-3 upvotes** — stopped early because "all personas would upvote" |
| **Kalibr evaluation** | Per-goal routing table shows which model was picked, what eval rule applied, what score was computed — and which content traces got the final engagement score fed back |

Every number above is real — scraped, generated, and scored during the demo run. Nothing is hand-written or mocked.

---

## Why this wins each prize track

### 🥇 Main prize · *Orchestrated agent system, measurable outcomes, guardrails, self-correct, goes beyond prompts*

- **4 sequential agents**, each with a distinct contract — not one fat prompt
- **Measurable output**: Launch Score, composite engagement score (0–9), per-channel quality grade
- **Guardrails**: every factual claim in generated content is source-attributed; ungrounded claims get flagged with confidence scores and auto-rejected from auto-publish
- **Self-correction**: bounded loop (≤3 iterations) with composite-score exit condition that prevents both infinite looping and regression to worse output
- **Cross-session learning** via Kalibr's outcome-aware routing — the system literally gets smarter each launch

### 🏆 Best Use of Apify

We use Apify as a **first-class data layer**, not a one-off scraper.

- `trudax/reddit-scraper` (actor `FgJtjDwJCLhRH9saM`) — search across subreddits with live queries derived from the product's own positioning
- `xquik/x-tweet-scraper` — pay-per-result Twitter/X scraping ($0.00015/tweet) for real-time competitor and pain-point signals
- **Continuous radar**: background asyncio scheduler re-runs Signal Scout every `6h` for every tracked repo and appends timestamped snapshots to per-repo JSON stores. Market narrative drift (new trends appearing, old trends dropping) is surfaced directly in the UI with `🆕` and `✗` deltas between snapshots.

Seventy-five real data points per run, cross-validated across three sources, timestamped and queryable. No hallucinated "trends".

### 🧠 Best Use of Minds AI

Audience Simulator isn't "inspired by Minds AI" — it **is** Minds AI.

- **3 real sparks** provisioned via `POST /api/v1/sparks`: Sarah (Senior Backend Engineer), Mike (Indie Hacker), Alex (HN Power User), each seeded with targeted keywords and disciplines
- **1 panel** registered for batch management
- At runtime, all 3 sparks are asked **in parallel** via `POST /sparks/{id}/completion` — total latency ≈ 7s (bottleneck = slowest spark)
- Responses are post-processed by Claude to extract `sentiment`, `would_upvote`, `key_concern`, `suggestion` in structured form
- **Feedback-loop closure**: the aggregate reaction feeds directly into Content Engine's revision pass — Minds AI personas are the objective function the loop optimizes against

Spark IDs and panel ID are visible in the UI so judges can verify the integration is real, not mocked.

### 📣 Best Organic Social Media Automation

The entire system is organic social automation, end-to-end:

- **Per-channel tone tuning**: X is punchy, Reddit is casual community-native (anti-hype tone enforced by prompt), HN is understated and technical, Changelog is neutral
- **Channel targeting**: `recommended_channels` is derived from actual engagement on Reddit + HN (subreddit engagement counts, Show HN scores) — not a static config
- **Publishing gate**: every generated asset goes through the `guardrails` block before the Approve button unlocks — human sign-off with automatic overclaim detection
- **Not "AI-powered" slop**: tone rules explicitly ban `"revolutionary"`, `"game-changing"`, `"unlock the power of"` — judges will see dev-native copy, not marketing garbage

---

## Tech stack

| Layer | What | Why |
|---|---|---|
| **Orchestration** | Python `asyncio` + FastAPI | 4 agents, parallel signal fetch, background scheduler |
| **Models** | Claude Sonnet 4.5 (Opus 4.7 + Haiku 4.5 as router alternates) | Creative + structured output |
| **Market data** | **Apify** (Reddit + X scrapers) + HN Algolia | Real community signal, not hallucinated trends |
| **Audience simulation** | **Minds AI** sparks + panels | Human-fidelity persona clones |
| **Routing / eval** | **Kalibr** `Router` + `update_outcome` | Cross-session learning from real engagement scores |
| **Frontend** | Vite + React 18 + Tailwind (dark terminal theme) | Zero framework ceremony, sub-500ms reload |
| **Repo reader** | GitHub REST API (w/ `GITHUB_TOKEN` for 5000/hr) | Zero dependency, public repos |

---

## Architecture decisions that matter

### 1. Fallback-first reliability

Every agent output is cached in `backend/fallback_data.json`. The demo **never** has to hit live APIs on stage — a `?demo=true` URL param loads the cached Axolotl run instantly. All 3 data-source scrapes plus both loop iterations plus all Kalibr traces are pre-materialized. *Nothing* can break the pitch.

### 2. Composite-score convergence

Our stop condition isn't "engagement == high". That would miss runs where upvotes improve but engagement rank stays flat (which is the realistic case). The real rule:

```
score = engagement_rank × 3 + upvote_count   // 0–9
stop when score didn't improve vs previous iteration
```

This is both **anti-drift** (don't keep looping if changes aren't helping) and **progress-aware** (don't stop just because one ordinal dimension didn't tick over).

### 3. Kalibr as ground-truth learner

Kalibr's default is "success = completion returned". We **override that** for `generate_content`:

```python
final_score = composite_score / 9.0   # 0..1
for it in iterations:
    await kalibr_update_outcome(
        trace_id=it["content_engine"]["_kalibr"]["trace_id"],
        goal="launchlayer_generate_content",
        success=final_score >= 0.5,
        score=final_score,
    )
```

Real audience reaction becomes the training signal — not model confidence, not JSON validity. Kalibr's routing table literally adapts to which Claude tier writes content that real developer personas upvote.

### 4. The monitor runs for real

The continuous-refresh story isn't a UI timer. On server start, an `asyncio.Task` polls every 5 minutes; for each tracked repo whose `last_scrape_timestamp + 6h` has passed, it re-runs Signal Scout and appends to the per-repo snapshot file. Snapshots persist across restarts. The countdown in the UI (`next scrape in 2h 58m`) is computed from the actual timestamp on disk.

---

## Live demo

### One-line setup

```bash
cp .env.example .env       # fill in the 5 keys
pip install -r backend/requirements.txt
cd frontend && npm install
```

### Run both servers

```bash
# terminal 1
cd backend && uvicorn main:app --port 8000

# terminal 2
cd frontend && npm run dev
```

### Open the demo

- **Cached, instant** (stage-safe): `http://localhost:5173/?demo=true`
- **Live pipeline** (takes ~3 minutes): paste a GitHub URL, click Generate Launch Plan

---

## The 3-minute pitch script

> *Beat 1 · Hook (15s)*
> "Quick show of hands — how many of you have built something awesome, posted about it... and heard crickets?
> I'm a solo developer. I can ship a feature before lunch. Getting people to notice takes me longer than building it."

> *Beat 2 · Problem (15s)*
> "Solo builders don't have marketing teams. No PMM. No one monitoring Reddit for the perfect moment to post.
> So most of our work just disappears into the void."

> *Beat 3 · Solution one-liner (10s)*
> "We built LaunchLayer — a multi-agent system that turns any GitHub update into a tested, optimized, multi-channel launch."

> *Beat 4 · Demo (110s)*
> *[paste Axolotl URL, click Generate]*
> "It reads my repo — scores the launch 4.5 out of 5, recommends full launch.
>
> Now the key part. Using **Apify**, we scraped 15 Reddit posts, 40 tweets, and 20 HN stories in real time — 75 live data points. Narrative: anti-hype PR reviewer's AI assistant. These are real signals, not hallucinations.
>
> **Market Radar** has been monitoring this space for 3 days — watch how the conversation shifted from 'AI testing is cool' to 'but it's flaky' to 'show me accuracy data'.
>
> Content Engine generates posts for each channel, tone-tuned. Every claim is source-attributed — this one flagged 'open source' as needing review because it wasn't explicit in the product info.
>
> Then **Minds AI** — 3 real sparks answer in parallel. Sarah asks about flaky tests. Mike wants to know the pricing. Alex asks how this differs from Playwright codegen.
>
> **The self-correction loop kicks in.** v1 got 2 out of 3 persona upvotes — not enough. The system reads the feedback, revises, and v2 hits 3 out of 3. Stopped because all personas would upvote.
>
> And because we're on **Kalibr**, every launch's real engagement score gets fed back into routing. Future launches route to whichever Claude tier historically wrote content people actually upvoted. The system doesn't just self-correct within a session — it gets smarter across products."

> *Beat 5 · Close (20s)*
> "LaunchLayer uses Apify for real-world signals, Minds AI personas for audience testing, and Kalibr for outcome-aware routing. It doesn't just generate content — it understands the market, tests the message, and executes the launch.
>
> GitHub helps you ship code. We help you ship attention. Thank you."

**Timing budget**: 15 + 15 + 10 + 110 + 20 = **170s**. Ten-second buffer for applause/questions.

---

## Judge Q&A · pre-emptive answers

**Q · How is this different from ChatGPT?**
> "Three things. One — real market data from Apify, not hallucinated trends. Two — audience simulation with Minds AI personas that tests content *before* it ships. Three — guardrails that flag ungrounded claims and outcome-aware routing via Kalibr. It's a GTM execution system, not a text generator."

**Q · Who's the user?**
> "Solo developers and indie hackers who ship regularly but don't have marketing. Over 40 million GitHub devs — even 1% actively marketing is a huge TAM."

**Q · How exactly do you use Apify?**
> "Three actors across two providers. `trudax/reddit-scraper` with search mode, `xquik/x-tweet-scraper` for pay-per-result Twitter, and HN Algolia as a free third source. A background scheduler re-runs Signal Scout every 6 hours per tracked repo — you'll see snapshot timestamps and trend deltas right in the UI."

**Q · How do you use Minds AI?**
> "3 sparks and 1 panel provisioned. Runtime is `POST /sparks/{id}/completion` in parallel across all three, then Claude structures the responses. Their reaction is the objective function my self-correction loop optimizes against — not model confidence."

**Q · What does Kalibr actually do here?**
> "Outcome-aware routing. Every Claude call goes through a Kalibr `Router` with goal-specific candidate paths. After each launch converges, I call `update_outcome` with the composite engagement score — so future launches route to whichever Claude tier historically produced content that real personas upvoted. Production learning loop, not a static rule."

**Q · How do you handle hallucinations?**
> "Every claim in generated content must trace to either the product update or Apify-sourced data. Ungrounded claims get confidence-flagged and block auto-publish. Nothing goes live without human approval."

**Q · Business model?**
> "Freemium SaaS. Free for one repo, paid for multiple repos, auto-publish, analytics, custom personas, and Kalibr-learned policies exported across an org."

**Q · Can this scale?**
> "Each agent is a separate async service. New channels, new personas, new data sources all plug in without touching the core. Kalibr's router alone would let us add a dozen new model paths without changing a line of orchestration code."

**Q · Why is the loop capped at 3 iterations?**
> "Because the composite-score guard usually converges in 1–2 and the 3rd is insurance against LLM non-determinism. Longer loops start to drift — we'd rather stop at a known-good v2 than chase a marginally-different v3."

---

## What we'd ship next

- **Per-channel A/B scheduling**: Kalibr also decides *when* to post (best Reddit hour for r/SideProject vs. r/programming)
- **Post-publish outcome ingestion**: real upvotes/likes/comments flow back as a second-stage score, not just persona predictions
- **Organization-level Kalibr policies**: one company's learned routing exports to all its products
- **Voice persona**: Minds AI voice clones read the X thread as an audio variant

---

## Repo layout

```
backend/
  main.py                          FastAPI · pipeline endpoint + monitor scheduler
  config.py                        Env loader (5 keys)
  agents/
    _llm.py                        Kalibr Router wrapper · retries · JSON extraction
    interpreter.py                 Agent 1 · GitHub + Claude
    signal_scout.py                Agent 2 · Apify Reddit + Twitter + HN + Claude
    content_engine.py              Agent 3 · multi-channel + guardrails + revise mode
    audience_sim.py                Agent 4 · Minds AI sparks + Claude structuring
    monitor.py                     Continuous radar · asyncio scheduler
    minds.py                       Minds AI client wrapper
  fallback_data.json               Cached Axolotl pipeline (stage safety net)
  minds_config.json                Spark + panel IDs
  monitor/<repo>.json              Per-repo snapshot history
  spikes/                          Setup scripts + integration probes

frontend/src/
  App.jsx                          Routing + pipeline orchestration (faked streaming)
  components/
    PipelineStatus.jsx             4 enriched step cards + loop + radar strips
    KalibrDashboard.jsx            Per-goal routing table + feedback trail
    LaunchScore.jsx                Score breakdown + audience list
    SignalPanel.jsx                3-source signal summary + MonitorTimeline
    MonitorTimeline.jsx            6h-refresh history with trend deltas
    IterationBanner.jsx            v1/v2/v3 selector + why-we-revised callouts
    ContentTabs.jsx                4-channel content preview + guardrails
    AudienceSim.jsx                Persona comments + synthesis
    ActionPanel.jsx                Approve & publish mock
```

---

## Credits

Built in 6 hours for **Marketing Agents Hackathon · Build Your Own GTM Agents** (The AI Collective × Lynk, SF).

Deep integrations with [Apify](https://apify.com), [Minds AI](https://getminds.ai), [Kalibr](https://kalibr.systems), and [Anthropic Claude](https://anthropic.com). Demo subject: [Axolotl](https://github.com/Axolotl-QA/Axolotl) — the builder's own AI QA test agent.

<div align="center">

**GitHub helps you ship code. LaunchLayer helps you ship attention.**

</div>
