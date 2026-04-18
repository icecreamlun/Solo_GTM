import { useState } from "react";

export default function InputPanel({ onLaunch, isRunning }) {
  const [text, setText] = useState("https://github.com/Axolotl-QA/Axolotl");

  const submit = () => {
    if (!text.trim() || isRunning) return;
    const inputType = text.includes("github.com") ? "github_url" : "description";
    onLaunch(text, inputType);
  };

  return (
    <section className="card">
      <div className="card-header">01 · Input</div>
      <textarea
        className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 font-mono text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accent min-h-[96px] resize-none"
        placeholder="Paste a GitHub URL or describe your product update…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isRunning}
      />
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-zinc-500 font-mono">
          Demo tip: Axolotl repo works great
        </div>
        <button className="btn-primary" onClick={submit} disabled={isRunning}>
          {isRunning ? "Running pipeline…" : "🚀 Generate Launch Plan"}
        </button>
      </div>
    </section>
  );
}
