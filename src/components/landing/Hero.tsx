import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { HeroVisual } from "./HeroVisual"

export function Hero() {
  return (
    <section className="relative px-8 pt-[90px] pb-[60px] max-w-[1280px] mx-auto">
      {/* Ambient orb */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[600px] -z-10"
        style={{ background: "radial-gradient(ellipse at center, var(--brand-dim), transparent 60%)" }}
      />

      {/* Eyebrow */}
      <div
        className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border text-[11px] font-mono uppercase tracking-[.08em] mb-6"
        style={{
          color: "var(--brand)",
          borderColor: "var(--brand)",
          background: "var(--brand-dim)",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--brand)", animation: "pulse 2s infinite" }}
        />
        Studio agentique · repo → démo scriptée
      </div>

      {/* Headline */}
      <h1
        className="font-bold leading-[1.02] tracking-[-0.04em] mb-7 max-w-[14ch]"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(48px, 7vw, 88px)",
          textWrap: "balance",
        }}
      >
        Vos démos SaaS,{" "}
        <em
          className="not-italic"
          style={{
            background: "linear-gradient(135deg, var(--brand), var(--brand-light))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          forgées depuis votre code.
        </em>
      </h1>

      <p className="text-[19px] leading-[1.6] max-w-[580px] mb-9" style={{ color: "var(--text-sec)" }}>
        Connectez votre repo GitHub. Quatre agents lisent le code, scriptent un parcours, génèrent des données mockées cohérentes. En 30 minutes, vous partagez un lien vers une démo qui ressemble à votre vrai produit, sans toucher à votre backend.
      </p>

      {/* CTAs */}
      <div className="flex items-center gap-3 flex-wrap mb-8">
        <Link
          href="/login"
          className="flex items-center gap-1.5 px-[22px] py-3.5 text-[14px] font-medium rounded-md no-underline text-white transition-all"
          style={{ background: "var(--brand)" }}
        >
          Forger une démo
          <ArrowRight size={14} />
        </Link>
        <a
          href="#workflow"
          className="px-[22px] py-3.5 text-[14px] font-medium rounded-md no-underline border transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          Voir le workflow
        </a>
      </div>

      {/* Trust bar */}
      <div
        className="flex items-center gap-4 flex-wrap font-mono text-[11px] uppercase tracking-[.06em]"
        style={{ color: "var(--text-ter)" }}
      >
        <span>Pour les équipes produit en cadence</span>
        <span className="w-px h-3" style={{ background: "var(--border)" }} />
        <span>Backend mocké · données crédibles</span>
        <span className="w-px h-3" style={{ background: "var(--border)" }} />
        <span>Lien partageable · multi-thèmes</span>
      </div>

      <HeroVisual />
    </section>
  )
}
