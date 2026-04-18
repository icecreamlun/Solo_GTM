// Mock data — replaced with real pipeline output once backend completes
export const MOCK = {
  meta: {
    input: "https://github.com/Axolotl-QA/Axolotl",
    input_type: "github_url",
    timings: { interpreter: 4.2, signal_scout: 38.1, content_engine: 9.8, audience_sim: 7.4 },
  },
  interpreter: {
    product_name: "Axolotl",
    what_it_does: "AI QA agent for VS Code that generates and runs real browser tests from code changes.",
    update_summary: "Adds real-time browser test recording and smart dependency tracing.",
    user_value: "Prevents production bugs by testing what actually changed.",
    update_type: "feature",
    target_audiences: ["Backend devs", "QA engineers", "Indie hackers"],
    launch_score: { novelty: 4, user_impact: 5, shareability: 4, timing_relevance: 5, overall: 4.5 },
    launch_recommendation: "full_launch",
    key_angles: ["Visual test recording beats script-based testing", "AI that reads your diff"],
    search_keywords: ["AI testing", "end-to-end testing", "browser automation"],
  },
  signal_scout: {
    trending_topics: ["AI testing tools", "Playwright alternatives", "QA automation"],
    community_pain_points: ["Flaky tests", "Maintenance overhead"],
    recommended_narrative: "Focus on visual test recording — the community wants faster iteration.",
    recommended_channels: [
      { channel: "r/SideProject", reason: "High engagement for dev tools", fit_score: "high" },
      { channel: "Hacker News", reason: "Testing automation trending", fit_score: "high" },
    ],
    competitive_angle: "Reads diff → generates tests. No other tool does both.",
    timing_insight: "AI testing discussions up 40% this week.",
    signal_confidence: "high",
    data_sources_count: 65,
    key_data_points: [
      { source: "r/Playwright", insight: "Users want less maintenance", relevance: "high" },
      { source: "Hacker News", insight: "Testing automation trending", relevance: "high" },
    ],
    _meta: { reddit_count: 15, hn_count: 50, used_cached_apify: false },
  },
  content_engine: {
    x_thread: {
      tweets: [
        "I got tired of writing tests. So I built an AI that watches my diff and runs real browser tests automatically.",
        "Axolotl reads your PR, figures out which user flows changed, and actually clicks through them in Chromium.",
        "No test writing. No yaml configs. Just merge verdicts backed by real browser runs.",
        "Open source, VS Code extension. github.com/Axolotl-QA/Axolotl",
      ],
      angle: "Visual testing beats script-based",
      hook_type: "pain_point",
    },
    reddit_post: {
      title: "I built an AI agent that runs browser tests from your PR diff",
      body: "Been working on this for a few weeks. Basically: you open a PR, Axolotl reads the diff, figures out which user flows are affected, then spins up Chromium and actually tests them. No test writing.\n\nIt's a VS Code extension. Uses Tree-sitter for AST analysis, Claude for test generation, Playwright for browser automation.\n\nStill beta, but it's caught 3 real bugs for me this week that my existing tests missed.\n\nLink: github.com/Axolotl-QA/Axolotl — feedback welcome.",
      target_subreddit: "r/SideProject",
      flair: "Show",
    },
    hn_post: {
      title: "Show HN: Axolotl – AI agent that runs browser tests from your PR diff",
      body: "Axolotl reads your PR diff, identifies affected user flows, and runs them in Chromium via Playwright. VS Code extension.\n\nStack: Tree-sitter AST analysis, ripgrep for dependency tracing, Claude Sonnet for test generation, Playwright for execution.\n\nEarly stage. Looking for feedback on the dependency-tracing approach vs. traditional coverage-based selection.",
    },
    changelog: {
      title: "v0.8 — Real-time browser test recording",
      bullets: [
        "Watch Axolotl run tests live in Chromium",
        "Smart dependency tracing via ripgrep + AST",
        "One-click test generation from any component",
      ],
    },
    guardrails: {
      all_claims_sourced: true,
      flags: [
        { claim: "real-time", confidence: 0.7, source: "update_summary", action: "review" },
      ],
      tone_check: "pass",
      overclaim_check: "pass",
      quality_score: "ready",
    },
  },
  audience_sim: {
    personas: [
      {
        name: "Sarah",
        role: "Senior Backend Engineer",
        emoji: "👩‍💻",
        comment: "Interesting approach. But the real question is — does it handle flaky tests? That's where most tools fall apart.",
        sentiment: "neutral",
        would_upvote: false,
        key_concern: "Reliability under real-world conditions",
        suggestion: "Add benchmark data on flaky test handling",
      },
      {
        name: "Mike",
        role: "Indie Hacker",
        emoji: "🚀",
        comment: "This could save me hours every week. Bookmarking. How does pricing work?",
        sentiment: "positive",
        would_upvote: true,
        key_concern: "Time-to-value and cost",
        suggestion: "Mention it's free / open source upfront",
      },
      {
        name: "Alex",
        role: "HN Power User",
        emoji: "🤨",
        comment: "How is this different from Playwright codegen? Genuine question.",
        sentiment: "negative",
        would_upvote: false,
        key_concern: "Differentiation from existing tools",
        suggestion: "Lead with the diff-reading differentiator",
      },
    ],
    synthesis: {
      predicted_engagement: "medium",
      strongest_point: "Time-saving angle for indie hackers",
      biggest_weakness: "Unclear differentiation from Playwright codegen",
      recommended_changes: [
        "Add benchmarks proving it catches bugs other tools miss",
        "Clarify diff-reading differentiator in first sentence",
      ],
      optimized_title_suggestion: "I built an AI that reads your PR diff and tests only what changed",
    },
  },
};
