import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar.jsx";
import ProjectHeader from "./components/ProjectHeader.jsx";
import PipelineStatus from "./components/PipelineStatus.jsx";
import LaunchScore from "./components/LaunchScore.jsx";
import SignalPanel from "./components/SignalPanel.jsx";
import ContentTabs from "./components/ContentTabs.jsx";
import AudienceSim from "./components/AudienceSim.jsx";
import ActionPanel from "./components/ActionPanel.jsx";
import IterationBanner from "./components/IterationBanner.jsx";
import KalibrDashboard from "./components/KalibrDashboard.jsx";
import { MOCK } from "./mockData.js";

const STEPS = ["interpreter", "signal_scout", "content_engine", "audience_sim"];

const urlParams = new URLSearchParams(window.location.search);
const DEMO_MODE = urlParams.get("demo") === "true";

function slugFromUrl(url) {
  const m = url?.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git|\/|$)/);
  return m ? { owner: m[1], repo: m[2], slug: `${m[1]}-${m[2]}` } : null;
}

export default function App() {
  const [view, setView] = useState("overview");
  const [progress, setProgress] = useState({});
  const [data, setData] = useState(null);
  const [monitor, setMonitor] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIter, setSelectedIter] = useState(null);

  useEffect(() => {
    if (DEMO_MODE) loadFallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!data?.meta?.input) return;
    const p = slugFromUrl(data.meta.input);
    if (!p) return;
    fetch(`/api/monitor/${p.slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setMonitor)
      .catch(() => setMonitor(null));
  }, [data?.meta?.input]);

  const runPipeline = async (input_text, input_type) => {
    setError(null);
    setIsRunning(true);
    setData(null);
    setProgress({});
    setSelectedIter(null);
    try {
      const resp = await fetch("/api/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_text, input_type }),
      });
      if (!resp.ok) throw new Error(`Backend returned ${resp.status}`);
      const full = await resp.json();
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
      if (!resp.ok) throw new Error("no fallback cached");
      const full = await resp.json();
      await stageReveal(setProgress, setData, full);
    } catch (e) {
      await stageReveal(setProgress, setData, MOCK);
    } finally {
      setIsRunning(false);
    }
  };

  const project = data?.meta?.input ? slugFromUrl(data.meta.input) : null;
  const projectForSidebar = project && data?.interpreter
    ? { name: data.interpreter.product_name, ...project }
    : null;

  // Resolve which iteration to display
  const iters = data?.iterations || [];
  const lastIdx = iters.length - 1;
  const activeIter = selectedIter ?? lastIdx;
  const displayContent = iters[activeIter]?.content_engine || data?.content_engine;
  const displayAudience = iters[activeIter]?.audience_sim || data?.audience_sim;
  const viewingFinal = activeIter === lastIdx || iters.length === 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar view={view} onView={setView} project={projectForSidebar} />

      <main className="flex-1 min-w-0">
        <Topbar
          isRunning={isRunning}
          hasData={!!data}
          onRunDemo={loadFallback}
          onRun={runPipeline}
        />

        <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
          {error && (
            <div className="surface p-5 border-rose-500/40 bg-rose-500/10 text-rose-200 flex items-center justify-between">
              <span>⚠ Pipeline failed: {error}</span>
              <button className="btn-ghost text-xs" onClick={loadFallback}>
                Load cached demo
              </button>
            </div>
          )}

          {!data && !isRunning && !error && <EmptyState onLoad={loadFallback} />}

          {data && (
            <>
              {view === "overview" && (
                <OverviewView
                  data={data}
                  monitor={monitor}
                  progress={progress}
                  onGoto={setView}
                />
              )}
              {view === "signals" && (
                <SignalsView
                  data={data}
                  inputUrl={data.meta?.input}
                  monitor={monitor}
                />
              )}
              {view === "content" && (
                <ContentView
                  data={data}
                  iters={iters}
                  activeIter={activeIter}
                  onSelectIter={setSelectedIter}
                  viewingFinal={viewingFinal}
                  displayContent={displayContent}
                />
              )}
              {view === "audience" && <AudienceView data={displayAudience} />}
              {view === "launch" && (
                <LaunchView
                  data={displayContent}
                  onRegenerate={() =>
                    runPipeline(data.meta?.input || "", "github_url")
                  }
                />
              )}
              {view === "routing" && (
                <RoutingView data={data} progress={progress} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Topbar({ isRunning, hasData, onRunDemo, onRun }) {
  const [input, setInput] = useState("https://github.com/Axolotl-QA/Axolotl");
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-0 z-20 backdrop-blur-md bg-ink-950/70 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-8 py-3 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 text-xs text-zinc-500 font-mono">
          {hasData ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-softPulse" />
              <span>Pipeline ready · cached demo</span>
            </>
          ) : isRunning ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-softPulse" />
              <span>Running pipeline…</span>
            </>
          ) : (
            <span className="text-zinc-600">No launch yet</span>
          )}
        </div>

        <button onClick={onRunDemo} className="btn-ghost text-xs" disabled={isRunning}>
          Load demo
        </button>
        <button
          onClick={() => setOpen(!open)}
          className="btn-primary text-sm"
          disabled={isRunning}
        >
          + New launch
        </button>
      </div>
      {open && (
        <div className="max-w-6xl mx-auto px-8 pb-4">
          <div className="surface p-4 flex items-center gap-2">
            <input
              className="flex-1 bg-ink-950/60 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-zinc-200 focus:outline-none focus:border-brand-500"
              placeholder="Paste a GitHub URL…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              onClick={() => {
                setOpen(false);
                onRun(input, input.includes("github.com") ? "github_url" : "description");
              }}
              className="btn-primary text-sm"
              disabled={!input.trim()}
            >
              Generate
            </button>
            <button onClick={() => setOpen(false)} className="btn-ghost text-sm">
              Cancel
            </button>
          </div>
          <p className="text-[11px] text-zinc-500 font-mono mt-2">
            Live pipeline takes ~3 min. Use Load demo for a cached run.
          </p>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onLoad }) {
  return (
    <div className="surface p-12 text-center animate-fadeUp">
      <div className="text-5xl mb-4">🚀</div>
      <h2 className="text-2xl font-semibold">Every push is a launch, waiting to happen.</h2>
      <p className="text-zinc-400 mt-2 max-w-md mx-auto">
        Paste a GitHub URL. Repocket scores the launch, scrapes real market signals,
        drafts multi-channel copy, and tests it on AI personas before you publish.
      </p>
      <button onClick={onLoad} className="btn-primary mt-6 mx-auto">
        See the Axolotl demo
      </button>
    </div>
  );
}

// ──── Views ──────────────────────────────────────────────────────

function OverviewView({ data, monitor, progress, onGoto }) {
  const iters = data.iterations || [];
  const engagement = iters[iters.length - 1]?.audience_sim?.synthesis?.predicted_engagement;

  return (
    <div className="space-y-6 animate-fadeUp">
      <ProjectHeader data={data} monitor={monitor} />
      <PipelineStatus progress={progress} data={data} />

      <div className="grid md:grid-cols-3 gap-4">
        <OverviewTile
          title="Market radar"
          badge={monitor?.snapshots ? `${monitor.snapshots.length} snapshots` : "not tracked"}
          body={
            data?.signal_scout?.recommended_narrative || "—"
          }
          footer={`Next refresh in ${
            monitor ? formatCountdown(monitor.next_scrape_in_seconds) : "—"
          }`}
          onClick={() => onGoto("signals")}
        />
        <OverviewTile
          title="Content draft"
          badge={`v${iters.length}${iters.length > 1 ? " · converged" : ""}`}
          body={data?.content_engine?.reddit_post?.title || "—"}
          footer={`Quality ${data?.content_engine?.guardrails?.quality_score || "—"}`}
          onClick={() => onGoto("content")}
        />
        <OverviewTile
          title="Audience reaction"
          badge={engagement ? engagement : "—"}
          body={
            iters[iters.length - 1]?.audience_sim?.synthesis?.strongest_point ||
            data?.audience_sim?.synthesis?.strongest_point ||
            "—"
          }
          footer={`${
            (data?.audience_sim?.personas || []).filter((p) => p.would_upvote).length
          }/3 would upvote`}
          onClick={() => onGoto("audience")}
        />
      </div>
    </div>
  );
}

function OverviewTile({ title, badge, body, footer, onClick }) {
  return (
    <button
      onClick={onClick}
      className="surface p-5 text-left hover:border-brand-500/30 transition group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="eyebrow">{title}</div>
        <div className="pill bg-brand-500/10 border border-brand-500/20 text-brand-400">
          {badge}
        </div>
      </div>
      <p className="text-sm text-zinc-200 line-clamp-3 leading-relaxed">{body}</p>
      <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
        <span>{footer}</span>
        <span className="text-brand-400 opacity-0 group-hover:opacity-100 transition">
          open →
        </span>
      </div>
    </button>
  );
}

function SignalsView({ data, inputUrl, monitor }) {
  return (
    <div className="space-y-6 animate-fadeUp">
      <ViewHeader
        title="Market Signals"
        sub="Real-time scraped from Reddit · Twitter · Hacker News. Powered by Apify."
      />
      <SignalPanel data={data.signal_scout} inputUrl={inputUrl} />
    </div>
  );
}

function ContentView({ data, iters, activeIter, onSelectIter, viewingFinal, displayContent }) {
  return (
    <div className="space-y-6 animate-fadeUp">
      <ViewHeader
        title="Content"
        sub="Dev-native multi-channel copy with source-attributed guardrails."
      />
      {iters.length > 0 && (
        <IterationBanner
          iterations={iters}
          stopReason={data.meta?.stop_reason}
          selectedIdx={activeIter}
          onSelect={onSelectIter}
        />
      )}
      {!viewingFinal && (
        <div className="text-xs text-amber-400 font-mono">
          ↓ showing draft v{iters[activeIter].iteration} — click v{iters.length} above to jump back to final
        </div>
      )}
      <ContentTabs data={displayContent} />
    </div>
  );
}

function AudienceView({ data }) {
  return (
    <div className="space-y-6 animate-fadeUp">
      <ViewHeader
        title="Audience Simulation"
        sub="Three real Minds AI sparks review your draft in parallel before it ships."
      />
      <AudienceSim data={data} />
    </div>
  );
}

function LaunchView({ data, onRegenerate }) {
  return (
    <div className="space-y-6 animate-fadeUp">
      <ViewHeader
        title="Launch"
        sub="Everything is source-attributed and persona-tested. One click to publish."
      />
      <ActionPanel data={data} onRegenerate={onRegenerate} />
    </div>
  );
}

function RoutingView({ data, progress }) {
  return (
    <div className="space-y-6 animate-fadeUp">
      <ViewHeader
        title="Routing & Eval"
        sub="Outcome-aware routing via Kalibr. Every run's real audience engagement trains the router."
      />
      <KalibrDashboard data={data} />
      <PipelineStatus progress={progress} data={data} />
    </div>
  );
}

function ViewHeader({ title, sub }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {sub && <p className="text-sm text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

function formatCountdown(secs) {
  if (secs == null) return "—";
  if (secs <= 0) return "due now";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function stageReveal(setProgress, setData, full) {
  setProgress({ interpreter: "running" });
  await delay(400);
  setProgress({ interpreter: "done", signal_scout: "running" });
  setData((d) => ({ ...(d || {}), interpreter: full.interpreter, meta: full.meta }));
  await delay(400);
  setProgress({ interpreter: "done", signal_scout: "done", content_engine: "running" });
  setData((d) => ({ ...d, signal_scout: full.signal_scout }));
  await delay(400);
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
  await delay(400);
  setProgress({
    interpreter: "done",
    signal_scout: "done",
    content_engine: "done",
    audience_sim: "done",
  });
  setData((d) => ({ ...d, audience_sim: full.audience_sim }));
}
