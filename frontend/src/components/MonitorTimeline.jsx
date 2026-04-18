import { useEffect, useState } from "react";

function formatRelative(iso) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatCountdown(secs) {
  if (secs <= 0) return "due now";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function monitoringDuration(snapshots) {
  if (!snapshots || snapshots.length === 0) return "";
  const first = new Date(snapshots[0].timestamp).getTime();
  const days = Math.floor((Date.now() - first) / (24 * 3600 * 1000));
  if (days >= 1) return `for ${days} day${days > 1 ? "s" : ""}`;
  const hours = Math.floor((Date.now() - first) / 3600000);
  return `for ${hours}h`;
}

function trendDelta(prevTopics = [], currTopics = []) {
  const prev = new Set(prevTopics.map((t) => t.toLowerCase()));
  const curr = new Set(currTopics.map((t) => t.toLowerCase()));
  const added = [...curr].filter((t) => !prev.has(t));
  const dropped = [...prev].filter((t) => !curr.has(t));
  return { added, dropped };
}

export default function MonitorTimeline({ slug }) {
  const [record, setRecord] = useState(null);
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/monitor/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setRecord)
      .catch(() => setRecord(null));
  }, [slug]);

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetch(`/api/monitor/refresh/${slug}`, { method: "POST" });
      const r = await fetch(`/api/monitor/${slug}`);
      if (r.ok) setRecord(await r.json());
    } finally {
      setRefreshing(false);
    }
  };

  if (!record) return null;
  const snaps = record.snapshots || [];
  if (snaps.length === 0) return null;
  const nextSecs = record.next_scrape_in_seconds ?? 0;
  const duration = monitoringDuration(snaps);

  return (
    <div className="mt-5 pt-4 border-t border-zinc-800/60">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs font-mono text-zinc-400 hover:text-zinc-200 transition"
      >
        <span className="flex items-center gap-2">
          <span className="text-base">📡</span>
          <span>
            Market Radar · monitoring {duration} · {snaps.length} snapshots
          </span>
        </span>
        <span className="flex items-center gap-3">
          <span className="text-cyan-400/80">next scrape in {formatCountdown(nextSecs)}</span>
          <span>{open ? "▼" : "▶"}</span>
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
              Every {record.interval_hours}h · auto-refresh running
            </div>
            <button
              onClick={refresh}
              disabled={refreshing}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
            >
              {refreshing ? "scraping…" : "↻ refresh now"}
            </button>
          </div>

          <div className="space-y-2">
            {snaps
              .slice()
              .reverse()
              .map((snap, i) => {
                const realIdx = snaps.length - 1 - i;
                const prev = realIdx > 0 ? snaps[realIdx - 1] : null;
                const topics = snap.signal_scout?.trending_topics || [];
                const delta = prev
                  ? trendDelta(
                      prev.signal_scout?.trending_topics,
                      topics
                    )
                  : { added: [], dropped: [] };
                const meta = snap.signal_scout?._meta || {};
                const confidence = snap.signal_scout?.signal_confidence;
                const isNewest = realIdx === snaps.length - 1;
                return (
                  <div
                    key={snap.timestamp}
                    className={`rounded-lg border p-3 ${
                      isNewest
                        ? "border-cyan-400/30 bg-cyan-400/5"
                        : "border-zinc-800 bg-zinc-900/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-zinc-500">
                          {formatRelative(snap.timestamp)}
                        </span>
                        {isNewest && (
                          <span className="text-[10px] uppercase tracking-wider text-cyan-400">
                            latest
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                        <span>R:{meta.reddit_count ?? 0}</span>
                        <span>X:{meta.twitter_count ?? 0}</span>
                        <span>HN:{meta.hn_count ?? 0}</span>
                        <span
                          className={
                            confidence === "high"
                              ? "text-cyan-400"
                              : confidence === "medium"
                              ? "text-amber-400"
                              : "text-zinc-500"
                          }
                        >
                          · {confidence}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-zinc-300">
                      {topics[0] || "(no trending topic)"}
                    </div>

                    {(delta.added.length > 0 || delta.dropped.length > 0) && (
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-mono">
                        {delta.added.map((t, j) => (
                          <span
                            key={`a${j}`}
                            className="text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded"
                          >
                            🆕 {t}
                          </span>
                        ))}
                        {delta.dropped.map((t, j) => (
                          <span
                            key={`d${j}`}
                            className="text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded line-through"
                          >
                            ✗ {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
