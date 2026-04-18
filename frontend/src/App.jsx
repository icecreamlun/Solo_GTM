import { useState, useEffect } from "react";
import Header from "./components/Header.jsx";
import InputPanel from "./components/InputPanel.jsx";
import PipelineStatus from "./components/PipelineStatus.jsx";
import LaunchScore from "./components/LaunchScore.jsx";
import SignalPanel from "./components/SignalPanel.jsx";
import ContentTabs from "./components/ContentTabs.jsx";
import AudienceSim from "./components/AudienceSim.jsx";
import ActionPanel from "./components/ActionPanel.jsx";
import IterationBanner from "./components/IterationBanner.jsx";
import { MOCK } from "./mockData.js";

const STEPS = ["interpreter", "signal_scout", "content_engine", "audience_sim"];

const urlParams = new URLSearchParams(window.location.search);
const DEMO_MODE = urlParams.get("demo") === "true";

export default function App() {
  const [progress, setProgress] = useState({});
  const [data, setData] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIter, setSelectedIter] = useState(null); // null = view final

  useEffect(() => {
    if (DEMO_MODE) {
      loadFallback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runPipeline = async (input_text, input_type) => {
    setError(null);
    setIsRunning(true);
    setData(null);
    setProgress({});
    setSelectedIter(null);

    // Fake step-by-step reveal: mark each step running → done as it arrives
    // We only get one response from /api/launch, so we animate the reveal client-side
    // by staging results with short delays.

    try {
      const controller = new AbortController();
      const fetchPromise = fetch("/api/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_text, input_type }),
        signal: controller.signal,
      });

      // Visually progress first two steps while the backend chugs
      setProgress({ interpreter: "running" });
      await delay(600);
      setProgress({ interpreter: "running" });

      const resp = await fetchPromise;
      if (!resp.ok) throw new Error(`Backend returned ${resp.status}`);
      const full = await resp.json();

      // Stage the reveal so the pipeline UI feels alive
      await stageReveal(setProgress, setData, full);
    } catch (e) {
      setError(e.message);
      setProgress({});
    } finally {
      setIsRunning(false);
    }
  };

  const loadFallback = async () => {
    setError(null);
    setIsRunning(true);
    setData(null);
    setProgress({});
    setSelectedIter(null);
    try {
      const resp = await fetch("/api/fallback");
      if (!resp.ok) throw new Error("no fallback cached — run the pipeline once first");
      const full = await resp.json();
      await stageReveal(setProgress, setData, full);
    } catch (e) {
      // Fall through to client-side mock so the UI is never empty
      await stageReveal(setProgress, setData, MOCK);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <InputPanel onLaunch={runPipeline} isRunning={isRunning} />

        <div className="flex items-center justify-between">
          <div className="text-xs text-zinc-500 font-mono">
            {DEMO_MODE && "🎬 demo mode — showing cached Axolotl run"}
          </div>
          <button className="btn-ghost text-xs" onClick={loadFallback} disabled={isRunning}>
            🎬 Load cached Axolotl demo
          </button>
        </div>

        <PipelineStatus progress={progress} />

        {error && (
          <div className="card border-rose-500/40 bg-rose-500/10 text-rose-300">
            ⚠️ Pipeline failed: {error}
            <button className="btn-ghost ml-4 text-xs" onClick={loadFallback}>
              Load cached demo instead
            </button>
          </div>
        )}

        {data && (() => {
          const iters = data.iterations || [];
          const lastIdx = iters.length - 1;
          const activeIter = selectedIter ?? lastIdx;
          const displayContent =
            iters[activeIter]?.content_engine || data.content_engine;
          const displayAudience =
            iters[activeIter]?.audience_sim || data.audience_sim;
          const viewingFinal = activeIter === lastIdx || iters.length === 0;
          return (
            <>
              <LaunchScore data={data.interpreter} />
              <SignalPanel data={data.signal_scout} inputUrl={data.meta?.input} />
              {iters.length > 0 && (
                <IterationBanner
                  iterations={iters}
                  stopReason={data.meta?.stop_reason}
                  selectedIdx={activeIter}
                  onSelect={setSelectedIter}
                />
              )}
              {!viewingFinal && (
                <div className="text-xs text-amber-400 font-mono text-center -my-2">
                  ↓ showing draft v{iters[activeIter].iteration} — click v{iters.length} above to jump back to final
                </div>
              )}
              <ContentTabs data={displayContent} />
              <AudienceSim data={displayAudience} />
              <ActionPanel data={displayContent} onRegenerate={() => runPipeline(data.meta?.input || "", "github_url")} />
            </>
          );
        })()}
      </main>

      <footer className="max-w-5xl mx-auto px-6 text-center text-xs text-zinc-600 font-mono">
        GitHub helps you ship code. LaunchLayer helps you ship attention.
      </footer>
    </div>
  );
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function stageReveal(setProgress, setData, full) {
  // Immediate partial-state render keyed to each step, so the UI feels progressive
  setProgress({ interpreter: "running" });
  await delay(400);
  setProgress({ interpreter: "done", signal_scout: "running" });
  setData((d) => ({ ...(d || {}), interpreter: full.interpreter, meta: full.meta }));
  await delay(500);
  setProgress({ interpreter: "done", signal_scout: "done", content_engine: "running" });
  setData((d) => ({ ...d, signal_scout: full.signal_scout }));
  await delay(500);
  setProgress({
    interpreter: "done",
    signal_scout: "done",
    content_engine: "done",
    audience_sim: "running",
  });
  setData((d) => ({
    ...d,
    content_engine: full.content_engine,
    iterations: full.iterations,
  }));
  await delay(500);
  setProgress({
    interpreter: "done",
    signal_scout: "done",
    content_engine: "done",
    audience_sim: "done",
  });
  setData((d) => ({ ...d, audience_sim: full.audience_sim }));
}
