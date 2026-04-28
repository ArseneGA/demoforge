const agents = [
  { av: "SC", name: "Scout",    status: "Code",   live: true,  color: "var(--agent-1)" },
  { av: "DI", name: "Director", status: "Script", live: true,  color: "var(--agent-2)" },
  { av: "FA", name: "Faker",    status: "Mocks",  live: true,  color: "var(--agent-3)" },
  { av: "NA", name: "Narrator", status: "Annot.", live: false, color: "var(--agent-4)" },
]

const outputs = [
  { av: "EC", name: "Écrans détectés", bg: "var(--brand-dim)",              color: "var(--brand-light)" },
  { av: "ST", name: "Storyboard",      bg: "rgba(56,180,212,.14)",          color: "var(--agent-2)" },
  { av: "MK", name: "Mocks API",       bg: "rgba(45,200,180,.14)",          color: "var(--agent-3)" },
  { av: "AN", name: "Annotations",     bg: "rgba(245,180,80,.14)",          color: "var(--agent-4)" },
]

const inspectorRows = [
  { label: "Étape",        value: "04 / 06" },
  { label: "Route",        value: "/audiences/new" },
  { label: "Action",       value: "type · highlight" },
  { label: "Mocks",        value: "3 actifs" },
  { label: "Annotation",   value: "Filtre par CA" },
  { label: "Latence mock", value: "240 ms" },
  { label: "Persona",      value: "E-com mode", last: true },
]

const timelineRows = [
  { variant: "v", clips: [{ l: 2, w: 14 }, { l: 18, w: 16 }, { l: 36, w: 18 }, { l: 56, w: 14 }, { l: 72, w: 12 }, { l: 86, w: 12 }] },
  { variant: "a", clips: [{ l: 4, w: 10 }, { l: 22, w: 8 }, { l: 40, w: 12 }, { l: 60, w: 8 }, { l: 76, w: 10 }] },
  { variant: "s", clips: [{ l: 6, w: 6 }, { l: 24, w: 7 }, { l: 44, w: 8 }, { l: 64, w: 6 }, { l: 80, w: 8 }] },
]

const tlColor: Record<string, string> = {
  v: "linear-gradient(135deg, var(--brand-deep), var(--brand))",
  a: "var(--agent-3)",
  s: "var(--agent-4)",
}

