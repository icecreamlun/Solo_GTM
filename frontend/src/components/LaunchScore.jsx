const DIMENSIONS = [
  { key: "novelty", label: "Novelty" },
  { key: "user_impact", label: "User Impact" },
  { key: "shareability", label: "Shareability" },
  { key: "timing_relevance", label: "Timing" },
];

const REC_STYLE = {
  full_launch: { label: "FULL LAUNCH RECOMMENDED", color: "text-cyan-400" },
  soft_launch: { label: "SOFT LAUNCH SUGGESTED", color: "text-amber-400" },
  skip: { label: "SKIP — NOT READY", color: "text-rose-400" },
};

export default function LaunchScore({ data }) {
  if (!data) return null;
  const { launch_score = {}, launch_recommendation, product_name, update_summary, update_type, target_audiences = [] } = data;
  const overall = launch_score.overall ?? 0;
  const rec = REC_STYLE[launch_recommendation] || { label: (launch_recommendation || "").toUpperCase(), color: "text-zinc-400" };

  return (
    <section className="card">
      <div className="card-header">04 · Launch Score</div>
      <div className="grid md:grid-cols-[auto,1fr] gap-6 items-center">
        <div className="flex flex-col items-center">
          <div className="text-5xl font-bold font-mono">
            {overall.toFixed(1)}
            <span className="text-lg text-zinc-600">/5.0</span>
          </div>
          <div className="mt-2 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={i <= Math.round(overall) ? "text-cyan-400" : "text-zinc-700"}>
                ★
              </span>
            ))}
          </div>
          <div className={`mt-3 text-xs font-mono tracking-wider ${rec.color}`}>{rec.label}</div>
        </div>

        <div className="space-y-2">
          {DIMENSIONS.map((d) => {
            const val = launch_score[d.key] ?? 0;
            return (
              <div key={d.key} className="flex items-center gap-3 text-sm">
                <div className="w-24 text-zinc-500">{d.label}</div>
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all"
                    style={{ width: `${(val / 5) * 100}%` }}
                  />
                </div>
                <div className="w-8 text-right font-mono text-zinc-300">{val}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-zinc-800/60 space-y-1.5 text-sm">
        <div>
          <span className="text-zinc-500 font-mono text-xs mr-2">Product</span>
          <span className="font-medium">{product_name}</span>
        </div>
        <div>
          <span className="text-zinc-500 font-mono text-xs mr-2">Update</span>
          <span className="text-zinc-300">{update_summary}</span>
        </div>
        <div>
          <span className="text-zinc-500 font-mono text-xs mr-2">Type</span>
          <span className="pill bg-zinc-800 text-zinc-300">{update_type}</span>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-zinc-500 font-mono text-xs">Audiences</span>
          {target_audiences.map((a) => (
            <span key={a} className="pill bg-zinc-800/60 text-zinc-400 border border-zinc-800">
              {a}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
