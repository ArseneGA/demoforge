const agents = [
  {
    n: "01 / 04", av: "SC", name: "Scout", role: "Lit votre code",
    color: "var(--agent-1)",
    desc: "Parse votre repo, identifie les routes, les composants, les modèles de données et les endpoints API. Extrait vos design tokens (couleurs, typo, logo) pour que la démo ressemble au vrai produit.",
    tools: ["AST", "Routes", "Tokens"],
  },
  {
    n: "02 / 04", av: "DI", name: "Director", role: "Script · orchestration",
    color: "var(--agent-2)",
    desc: "Du brief en chat à un storyboard découpé en étapes : route, action, intention. Stream étape par étape pour validation interactive. Pilote Faker et Narrator en parallèle.",
    tools: ["Storyboard", "Actions", "Chat"],
  },
  {
    n: "03 / 04", av: "FA", name: "Faker", role: "Mocks API · données",
    color: "var(--agent-3)",
    desc: "Génère des données mockées cohérentes par persona (e-commerce, B2B, marketplace). Mocks API servis par MSW au runtime, latences simulées, agrégats consistants entre étapes.",
    tools: ["MSW", "Fixtures", "Persona"],
  },
  {
    n: "04 / 04", av: "NA", name: "Narrator", role: "Annotations · captions",
    color: "var(--agent-4)",
    desc: "Pose les bulles contextuelles qui guident le spectateur sur les bons éléments. Suit un playbook par template (Onboarding, Feature launch, Pitch). Voix-off TTS en V2.",
    tools: ["Annot.", "Playbook", "Captions"],
  },
]

export function AgentsSection() {
  return (
    <section className="px-8 py-[100px] max-w-[1280px] mx-auto" id="agents">
      <p className="font-mono text-[11px] uppercase tracking-[.1em] mb-4 flex items-center gap-2.5" style={{ color: "var(--brand)" }}>
        <span className="w-7 h-px" style={{ background: "var(--brand)", display: "inline-block" }} />
        02 · Agents
      </p>
      <h2
        className="font-bold leading-[1.05] tracking-[-0.03em] mb-5 max-w-[18ch]"
        style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px, 4.5vw, 56px)", textWrap: "balance" }}
      >
        Quatre agents.{" "}
        <em className="not-italic" style={{ color: "var(--brand-light)" }}>Un parcours.</em>
      </h2>
      <p className="text-[17px] leading-[1.6] max-w-[580px] mb-14" style={{ color: "var(--text-sec)" }}>
        Chaque agent a une responsabilité claire et des outils dédiés. Ils travaillent en parallèle, sous l'orchestration de Director, et écrivent dans un chat partagé que vous pouvez interrompre à tout moment.
      </p>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {agents.map(a => (
          <article
            key={a.av}
            className="relative p-7 rounded-2xl flex flex-col gap-[18px] overflow-hidden"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              minHeight: "320px",
            }}
          >
            {/* Top color bar */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
              style={{ background: a.color }}
            />

            <p className="font-mono text-[11px]" style={{ color: "var(--text-ter)" }}>{a.n}</p>

            <div
              className="w-14 h-14 rounded-[14px] flex items-center justify-center font-bold text-[22px]"
              style={{
                fontFamily: "var(--font-display)",
                background: `color-mix(in oklab, ${a.color} 14%, var(--surface-raised))`,
                color: a.color,
                border: `1px solid color-mix(in oklab, ${a.color} 25%, transparent)`,
              }}
            >
              {a.av}
            </div>

            <div>
              <p className="text-[22px] font-bold tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)" }}>
                {a.name}
              </p>
              <p className="font-mono text-[10.5px] uppercase tracking-[.06em] mt-0.5" style={{ color: "var(--text-ter)" }}>
                {a.role}
              </p>
            </div>

            <p className="text-[13.5px] leading-[1.55] flex-1" style={{ color: "var(--text-sec)" }}>
              {a.desc}
            </p>

            <div className="flex flex-wrap gap-1">
              {a.tools.map(t => (
                <span
                  key={t}
                  className="font-mono text-[9.5px] px-2 py-0.5 rounded-sm uppercase tracking-[.04em]"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-ter)" }}
                >
                  {t}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
