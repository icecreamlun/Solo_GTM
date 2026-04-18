import MonitorTimeline from "./MonitorTimeline.jsx";

function slugFromUrl(url) {
  const m = url?.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git|\/|$)/);
  return m ? `${m[1]}-${m[2]}` : null;
}

const FIT_COLOR = {
  high: "text-cyan-400 border-cyan-400/40 bg-cyan-400/10",
  medium: "text-amber-400 border-amber-400/40 bg-amber-400/10",
  low: "text-zinc-500 border-zinc-700 bg-zinc-800/40",
};

export default function SignalPanel({ data, inputUrl }) {
  if (!data) return null;
  const slug = slugFromUrl(inputUrl);
  const {
    trending_topics = [],
    community_pain_points = [],
    recommended_narrative,
    recommended_channels = [],
    competitive_angle,
    timing_insight,
    signal_confidence,
    key_data_points = [],
    _meta = {},
  } = data;

  const reddit = _meta.reddit_count ?? 0;
  const twitter = _meta.twitter_count ?? 0;
  const hn = _meta.hn_count ?? 0;

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="card-header mb-0">04 · Market Signals</div>
        <div className="text-[10px] uppercase tracking-wider text-cyan-400/70 font-mono">
          ⚡ Powered by Apify
        </div>
      </div>

      <div className="mb-5 p-3 bg-zinc-950/60 border border-cyan-400/20 rounded-lg text-sm font-mono text-zinc-400">
        📊 Apify scanned <span className="text-cyan-400">{reddit}</span> Reddit posts
        {twitter > 0 && (
          <>
            {" "}+ <span className="text-cyan-400">{twitter}</span> tweets
          </>
        )}
        {" "}+ <span className="text-cyan-400">{hn}</span> HN stories · confidence:{" "}
        <span className="text-cyan-400">{signal_confidence}</span>
      </div>

      <div className="space-y-4 text-sm">
        <Row icon="🔥" label="Trending" body={trending_topics.join(" · ")} />
        <Row icon="💡" label="Best angle" body={recommended_narrative} />
        <Row icon="⚔️" label="Competitive" body={competitive_angle} />
        <Row icon="⏰" label="Timing" body={timing_insight} />
        <Row icon="😤" label="Pain points" body={community_pain_points.join(" · ")} />
      </div>

      <div className="mt-5 pt-4 border-t border-zinc-800/60">
        <div className="text-xs text-zinc-500 font-mono mb-2">Recommended channels</div>
        <div className="flex gap-2 flex-wrap">
          {recommended_channels.map((c, i) => (
            <div
              key={i}
              className={`pill border ${FIT_COLOR[c.fit_score] || FIT_COLOR.low}`}
              title={c.reason}
            >
              {c.channel}
              <span className="text-[10px] opacity-70 ml-1">· {c.fit_score}</span>
            </div>
          ))}
        </div>
      </div>

      {key_data_points.length > 0 && (
        <div className="mt-5 pt-4 border-t border-zinc-800/60">
          <div className="text-xs text-zinc-500 font-mono mb-2">Key data points</div>
          <ul className="space-y-1 text-xs text-zinc-400">
            {key_data_points.map((d, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-cyan-400/70 font-mono">{d.source}</span>
                <span>{d.insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <MonitorTimeline slug={slug} />
    </section>
  );
}

function Row({ icon, label, body }) {
  if (!body) return null;
  return (
    <div className="flex gap-3">
      <div className="w-8 text-lg flex-shrink-0">{icon}</div>
      <div>
        <div className="text-xs font-mono text-zinc-500 mb-0.5">{label}</div>
        <div className="text-zinc-200">{body}</div>
      </div>
    </div>
  );
}
