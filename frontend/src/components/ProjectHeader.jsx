const REC_COLOR = {
  full_launch: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  soft_launch: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  skip: "text-rose-400 bg-rose-400/10 border-rose-400/30",
};

export default function ProjectHeader({ data, monitor }) {
  const interp = data?.interpreter;
  if (!interp) return null;
  const score = interp.launch_score?.overall;
  const rec = interp.launch_recommendation;
  const recCls = REC_COLOR[rec] || "text-zinc-400 bg-white/5 border-white/10";
  const snaps = monitor?.snapshots || [];
  const daysMonitored =
    snaps.length > 0
      ? Math.max(
          1,
          Math.floor(
            (Date.now() - new Date(snaps[0].timestamp).getTime()) / (86400 * 1000)
          )
        )
      : null;

  const audiences = interp.target_audiences || [];

  return (
    <div className="surface p-6 md:p-7 animate-fadeUp">
      <div className="flex items-start gap-5 flex-wrap">
        <img
          src="/axolotl-logo.png"
          alt="Axolotl"
          className="w-20 h-20 rounded-2xl bg-white object-contain p-1.5 shadow-card shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <span>{data?.meta?.input?.replace("https://github.com/", "")}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-softPulse" />
              live
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-1">
            {interp.product_name}
          </h1>
          <p className="text-zinc-400 mt-2 max-w-2xl leading-relaxed">
            {interp.what_it_does}
          </p>

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className={`pill border ${recCls}`}>
              {(rec || "").replace("_", " ")}
            </span>
            {interp.update_type && (
              <span className="pill border border-white/10 bg-white/5 text-zinc-300">
                {interp.update_type.replace("_", " ")}
              </span>
            )}
            {audiences.slice(0, 3).map((a) => (
              <span
                key={a}
                className="pill border border-white/5 bg-ink-800/60 text-zinc-400"
              >
                {a}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 min-w-[320px]">
          <Stat
            label="Launch Score"
            value={score != null ? score.toFixed(1) : "–"}
            suffix={<span className="text-xs text-zinc-500">/5</span>}
            accent
          />
          <Stat
            label="Monitoring"
            value={daysMonitored ? `${daysMonitored}d` : "–"}
            sub={snaps.length ? `${snaps.length} snapshots` : "not tracked"}
          />
          <Stat
            label="Signals"
            value={
              data?.signal_scout?._meta
                ? (data.signal_scout._meta.reddit_count ?? 0) +
                  (data.signal_scout._meta.twitter_count ?? 0) +
                  (data.signal_scout._meta.hn_count ?? 0)
                : "–"
            }
            sub="3 sources"
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, suffix, accent }) {
  return (
    <div className="surface-muted px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-medium">
        {label}
      </div>
      <div
        className={`mt-1 flex items-baseline gap-1 ${
          accent ? "text-brand-400" : "text-zinc-100"
        }`}
      >
        <span className="text-2xl font-semibold">{value}</span>
        {suffix}
      </div>
      {sub && <div className="text-[11px] text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  );
}
