const STEPS = [
  { n: "01", label: "Source" },
  { n: "02", label: "Repo & branche" },
  { n: "03", label: "Analyse" },
  { n: "04", label: "Récap & lancement" },
]

export function Stepper({ current }: { current: number }) {
  return (
    <nav className="relative z-10 grid gap-1 max-w-[920px] mx-auto w-full px-6 mt-9"
      style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
    >
      {STEPS.map((s, i) => {
        const idx = i + 1
        const done   = idx < current
        const active = idx === current
        return (
          <div
            key={s.n}
            className="flex flex-col gap-1.5 pb-3.5 border-b-2 transition-colors"
            style={{
              borderColor: active
                ? "var(--brand)"
                : done
                ? "var(--brand-light)"
                : "var(--border)",
            }}
          >
            <span
              className="font-mono text-[10px] uppercase tracking-[.06em] transition-colors"
              style={{ color: active || done ? "var(--text)" : "var(--text-ter)" }}
            >
              {s.n}
            </span>
            <span
              className="font-mono text-[12px] font-medium uppercase tracking-[.04em] transition-colors"
              style={{ color: active ? "var(--brand-light)" : done ? "var(--text)" : "var(--text-sec)" }}
            >
              {s.label}
            </span>
          </div>
        )
      })}
    </nav>
  )
}
