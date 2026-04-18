export default function Header() {
  return (
    <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center font-mono font-bold text-zinc-950">
            L
          </div>
          <div>
            <div className="font-bold tracking-tight">LaunchLayer</div>
            <div className="text-xs text-zinc-500">Every product update deserves a launch</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Powered by Apify
          </span>
          <span className="text-zinc-700">·</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Minds AI
          </span>
        </div>
      </div>
    </header>
  );
}
