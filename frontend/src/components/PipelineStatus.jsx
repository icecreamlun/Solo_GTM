import { useEffect, useState } from "react";

function fmt(t) {
  if (t == null) return null;
  if (t < 60) return `${t.toFixed(1)}s`;
  const m = Math.floor(t / 60);
  const s = Math.round(t - m * 60);
  return `${m}m ${s}s`;
}

function dotClass(status) {
  if (status === "done") return "bg-cyan-400 border-cyan-400 text-zinc-950";
  if (status === "running") return "bg-cyan-400/20 border-cyan-400 text-cyan-300 animate-pulseRing";
  return "bg-zinc-900 border-zinc-800 text-zinc-600";
}

function cardClass(status) {
  if (status === "done") return "border-cyan-400/25 bg-zinc-900/60";
  if (status === "running") return "border-cyan-400/40 bg-cyan-400/5";
  return "border-zinc-800 bg-zinc-900/30 opacity-60";
}

export default function PipelineStatus({ progress, data }) {
  const timings = data?.meta?.timings || {};
  const interp = data?.interpreter;
  const signals = data?.signal_scout;
  const sMeta = signals?._meta || {};
  const content = data?.content_engine;
  const audience = data?.audience_sim;
  const engagement = audience?.synthesis?.predicted_engagement;
  const upvotes = (audience?.personas || []).filter((p) => p.would_upvote).length;
  const iterCount = data?.meta?.iteration_count;
  const stopReason = data?.meta?.stop_reason;
  const iters = data?.iterations || [];

  const steps = [
    {
      key: "interpreter",
      num: "1",
      emoji: "🧠",
      label: "Interpret",
      subs: [
        "GitHub API · 10 commits + 5K README",
        "Claude → structured JSON",
      ],
      outcome: interp && `Launch Score ${interp.launch_score?.overall ?? "?"} · ${interp.launch_recommendation?.replace("_", " ") ?? ""}`,
      kalibr: interp?._kalibr,
    },
    {
      key: "signal_scout",
      num: "2",
      emoji: "📡",
      label: "Signals",
      badge: "Apify",
      subs: [
        `Reddit scraper · ${sMeta.reddit_count ?? "…"} posts`,
        `Twitter scraper · ${sMeta.twitter_count ?? "…"} tweets`,
        `HN Algolia · ${sMeta.hn_count ?? "…"} stories`,
        "Claude synthesis across sources",
      ],
      outcome: signals && `${(sMeta.reddit_count ?? 0) + (sMeta.twitter_count ?? 0) + (sMeta.hn_count ?? 0)} data points · confidence ${signals.signal_confidence}`,
      kalibr: signals?._kalibr,
    },
    {
      key: "content_engine",
      num: "3",
      emoji: "✍️",
      label: "Content",
      subs: [
        "4 channels · X / Reddit / HN / Changelog",
        "Guardrails · source attribution + overclaim",
      ],
      outcome: content && `quality ${content.guardrails?.quality_score} · ${content.guardrails?.flags?.length ?? 0} flags`,
      kalibr: content?._kalibr,
      kalibrHint: "trained by final engagement score",
    },
    {
      key: "audience_sim",
      num: "4",
      emoji: "👥",
      label: "Simulate",
      badge: "Minds AI",
      subs: [
        "3 sparks asked in parallel",
        "Claude structures sentiment + suggestions",
      ],
      outcome: audience && `engagement ${engagement} · ${upvotes}/3 would upvote`,
      kalibr: audience?._kalibr,
    },
  ];

  const anyRunning = Object.values(progress || {}).some((v) => v === "running");

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="card-header mb-0">02 · Pipeline</div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] uppercase tracking-wider text-cyan-400/70 font-mono">
            ⚡ Kalibr · outcome-aware routing
          </div>
          {data?.meta?.timings && (
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
              total {fmt(Object.values(timings).reduce((a, b) => a + (b || 0), 0))}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        {steps.map((s) => {
          const status = progress?.[s.key] || "pending";
          const t = timings[s.key];
          return (
            <div
              key={s.key}
              className={`rounded-xl border p-3 transition ${cardClass(status)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-mono font-bold transition ${dotClass(status)}`}
                >
                  {status === "done" ? "✓" : s.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-100 flex items-center gap-1.5">
                    <span>{s.emoji}</span>
                    <span>{s.label}</span>
                  </div>
                  {s.badge && (
                    <div className="text-[9px] uppercase tracking-wider text-cyan-400/70 font-mono">
                      ⚡ {s.badge}
                    </div>
                  )}
                </div>
                {t != null && (
                  <div className="text-[10px] font-mono text-zinc-500">
                    {fmt(t)}
                  </div>
                )}
              </div>

              <ul className="space-y-1 text-[11px] text-zinc-400">
                {s.subs.map((sub, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-cyan-400/50 flex-shrink-0">·</span>
                    <span>{sub}</span>
                  </li>
                ))}
              </ul>

              {s.outcome && status === "done" && (
                <div className="mt-2 pt-2 border-t border-zinc-800/60 text-[11px] text-cyan-300 font-mono">
                  → {s.outcome}
                </div>
              )}
              {status === "running" && (
                <div className="mt-2 pt-2 border-t border-zinc-800/60 text-[11px] text-cyan-400 font-mono animate-pulse">
                  running…
                </div>
              )}
              {s.kalibr && status === "done" && (
                <div className="mt-1.5 text-[10px] text-zinc-600 font-mono">
                  via{" "}
                  <span className="text-zinc-400">
                    {(s.kalibr.model || "").replace("claude-", "").replace("-20250929", "").replace("-20251001", "")}
                  </span>{" "}
                  · trace {String(s.kalibr.trace_id || "").slice(0, 8)}
                  {s.kalibrHint && (
                    <div className="text-cyan-400/70 mt-0.5">
                      ↪ {s.kalibrHint}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {iters.length > 0 && (
        <div className="mt-4 p-3 rounded-lg border border-cyan-400/20 bg-cyan-400/5">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 flex-wrap">
            <span>🔄</span>
            <span className="text-zinc-400">
              Self-correction loop · steps 3 + 4 retried with audience feedback
            </span>
            <span className="text-cyan-400/60">·</span>
            <span>
              {iters
                .map((it) => `v${it.iteration} (${it.engagement}, ${it.upvote_count}/3)`)
                .join(" → ")}
            </span>
            {stopReason && (
              <>
                <span className="text-cyan-400/60">·</span>
                <span className="text-zinc-500">stop: {stopReason}</span>
              </>
            )}
          </div>
        </div>
      )}

      <MonitorStrip slug={data?.meta?.input && slugFromUrl(data.meta.input)} />
    </section>
  );
}

function slugFromUrl(url) {
  const m = url?.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git|\/|$)/);
  return m ? `${m[1]}-${m[2]}` : null;
}

function MonitorStrip({ slug }) {
  const [record, setRecord] = useState(null);
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/monitor/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setRecord)
      .catch(() => setRecord(null));
  }, [slug]);
  if (!record) return null;
  const snaps = record.snapshots || [];
  if (snaps.length === 0) return null;

  const first = new Date(snaps[0].timestamp).getTime();
  const days = Math.floor((Date.now() - first) / (24 * 3600 * 1000));
  const hours = Math.floor((Date.now() - first) / 3600000);
  const dur = days >= 1 ? `${days}d` : `${hours}h`;
  const nextSecs = record.next_scrape_in_seconds ?? 0;
  const nextH = Math.floor(nextSecs / 3600);
  const nextM = Math.floor((nextSecs % 3600) / 60);
  const nextLabel = nextH > 0 ? `${nextH}h ${nextM}m` : `${nextM}m`;

  return (
    <div className="mt-3 p-3 rounded-lg border border-zinc-800 bg-zinc-950/60">
      <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 flex-wrap">
        <span>📡</span>
        <span>
          Market Radar · step 2 runs every {record.interval_hours}h in the background
        </span>
        <span className="text-zinc-700">·</span>
        <span className="text-cyan-400/80">
          monitoring for {dur} · {snaps.length} snapshots
        </span>
        <span className="text-zinc-700">·</span>
        <span className="text-cyan-400/80">next in {nextLabel}</span>
      </div>
    </div>
  );
}
