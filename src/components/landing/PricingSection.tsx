import Link from "next/link"

const plans = [
  {
    tier: "Forge",
    desc: "Solo PMM, prototypes et démos hebdo.",
    price: "39€",
    period: " / mois",
    features: [
      "5 démos publiées / mois",
      "4 agents · 1 projet",
      "Lien public · watermark désactivable",
      "Storage 500 Mo",
    ],
    cta: "Commencer",
    ctaHref: "/login",
    featured: false,
  },
  {
    tier: "Studio",
    desc: "Équipes produit & marketing en cadence.",
    price: "149€",
    period: " / mois",
    features: [
      "30 démos publiées / mois",
      "4 agents · 5 projets · 5 sièges",
      "Public + password + team-only",
      "Multi-thèmes · branding personnalisé",
      "Analytics · storage 5 Go",
    ],
    cta: "Essai 14 jours · sans CB",
    ctaHref: "/login",
    featured: true,
  },
  {
    tier: "Atelier",
    desc: "Agences, studios démo et grandes orgs.",
    price: "Sur devis",
    period: "",
    features: [
      "Démos illimitées · projets illimités",
      "Mode agence · branding par client",
      "SSO · audit trail · DPA",
      "Support dédié · onboarding sur site",
    ],
    cta: "Nous contacter",
    ctaHref: "mailto:hello@demoforge.app",
    featured: false,
  },
]

export function PricingSection() {
  return (
    <section className="px-8 py-[100px] max-w-[1280px] mx-auto" id="pricing">
      <p className="font-mono text-[11px] uppercase tracking-[.1em] mb-4 flex items-center gap-2.5" style={{ color: "var(--brand)" }}>
        <span className="w-7 h-px inline-block" style={{ background: "var(--brand)" }} />
        05 · Pricing
      </p>
      <h2
        className="font-bold leading-[1.05] tracking-[-0.03em] mb-5 max-w-[18ch]"
        style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px, 4.5vw, 56px)", textWrap: "balance" }}
      >
        Commencez{" "}
        <em className="not-italic" style={{ color: "var(--brand-light)" }}>gratuitement.</em>
      </h2>
      <p className="text-[17px] leading-[1.6] max-w-[580px] mb-14" style={{ color: "var(--text-sec)" }}>
        1 démo par mois à vie sur le plan Free. Passez à Studio quand votre cadence de launch s'accélère — agents, stockage et collaboration inclus.
      </p>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {plans.map(p => (
          <article
            key={p.tier}
            className="relative p-8 rounded-2xl flex flex-col gap-[18px]"
            style={{
              background: p.featured
                ? "linear-gradient(180deg, var(--brand-dim), var(--surface) 30%)"
                : "var(--surface)",
              border: `1px solid ${p.featured ? "var(--brand)" : "var(--border)"}`,
            }}
          >
            {p.featured && (
              <span
                className="absolute -top-3 right-6 font-mono text-[10px] px-2.5 py-0.5 rounded-full text-white uppercase tracking-[.06em]"
                style={{ background: "var(--brand)" }}
              >
                Populaire
              </span>
            )}

            <div>
              <p className="text-[22px] font-bold tracking-[-0.015em]" style={{ fontFamily: "var(--font-display)" }}>
                {p.tier}
              </p>
              <p className="text-[13px] leading-[1.55] mt-1" style={{ color: "var(--text-sec)", minHeight: "40px" }}>
                {p.desc}
              </p>
            </div>

            <div
              className="font-bold tracking-[-0.03em] leading-none"
              style={{ fontFamily: "var(--font-display)", fontSize: "48px" }}
            >
              {p.price}
              {p.period && <small className="text-[14px] font-normal" style={{ color: "var(--text-ter)" }}>{p.period}</small>}
            </div>

            <ul className="flex flex-col gap-2.5 list-none p-0 flex-1">
              {p.features.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-[13.5px]" style={{ color: "var(--text-sec)" }}>
                  <span
                    className="mt-0.5 w-3.5 h-3.5 flex-shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{
                      background: "var(--brand-dim)",
                      border: "1px solid var(--brand)",
                      color: "var(--brand-light)",
                    }}
                  >
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={p.ctaHref}
              className="flex items-center justify-center px-4 py-2.5 rounded-md text-[13px] font-medium no-underline transition-all"
              style={
                p.featured
                  ? { background: "var(--brand)", color: "#fff" }
                  : { border: "1px solid var(--border)", color: "var(--text)" }
              }
            >
              {p.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
