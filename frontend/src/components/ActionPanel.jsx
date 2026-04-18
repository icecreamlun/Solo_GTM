import { useState } from "react";

export default function ActionPanel({ data, onRegenerate }) {
  const [published, setPublished] = useState(false);
  if (!data) return null;
  const channels = [data.reddit_post?.target_subreddit, "𝕏", "Hacker News"].filter(Boolean);

  return (
    <section className="card">
      <div className="card-header">07 · Launch</div>
      {!published ? (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-zinc-300">Ready to launch to {channels.length} channels</div>
            <div className="text-xs text-zinc-500 mt-1 font-mono">
              {channels.join(" · ")}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost" onClick={onRegenerate}>
              🔄 Regenerate
            </button>
            <button className="btn-primary" onClick={() => setPublished(true)}>
              ✅ Approve & Launch
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-cyan-400 font-mono text-sm">✨ Launched</div>
          {channels.map((c) => (
            <div key={c} className="flex items-center gap-2 text-sm text-zinc-300">
              <span className="text-cyan-400">✅</span>
              <span>Published to {c}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
