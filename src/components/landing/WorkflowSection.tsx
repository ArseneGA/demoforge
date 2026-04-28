const steps = [
  {
    n: "01",
    h: "Scout lit votre code",
    d: "Connectez votre repo GitHub. Scout parse les routes, extrait vos design tokens (couleurs, typo, logo) et cartographie les écrans de votre produit. 1 à 3 minutes selon la taille du repo.",
    agents: [{ av: "SC", color: "var(--agent-1)" }],
  },
  {
    n: "02",
    h: "Director scripte, vous validez",
    d: "Décrivez la démo en chat : \"Feature Audiences pour une landing e-commerce, 6 étapes\". Director stream le storyboard étape par étape — vous validez, ajustez ou sautez par phrases.",
    agents: [{ av: "DI", color: "var(--agent-2)" }, { av: "SC", color: "var(--agent-1)" }],
  },
  {
    n: "03",
    h: "Faker peuple, Narrator annote",
    d: "En parallèle : Faker génère des données mockées cohérentes par persona (les chiffres s'additionnent entre écrans). Narrator pose les bulles qui guident le regard du spectateur.",
    agents: [{ av: "FA", color: "var(--agent-3)" }, { av: "NA", color: "var(--agent-4)" }],
  },
  {
    n: "04",
    h: "Vous présentez, vous partagez",
    d: "Clic \"Présenter\" — votre produit joue le parcours avec des données qui ont l'air vraies. Copiez le lien (public, protégé ou team-only), collez-le sur votre landing ou envoyez-le à votre prospect.",
    agents: [
      { av: "SC", color: "var(--agent-1)" },
      { av: "DI", color: "var(--agent-2)" },
      { av: "FA", color: "var(--agent-3)" },
      { av: "NA", color: "var(--agent-4)" },
    ],
  },
]

export function WorkflowSection() {
  return (
    <section className="px-8 py-[100px] max-w-[1280px] mx-auto" id="workflow">
      <p className="font-mono text-[11px] uppercase tracking-[.1em] mb-4 flex items-center gap-2.5" style={{ color: "var(--brand)" }}>
        <span className="w-7 h-px inline-block" style={{ background: "var(--brand)" }} />
        03 · Workflow
      </p>
      <h2
        className="font-bold leading-[1.05] tracking-[-0.03em] mb-5 max-w-[18ch]"
        style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px, 4.5vw, 56px)", textWrap: "balance" }}
      >
        Du{" "}
        <em className="not-italic" style={{ color: "var(--brand-light)" }}>repo</em>
        {" "}à la{" "}
        <em className="not-italic" style={{ color: "var(--brand-light)" }}>démo partagée</em>
        , en quatre temps.
      </h2>
      <p className="text-[17px] leading-[1.6] max-w-[580px] mb-14" style={{ color: "var(--text-sec)" }}>
        Un parcours linéaire pour vous, parallèle pour les agents. Vous restez aux commandes — eux construisent.
      </p>

      <div className="grid gap-[60px] items-start" style={{ gridTemplateColumns: "280px 1fr" }}>
        {/* Sticky stat card */}
        <div className="sticky top-[120px]">
          <div
            className="rounded-2xl p-8 flex flex-col justify-between"
            style={{
              aspectRatio: "1",
              background: "linear-gradient(135deg, var(--brand-dim), var(--surface) 70%)",
              border: "1px solid var(--brand)",
            }}
          >
            <span className="font-mono text-[11px] uppercase tracking-[.08em]" style={{ color: "var(--brand-light)" }}>
              Pipeline
            </span>
            <div>
              <div
                className="font-bold leading-none tracking-[-0.03em]"
                style={{ fontFamily: "var(--font-display)", fontSize: "56px", color: "var(--brand-light)" }}
              >
                30<small className="text-[22px] font-normal" style={{ color: "var(--text-sec)" }}>min</small>
              </div>
              <p className="text-[13px] mt-2" style={{ color: "var(--text-sec)" }}>
                temps moyen signup → première démo partageable.
              </p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="grid gap-[18px] py-[22px]"
              style={{
                gridTemplateColumns: "60px 1fr",
                borderBottom: i < steps.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <span className="font-mono text-[11px] pt-1" style={{ color: "var(--text-ter)" }}>{s.n}</span>
              <div>
                <h3
                  className="text-[22px] font-semibold tracking-[-0.02em] mb-1.5"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.h}
                </h3>
                <p className="text-[14px] leading-[1.6]" style={{ color: "var(--text-sec)" }}>{s.d}</p>
                <div className="flex gap-1 mt-2.5">
                  {s.agents.map(a => (
                    <span
                      key={a.av}
                      className="w-[22px] h-[22px] rounded-[5px] flex items-center justify-center font-mono text-[8.5px] font-bold"
                      style={{
                        background: `color-mix(in oklab, ${a.color} 16%, transparent)`,
                        color: a.color,
                      }}
                    >
                      {a.av}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
