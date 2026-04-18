const STEPS = [
  { key: "interpreter", label: "Interpret", emoji: "🧠" },
  { key: "signal_scout", label: "Signals", emoji: "📡", badge: "Apify" },
  { key: "content_engine", label: "Content", emoji: "✍️" },
  { key: "audience_sim", label: "Simulate", emoji: "👥", badge: "Minds AI" },
];

export default function PipelineStatus({ progress }) {
  // progress: { interpreter: "pending|running|done", ... }
  return (
    <section className="card">
      <div className="card-header">02 · Pipeline</div>
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const status = progress[s.key] || "pending";
          const isDone = status === "done";
          const isRunning = status === "running";
          const dotColor = isDone
            ? "bg-cyan-400 border-cyan-400"
            : isRunning
            ? "bg-cyan-400/20 border-cyan-400 animate-pulseRing"
            : "bg-zinc-900 border-zinc-700";
          const textColor = isDone || isRunning ? "text-zinc-100" : "text-zinc-600";
          return (
            <div key={s.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${dotColor}`}
                >
                  <span className="text-base">{isDone ? "✓" : s.emoji}</span>
                </div>
                <div className={`text-xs font-mono ${textColor}`}>{s.label}</div>
                {s.badge && (
                  <div className="text-[10px] uppercase tracking-wider text-cyan-400/70 font-mono">
                    {s.badge}
                  </div>
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-colors ${
                    isDone ? "bg-cyan-400/60" : "bg-zinc-800"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
