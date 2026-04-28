"use client"

const links = ["Documentation", "Changelog", "Sécurité", "Confidentialité", "Statut"]

export function Footer() {
  return (
    <footer
      className="px-8 py-10 max-w-[1280px] mx-auto flex justify-between items-center flex-wrap gap-5 border-t"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M8 5v14l11-7z" fill="white" />
          </svg>
        </div>
        <span className="font-mono text-[11px]" style={{ color: "var(--text-ter)" }}>
          © 2026 DemoForge · Studio agentique
        </span>
      </div>

      <div className="flex gap-[18px]">
        {links.map(l => (
          <a
            key={l}
            href="#"
            className="font-mono text-[11px] no-underline transition-colors"
            style={{ color: "var(--text-ter)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--brand)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-ter)")}
          >
            {l}
          </a>
        ))}
      </div>
    </footer>
  )
}
