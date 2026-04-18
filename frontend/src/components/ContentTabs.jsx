import { useState } from "react";

const TABS = [
  { key: "reddit_post", label: "Reddit" },
  { key: "x_thread", label: "𝕏 Thread" },
  { key: "hn_post", label: "HN" },
  { key: "changelog", label: "Changelog" },
];

export default function ContentTabs({ data }) {
  const [active, setActive] = useState("reddit_post");
  if (!data) return null;

  return (
    <section className="card">
      <div className="card-header">06 · Generated Content</div>

      <div className="flex gap-1 border-b border-zinc-800 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-4 py-2 text-sm font-mono transition-colors border-b-2 -mb-px ${
              active === t.key
                ? "text-cyan-400 border-cyan-400"
                : "text-zinc-500 border-transparent hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-[200px]">
        {active === "reddit_post" && <RedditPreview post={data.reddit_post} />}
        {active === "x_thread" && <XPreview thread={data.x_thread} />}
        {active === "hn_post" && <HNPreview post={data.hn_post} />}
        {active === "changelog" && <ChangelogPreview log={data.changelog} />}
      </div>

      {data.guardrails && <Guardrails g={data.guardrails} />}
    </section>
  );
}

function RedditPreview({ post }) {
  if (!post) return null;
  return (
    <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2 font-mono">
        <span className="text-cyan-400">{post.target_subreddit}</span>
        {post.flair && <span className="pill bg-zinc-800">{post.flair}</span>}
      </div>
      <div className="font-semibold text-lg mb-3">{post.title}</div>
      <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{post.body}</div>
    </div>
  );
}

function XPreview({ thread }) {
  if (!thread) return null;
  return (
    <div className="space-y-3">
      {thread.tweets.map((t, i) => (
        <div key={i} className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-4 flex gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-mono text-zinc-500">
            {i + 1}
          </div>
          <div className="text-sm text-zinc-200">{t}</div>
        </div>
      ))}
      {thread.angle && (
        <div className="text-xs text-zinc-500 font-mono">
          Angle: {thread.angle} · Hook: {thread.hook_type}
        </div>
      )}
    </div>
  );
}

function HNPreview({ post }) {
  if (!post) return null;
  return (
    <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-4 font-mono text-sm">
      <div className="font-semibold text-base mb-3">{post.title}</div>
      <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{post.body}</div>
    </div>
  );
}

function ChangelogPreview({ log }) {
  if (!log) return null;
  return (
    <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-4">
      <div className="font-semibold mb-3">{log.title}</div>
      <ul className="space-y-2">
        {log.bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-sm text-zinc-300">
            <span className="text-cyan-400">•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Guardrails({ g }) {
  const checkIcon = (pass) => (pass ? "✅" : "⚠️");
  return (
    <div className="mt-5 pt-4 border-t border-zinc-800/60">
      <div className="text-xs text-zinc-500 font-mono mb-3">🛡️ Guardrails</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Check label="Claims sourced" pass={g.all_claims_sourced} />
        <Check label={`Tone · ${g.tone_check}`} pass={g.tone_check === "pass"} />
        <Check label={`Overclaim · ${g.overclaim_check}`} pass={g.overclaim_check === "pass"} />
        <Check label={`Quality · ${g.quality_score}`} pass={g.quality_score === "ready"} />
      </div>
      {g.flags && g.flags.length > 0 && (
        <div className="mt-3 space-y-1">
          {g.flags.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
              <span className="text-amber-400">⚠️</span>
              <span>
                <span className="font-mono text-amber-400">"{f.claim}"</span> — confidence{" "}
                {f.confidence} · {f.action}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Check({ label, pass }) {
  return (
    <div className={`flex items-center gap-2 ${pass ? "text-zinc-300" : "text-amber-400"}`}>
      <span>{pass ? "✅" : "⚠️"}</span>
      <span>{label}</span>
    </div>
  );
}
