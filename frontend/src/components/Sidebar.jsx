const NAV = [
  { key: "overview", label: "Overview", icon: OverviewIcon },
  { key: "signals", label: "Market Signals", icon: SignalIcon },
  { key: "content", label: "Content", icon: ContentIcon },
  { key: "audience", label: "Audience", icon: AudienceIcon },
  { key: "launch", label: "Launch", icon: LaunchIcon },
  { key: "routing", label: "Routing & Eval", icon: RoutingIcon },
];

export default function Sidebar({ view, onView, project }) {
  return (
    <aside className="w-64 shrink-0 border-r border-white/5 bg-ink-950/80 backdrop-blur-sm flex flex-col h-screen sticky top-0">
      <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center font-bold text-white shadow-pop">
          R
        </div>
        <div>
          <div className="font-semibold text-zinc-100 leading-none tracking-tight">
            Repocket
          </div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-[0.18em] mt-1">
            repo · launch OS
          </div>
        </div>
      </div>

      <div className="divider mx-4" />

      <div className="px-3 pb-1 pt-3">
        <div className="eyebrow px-2 mb-2">Project</div>
        {project ? (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white/5 border border-white/10">
            <img
              src="/axolotl-logo.png"
              alt="Axolotl"
              className="w-8 h-8 rounded-md object-contain bg-white/90 p-0.5"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm text-zinc-100 truncate font-medium">
                {project.name}
              </div>
              <div className="text-[10px] text-zinc-500 truncate font-mono">
                {project.owner}/{project.repo}
              </div>
            </div>
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-softPulse"
              title="monitoring active"
            />
          </div>
        ) : (
          <div className="text-xs text-zinc-600 px-2.5">No project</div>
        )}
      </div>

      <div className="px-3 pt-6">
        <div className="eyebrow px-2 mb-2">Workspace</div>
        <nav className="space-y-0.5">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = n.key === view;
            return (
              <button
                key={n.key}
                onClick={() => onView(n.key)}
                className={`w-full text-left ${active ? "nav-item nav-item-active" : "nav-item"}`}
              >
                <Icon className="w-4 h-4" />
                <span>{n.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1" />

      <div className="px-4 pb-5 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
            Apify
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
            Minds AI
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
            Kalibr
          </span>
        </div>
      </div>
    </aside>
  );
}

function OverviewIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="6" height="6" rx="1.5" />
      <rect x="11" y="3" width="6" height="6" rx="1.5" />
      <rect x="3" y="11" width="6" height="6" rx="1.5" />
      <rect x="11" y="11" width="6" height="6" rx="1.5" />
    </svg>
  );
}
function SignalIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 14c0-4.4 3.6-8 8-8" strokeLinecap="round" />
      <path d="M4 10c0-2.2 1.8-4 4-4" strokeLinecap="round" />
      <circle cx="4.5" cy="15.5" r="1" fill="currentColor" />
    </svg>
  );
}
function ContentIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4h12M4 9h12M4 14h8" strokeLinecap="round" />
    </svg>
  );
}
function AudienceIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="8" r="2.5" />
      <circle cx="13" cy="8" r="2.5" />
      <path d="M3.5 15.5c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5M9.5 15.5c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5" strokeLinecap="round" />
    </svg>
  );
}
function LaunchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 3l4 4-7 7H3v-4l7-7z" strokeLinejoin="round" />
      <path d="M3 17h14" strokeLinecap="round" />
    </svg>
  );
}
function RoutingIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="5" cy="5" r="2" />
      <circle cx="15" cy="5" r="2" />
      <circle cx="10" cy="15" r="2" />
      <path d="M5 7v2c0 2 2 4 5 4s5-2 5-4V7" />
    </svg>
  );
}
