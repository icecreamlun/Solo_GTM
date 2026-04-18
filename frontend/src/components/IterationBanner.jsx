import { useState } from "react";

const ENGAGEMENT_COLOR = {
  high: "text-brand-400",
  medium: "text-amber-400",
  low: "text-rose-400",
};
const ENGAGEMENT_BG = {
  high: "bg-brand-400/10 border-brand-400/40",
  medium: "bg-amber-400/10 border-amber-400/40",
  low: "bg-rose-400/10 border-rose-400/40",
};

export default function IterationBanner({
  iterations,
  stopReason,
  selectedIdx,
  onSelect,
}) {
  const [open, setOpen] = useState(true);
  if (!iterations || iterations.length === 0) return null;

  const n = iterations.length;
  const first = iterations[0];
  const last = iterations[n - 1];
  const active = selectedIdx ?? n - 1;

  const headline =
    n === 1
      ? `Converged on first try — engagement ${last.engagement}`
      : `Refined ${n - 1}× — engagement ${first.engagement} → ${last.engagement}`;

  return (
    <div className="bg-brand-400/5 border border-brand-400/30 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg">🔄</span>
          <div>
            <div className="text-brand-300 font-medium">Self-correction loop</div>
            <div className="text-xs text-zinc-400">{headline}</div>
          </div>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
          stop: {stopReason || "max iters"}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-zinc-500 font-mono mr-1">Viewing:</span>
        {iterations.map((it, idx) => {
          const isActive = idx === active;
          const isFinal = idx === n - 1;
          const label = `v${it.iteration}${isFinal ? " (final)" : " (draft)"}`;
          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={`text-xs font-mono px-2.5 py-1 rounded-md border transition ${
                isActive
                  ? `${ENGAGEMENT_BG[it.engagement] || "border-zinc-600 bg-zinc-800"} text-zinc-100`
                  : "border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              {label}
              <span className={`ml-1.5 ${ENGAGEMENT_COLOR[it.engagement] || ""}`}>
                · {it.engagement}
              </span>
            </button>
          );
        })}
        <button
          className="ml-auto text-xs text-brand-400 font-mono hover:text-brand-300"
          onClick={() => setOpen(!open)}
        >
          {open ? "hide history" : "show history"}
        </button>
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-brand-400/20 space-y-3">
          {iterations.map((it, idx) => {
            const title = it.content_engine?.reddit_post?.title || "(no title)";
            const synthesis = it.audience_sim?.synthesis || {};
            const changes = synthesis.recommended_changes || [];
            const isFinal = idx === n - 1;
            const isActive = idx === active;
            return (
              <div
                key={idx}
                onClick={() => onSelect(idx)}
                className={`cursor-pointer rounded-lg border p-3 transition ${
                  isActive
                    ? "border-brand-400/50 bg-zinc-900/60"
                    : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="font-mono text-zinc-500 text-xs mt-0.5 w-8">
                    v{it.iteration}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-200 italic truncate">
                      "{title}"
                    </div>
                    <div className="flex gap-3 mt-1 text-[11px] text-zinc-500 font-mono">
                      <span>
                        engagement:{" "}
                        <span className={ENGAGEMENT_COLOR[it.engagement] || ""}>
                          {it.engagement}
                        </span>
                      </span>
                      <span>
                        upvotes:{" "}
                        <span className={it.upvote_count === 3 ? "text-brand-400" : "text-zinc-400"}>
                          {it.upvote_count}/3
                        </span>
                      </span>
                    </div>

                    {!isFinal && changes.length > 0 && (
                      <div className="mt-2 pl-3 border-l-2 border-amber-400/40">
                        <div className="text-[10px] uppercase tracking-wider text-amber-400 font-mono mb-1">
                          Feedback that triggered revision
                        </div>
                        <ul className="space-y-0.5 text-xs text-zinc-400">
                          {changes.slice(0, 3).map((c, i) => (
                            <li key={i}>→ {c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {isFinal && (
                      <div className="mt-2 text-[11px] text-brand-400/80 font-mono">
                        ✓ converged — this is what gets published
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