export function HeroVisual() {
  return (
    <div
      className="mt-20 rounded-2xl p-3.5 relative"
      style={{
        background: "linear-gradient(180deg, var(--surface), #1a1820)",
        border: "1px solid var(--border)",
        boxShadow: "0 60px 120px -40px rgba(0,0,0,.7), 0 0 0 1px var(--brand-dim), var(--brand-glow)",
      }}
    >
      {/* Chrome bar */}
      <div
        className="flex items-center gap-2 px-2 pb-3 mb-3.5 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex gap-1.5">
          {["#ef4444","#f59e0b","#34d399"].map(c => (
            <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <span
          className="ml-4 font-mono text-[11px] px-3 py-1 rounded flex-1 max-w-[360px]"
          style={{ background: "var(--bg)", color: "var(--text-ter)" }}
        >
          demoforge.app/projects/acme-stratus/audiences-launch
        </span>
      </div>

      {/* Grid */}
      <div
        className="grid rounded-md overflow-hidden"
        style={{
          gridTemplateColumns: "200px 1fr 280px",
          gridTemplateRows: "1fr 140px",
          gap: "1px",
          background: "var(--border)",
          minHeight: "480px",
        }}
      >
        {/* Sidebar */}
        <aside className="p-3.5" style={{ background: "var(--surface)", gridRow: "1" }}>
          <p className="font-mono text-[10px] uppercase tracking-[.06em] mb-2.5" style={{ color: "var(--text-ter)" }}>
            Agents · live
          </p>
          {agents.map(a => (
            <div
              key={a.av}
              className="flex items-center gap-2 px-2 py-2 rounded-md mb-1"
              style={{ background: "var(--bg)" }}
            >
              <span
                className="w-[22px] h-[22px] rounded-[5px] flex items-center justify-center font-mono text-[9px] font-bold"
                style={{ background: `color-mix(in oklab, ${a.color} 18%, transparent)`, color: a.color }}
              >
                {a.av}
              </span>
              <span className="text-[11px]" style={{ color: "var(--text)" }}>{a.name}</span>
              <span
                className="ml-auto font-mono text-[9px] flex items-center gap-1"
                style={{ color: a.live ? "var(--brand)" : "var(--text-ter)" }}
              >
                {a.live && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--brand)", animation: "pulse 2s infinite" }}
                  />
                )}
                {a.status}
              </span>
            </div>
          ))}

          <p className="font-mono text-[10px] uppercase tracking-[.06em] mt-4 mb-2.5" style={{ color: "var(--text-ter)" }}>
            Sorties
          </p>
          {outputs.map(o => (
            <div
              key={o.av}
              className="flex items-center gap-2 px-2 py-2 rounded-md mb-1"
              style={{ background: "var(--bg)" }}
            >
              <span
                className="w-[22px] h-[22px] rounded-[5px] flex items-center justify-center font-mono text-[9px] font-bold"
                style={{ background: o.bg, color: o.color }}
              >
                {o.av}
              </span>
              <span className="text-[11px]" style={{ color: "var(--text)" }}>{o.name}</span>
            </div>
          ))}
        </aside>

        {/* Canvas */}
        <div
          className="flex items-center justify-center overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, #1d1b22, #232128)", gridRow: "1", gridColumn: "2" }}
        >
          <div
            className="w-4/5 rounded-md p-[8%] flex flex-col justify-between"
            style={{
              aspectRatio: "16/9",
              background: "linear-gradient(135deg, #2a283a, #181822)",
            }}
          >
            <span
              className="font-mono text-[10px] uppercase tracking-[.1em]"
              style={{ color: "var(--brand-light)" }}
            >
              — Étape 04 · /audiences/new
            </span>
            <div>
              <div
                className="font-bold leading-[1.05] tracking-[-0.025em] text-white mb-2"
                style={{ fontFamily: "var(--font-display)", fontSize: "clamp(18px, 2.5vw, 28px)" }}
              >
                Audience<br />
                <em
                  className="not-italic"
                  style={{
                    background: "linear-gradient(135deg, var(--brand), var(--brand-light))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  e-commerce mode FR.
                </em>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <span
                className="font-mono text-[9px] px-2 py-0.5 rounded"
                style={{ color: "rgba(255,255,255,.4)", background: "rgba(0,0,0,.5)" }}
              >
                12 482 utilisateurs · CA 184 k€
              </span>
              <span className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,.4)" }}>
                Demo<em className="not-italic" style={{ color: "var(--brand-light)" }}>Forge</em>
              </span>
            </div>
          </div>
        </div>

        {/* Inspector */}
        <aside className="p-3.5 font-mono text-[10px] uppercase tracking-[.06em]" style={{ background: "var(--surface)", gridRow: "1", color: "var(--text-ter)" }}>
          <p className="mb-2.5">Inspecteur étape</p>
          {inspectorRows.map(r => (
            <div
              key={r.label}
              className="flex justify-between py-1.5"
              style={{ borderBottom: r.last ? "none" : "1px solid var(--border)" }}
            >
              <span>{r.label}</span>
              <span className="font-sans text-[11px] normal-case tracking-normal" style={{ color: "var(--text)" }}>
                {r.value}
              </span>
            </div>
          ))}
        </aside>

        {/* Timeline */}
        <div
          className="col-span-3 flex flex-col gap-1.5 p-3"
          style={{ background: "var(--surface)", gridRow: "2" }}
        >
          {timelineRows.map((row, i) => (
            <div
              key={i}
              className="relative h-[18px] rounded-[3px]"
              style={{ background: "var(--bg)" }}
            >
              {row.clips.map((clip, j) => (
                <div
                  key={j}
                  className="absolute top-0.5 bottom-0.5 rounded-[2px] opacity-80"
                  style={{
                    left: `${clip.l}%`,
                    width: `${clip.w}%`,
                    background: tlColor[row.variant],
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
