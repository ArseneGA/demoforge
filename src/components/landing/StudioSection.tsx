import Link from "next/link"
import { Play } from "lucide-react"

const stats = [
  { v: "∞",   l: "étapes" },
  { v: "3",   l: "modes partage" },
  { v: "N",   l: "thèmes / démo" },
  { v: "MSW", l: "mocks API" },
]

export function StudioSection() {
  return (
    <section className="px-8 py-[100px] max-w-[1280px] mx-auto" id="editor">
      <p className="font-mono text-[11px] uppercase tracking-[.1em] mb-4 flex items-center gap-2.5" style={{ color: "var(--brand)" }}>
        <span className="w-7 h-px inline-block" style={{ background: "var(--brand)" }} />
        04 · Storyboard
      </p>
      <h2
        className="font-bold leading-[1.05] tracking-[-0.03em] mb-5 max-w-[18ch]"
        style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px, 4.5vw, 56px)", textWrap: "balance" }}
      >
        Storyboard,{" "}
        <em className="not-italic" style={{ color: "var(--brand-light)" }}>mocks</em>
        , annotations. Un vrai studio.
      </h2>
      <p className="text-[17px] leading-[1.6] max-w-[580px] mb-14" style={{ color: "var(--text-sec)" }}>
        L'éditeur DemoForge n'est pas un PowerPoint : aperçu en direct de vos écrans mockés, inspecteur par étape, MSW pour les appels API — sans quitter le navigateur.
      </p>

      <div
        className="p-10 rounded-2xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="grid gap-8 items-center" style={{ gridTemplateColumns: "1fr 2fr" }}>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map(s => (
              <div
                key={s.l}
                className="p-[18px] rounded-xl"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              >
                <div
                  className="font-bold leading-none tracking-[-0.025em] mb-1"
                  style={{ fontFamily: "var(--font-display)", fontSize: "36px", color: "var(--brand-light)" }}
                >
                  {s.v}
                </div>
                <p className="font-mono text-[10.5px] uppercase tracking-[.04em] mt-1" style={{ color: "var(--text-ter)" }}>
                  {s.l}
                </p>
              </div>
            ))}
          </div>

          {/* Play preview */}
          <Link
            href="/login"
            className="relative rounded-xl flex items-center justify-center no-underline group overflow-hidden"
            style={{
              aspectRatio: "16/9",
              background: "linear-gradient(135deg, #1d1b22, #232128)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="absolute top-3 left-3 font-mono text-[9px] uppercase tracking-[.1em]"
              style={{ color: "var(--text-ter)" }}
            >
              Aperçu storyboard
            </span>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all group-hover:scale-105"
              style={{
                background: "var(--brand)",
                boxShadow: "0 8px 32px var(--brand-dim), var(--brand-glow)",
              }}
            >
              <Play size={22} fill="white" color="white" className="ml-0.5" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}
