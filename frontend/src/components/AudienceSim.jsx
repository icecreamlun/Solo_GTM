const SENTIMENT_COLOR = {
  positive: "text-cyan-400",
  neutral: "text-zinc-400",
  negative: "text-rose-400",
};

const ENGAGEMENT_COLOR = {
  high: "text-cyan-400",
  medium: "text-amber-400",
  low: "text-rose-400",
};

export default function AudienceSim({ data }) {
  if (!data) return null;
  const { personas = [], synthesis = {}, _meta = {} } = data;
  const sparkIds = _meta.spark_ids || {};
  const panelId = _meta.panel_id;

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="card-header mb-0">06 · Audience Simulation</div>
        <div className="text-[10px] uppercase tracking-wider text-cyan-400/70 font-mono">
          🧠 Powered by Minds AI
        </div>
      </div>

      {(panelId || Object.keys(sparkIds).length > 0) && (
        <div className="mb-5 p-3 bg-zinc-950/60 border border-cyan-400/20 rounded-lg text-xs font-mono text-zinc-400">
          🔗 Panel <span className="text-cyan-400">{panelId}…</span> ·{" "}
          {Object.keys(sparkIds).length} Minds sparks answered in parallel
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {Object.entries(sparkIds).map(([name, id]) => (
              <span key={name} className="pill bg-zinc-900 text-zinc-500">
                <span className="text-zinc-400">{name}</span>·{id}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {personas.map((p, i) => (
          <div key={i} className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl">{p.emoji}</div>
              <div className="flex-1">
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-zinc-500">{p.role}</div>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className={SENTIMENT_COLOR[p.sentiment]}>
                  {p.sentiment}
                </span>
                <span className="text-zinc-700">·</span>
                <span className={p.would_upvote ? "text-cyan-400" : "text-zinc-500"}>
                  {p.would_upvote ? "↑ upvote" : "— skip"}
                </span>
              </div>
            </div>

            <blockquote className="border-l-2 border-cyan-400/40 pl-3 text-zinc-200 italic mb-3">
              "{p.comment}"
            </blockquote>

            <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-xs">
              <div className="text-zinc-500 font-mono">Concern</div>
              <div className="text-zinc-400">{p.key_concern}</div>
              <div className="text-cyan-400/80 font-mono">💡 Fix</div>
              <div className="text-zinc-300">{p.suggestion}</div>
            </div>
          </div>
        ))}
      </div>

      {synthesis && (
        <div className="mt-5 pt-4 border-t border-zinc-800/60">
          <div className="text-xs text-zinc-500 font-mono mb-3">📈 Synthesis</div>
          <div className="space-y-2 text-sm">
            <Row label="Predicted engagement">
              <span className={`font-mono ${ENGAGEMENT_COLOR[synthesis.predicted_engagement] || ""}`}>
                {synthesis.predicted_engagement}
              </span>
            </Row>
            <Row label="Strongest">{synthesis.strongest_point}</Row>
            <Row label="Weakest">{synthesis.biggest_weakness}</Row>
            {synthesis.recommended_changes && (
              <Row label="Recommended">
                <ul className="space-y-1">
                  {synthesis.recommended_changes.map((c, i) => (
                    <li key={i}>→ {c}</li>
                  ))}
                </ul>
              </Row>
            )}
            {synthesis.optimized_title_suggestion && (
              <Row label="Better title">
                <span className="text-cyan-400 font-mono text-xs">
                  "{synthesis.optimized_title_suggestion}"
                </span>
              </Row>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[140px,1fr] gap-3 items-start">
      <div className="text-zinc-500 font-mono text-xs pt-0.5">{label}</div>
      <div className="text-zinc-300">{children}</div>
    </div>
  );
}
