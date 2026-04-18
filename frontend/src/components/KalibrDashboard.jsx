// Kept in sync with backend/agents/_llm.py GOAL_PATHS.
const GOALS = [
  {
    key: "interpreter",
    goal: "launchlayer_interpret_product",
    name: "Interpret product",
    emoji: "🧠",
    paths: ["claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"],
    evalRule: "JSON parse success",
    evalBasis: "1.0 if valid schema, 0.0 otherwise",
  },
  {
    key: "signal_scout",
    goal: "launchlayer_synthesize_signals",
    name: "Synthesize signals",
    emoji: "📡",
    paths: ["claude-sonnet-4-5-20250929", "claude-opus-4-7"],
    evalRule: "JSON parse success",
    evalBasis: "1.0 if valid schema, 0.0 otherwise",
  },
  {
    key: "content_engine",
    goal: "launchlayer_generate_content",
    name: "Generate content",
    emoji: "✍️",
    paths: ["claude-sonnet-4-5-20250929", "claude-opus-4-7"],
    evalRule: "ground-truth engagement",
    evalBasis: "(engagement_rank×3 + upvotes) / 9",
    hasFeedback: true,
  },
  {
    key: "audience_sim",
    goal: "launchlayer_structure_personas",
    name: "Structure personas",
    emoji: "👥",
    paths: ["claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"],
    evalRule: "JSON parse success",
    evalBasis: "1.0 if 3 personas present, 0.0 otherwise",
  },
];

function shortModel(m) {
  return (m || "")
    .replace("claude-", "")
    .replace("-20250929", "")
    .replace("-20251001", "");
}

function scoreColor(s) {
  if (s == null) return "text-zinc-600";
  if (s >= 0.8) return "text-cyan-400";
  if (s >= 0.5) return "text-amber-400";
  return "text-rose-400";
}

export default function KalibrDashboard({ data }) {
  if (!data) return null;

  // Composite score from final audience (same formula as backend _score()).
  const audience = data.audience_sim;
  const engagement = audience?.synthesis?.predicted_engagement?.toLowerCase();
  const upvotes = (audience?.personas || []).filter((p) => p.would_upvote).length;
  const rankMap = { low: 0, medium: 1, high: 2 };
  const rank = rankMap[engagement] ?? 0;
  const compositeRaw = rank * 3 + upvotes;
  const compositeNorm = compositeRaw / 9;
  const personasOk = (audience?.personas || []).length === 3;

  const scoreFor = (key) => {
    if (key === "content_engine") return compositeNorm;
    if (key === "audience_sim") return personasOk ? 1.0 : 0.0;
    return data[key]?._kalibr?.trace_id ? 1.0 : null;
  };

  const iters = data.iterations || [];

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="card-header mb-0">03 · Kalibr evaluation</div>
        <div className="text-[10px] uppercase tracking-wider text-cyan-400/70 font-mono">
          ⚡ Outcome-aware routing
        </div>
      </div>

      <div className="overflow-x-auto -mx-6 md:mx-0">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono border-b border-zinc-800">
              <th className="text-left py-2 px-3">Goal</th>
              <th className="text-left py-2 px-3">Paths considered</th>
              <th className="text-left py-2 px-3">Chosen</th>
              <th className="text-left py-2 px-3">Eval rule</th>
              <th className="text-right py-2 px-3">Score</th>
              <th className="text-right py-2 px-3">Trace</th>
            </tr>
          </thead>
          <tbody>
            {GOALS.map((g) => {
              const kalibr = data[g.key]?._kalibr || {};
              const chosen = kalibr.model;
              const score = scoreFor(g.key);
              return (
                <tr
                  key={g.goal}
                  className="border-b border-zinc-800/50 align-top"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{g.emoji}</span>
                      <div>
                        <div className="text-zinc-200">{g.name}</div>
                        <div className="text-[10px] font-mono text-zinc-600">
                          {g.goal}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1 flex-wrap">
                      {g.paths.map((p) => {
                        const picked = p === chosen;
                        return (
                          <span
                            key={p}
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                              picked
                                ? "bg-cyan-400/10 border-cyan-400/40 text-cyan-300"
                                : "bg-zinc-900 border-zinc-800 text-zinc-500"
                            }`}
                          >
                            {shortModel(p)}
                            {picked && <span className="ml-0.5">✓</span>}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-cyan-300">
                    {shortModel(chosen) || "-"}
                  </td>
                  <td className="py-3 px-3 text-xs text-zinc-400">
                    {g.evalRule}
                    <div className="text-[10px] text-zinc-600 mt-0.5">
                      {g.evalBasis}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    <div className={scoreColor(score)}>
                      {score != null ? score.toFixed(2) : "–"}
                    </div>
                    {g.hasFeedback && score != null && (
                      <div className="text-[9px] text-cyan-400/70 mt-0.5">
                        ← fed back
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[10px] text-zinc-500">
                    {(kalibr.trace_id || "").slice(0, 8) || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {iters.length > 0 && (
        <div className="mt-4 text-[11px] font-mono text-zinc-400">
          <span className="text-zinc-500">Feedback trail ·</span>{" "}
          {iters.length} content_engine traces updated with final engagement score{" "}
          <span className="text-cyan-400">{compositeNorm.toFixed(2)}</span> (composite{" "}
          {compositeRaw}/9)
          {iters.map((it) => {
            const t = it.content_engine?._kalibr?.trace_id;
            return t ? (
              <span key={t} className="ml-2 text-zinc-600">
                · v{it.iteration}={String(t).slice(0, 6)}
              </span>
            ) : null;
          })}
        </div>
      )}

      <div className="mt-4 p-3 bg-cyan-400/5 border border-cyan-400/20 rounded-lg text-xs text-zinc-400">
        <div className="text-cyan-300 font-medium mb-1">How Kalibr learns</div>
        For each goal, Kalibr's Router picks between the candidate paths based on
        past outcomes. Parse-success goals (interpret / synthesize / structure)
        score <span className="font-mono">1.0</span> when valid JSON returns — a
        reliability signal that stops degraded models from being routed to.{" "}
        <span className="text-zinc-300">generate_content</span> is different:
        after the self-correction loop converges, we compute a composite score
        from the 3 Minds AI personas' actual reactions
        (<span className="font-mono">rank × 3 + upvotes / 9</span>) and call{" "}
        <span className="font-mono">update_outcome(trace_id, score)</span> on
        every iteration's content trace. Next launch, Kalibr routes to whichever
        Claude tier historically wrote content that personas actually upvoted —
        cross-session learning, not just within one run.
      </div>
    </section>
  );
}
