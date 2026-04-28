import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function CtaSection() {
  return (
    <div className="px-8 py-20 max-w-[1100px] mx-auto mb-20">
      <div
        className="relative px-12 py-14 rounded-2xl flex flex-col items-center text-center gap-6 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--brand-dim), var(--surface) 70%)",
          border: "1px solid var(--brand)",
        }}
      >
        {/* Ambient */}
        <div
          className="absolute inset-[-50%] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, var(--brand-dim), transparent 60%)" }}
        />

        <p
          className="relative font-mono text-[11px] uppercase tracking-[.1em] flex items-center gap-2.5"
          style={{ color: "var(--brand)" }}
        >
          <span className="w-7 h-px inline-block" style={{ background: "var(--brand)" }} />
          Prêt à forger ?
        </p>

        <h2
          className="relative font-bold leading-[1.05] tracking-[-0.03em]"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px, 4.5vw, 56px)" }}
        >
          Votre première démo en{" "}
          <em className="not-italic" style={{ color: "var(--brand-light)" }}>30 minutes.</em>
        </h2>

        <p className="relative text-[16px] max-w-[520px]" style={{ color: "var(--text-sec)" }}>
          Pas de carte requise. Connectez votre repo, briefez les agents, partagez le lien.
        </p>

        <Link
          href="/login"
          className="relative flex items-center gap-2 px-6 py-3.5 text-[14px] font-medium rounded-md no-underline text-white transition-all"
          style={{ background: "var(--brand)" }}
        >
          Démarrer maintenant
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
