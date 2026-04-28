"use client"

import { useState } from "react"
import { usePostHog } from "posthog-js/react"

interface Props {
  orgId: string
  currentPlan: string
  onClose: () => void
}

const PLANS = [
  {
    key: "forge",
    name: "Forge",
    monthly: 39,
    annual: 31,
    demos: 5,
    seats: 1,
    features: ["5 démos / mois", "1 siège", "Sans watermark", "Tous les templates", "Analytics basique"],
    cta: "Passer à Forge",
    highlight: false,
    trial: false,
  },
  {
    key: "studio",
    name: "Studio",
    monthly: 149,
    annual: 119,
    demos: 30,
    seats: 5,
    features: ["30 démos / mois", "5 sièges", "Sans watermark", "Tous les templates", "Analytics avancé", "Trial 14j sans CB"],
    cta: "Démarrer l'essai gratuit",
    highlight: true,
    trial: true,
  },
]

export function UpgradeModal({ orgId, currentPlan, onClose }: Props) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")
  const [loading, setLoading] = useState<string | null>(null)
  const ph = usePostHog()

  async function handleUpgrade(planKey: string) {
    setLoading(planKey)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, plan: planKey, billing }),
      })
      const data = await res.json()
      if (data.url) {
        ph?.capture("upgrade_initiated", { plan: planKey, billing })
        window.location.href = data.url
      }
    } catch (e) {
      console.error("checkout error", e)
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>

        {/* Header */}
        <div className="px-8 py-6 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-bold tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)" }}>Passer à un plan supérieur</h2>
              <p className="text-[13px] mt-1" style={{ color: "var(--text-ter)" }}>Plan actuel · <span className="capitalize">{currentPlan}</span></p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-ter)" }}>✕</button>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center gap-3 mt-5">
            {(["monthly", "annual"] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)}
                className="px-4 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-[.04em] transition-all"
                style={billing === b
                  ? { background: "var(--brand)", color: "#fff" }
                  : { background: "var(--bg)", color: "var(--text-ter)", border: "1px solid var(--border)" }
                }
              >
                {b === "monthly" ? "Mensuel" : "Annuel −20%"}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="grid gap-4 p-8" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {PLANS.map(plan => (
            <div key={plan.key} className="rounded-xl p-6 flex flex-col gap-4"
              style={{
                background: plan.highlight ? "var(--brand-dim)" : "var(--bg)",
                border: plan.highlight ? "1px solid var(--brand)" : "1px solid var(--border)",
              }}>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] uppercase tracking-[.06em]" style={{ color: plan.highlight ? "var(--brand-light)" : "var(--text-ter)" }}>{plan.name}</span>
                  {plan.trial && <span className="font-mono text-[9px] px-2 py-0.5 rounded-full" style={{ background: "var(--brand)", color: "#fff" }}>Trial 14j</span>}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold tracking-[-0.03em]" style={{ fontSize: "32px", fontFamily: "var(--font-display)", color: "var(--text)" }}>
                    {billing === "monthly" ? plan.monthly : plan.annual}€
                  </span>
                  <span className="text-[13px]" style={{ color: "var(--text-ter)" }}>/mois</span>
                </div>
                {billing === "annual" && (
                  <p className="font-mono text-[10px] mt-0.5" style={{ color: "var(--success)" }}>
                    Soit {plan.monthly * 12 - (plan.annual ?? 0) * 12}€ économisés / an
                  </p>
                )}
              </div>

              <ul className="flex flex-col gap-1.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-[12.5px]" style={{ color: "var(--text-sec)" }}>
                    <span style={{ color: "var(--success)" }}>✓</span> {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.key)}
                disabled={!!loading || currentPlan === plan.key}
                className="w-full py-3 rounded-xl font-mono text-[11px] uppercase tracking-[.04em] font-semibold transition-all disabled:opacity-50"
                style={plan.highlight
                  ? { background: "var(--brand)", color: "#fff", border: "none" }
                  : { background: "transparent", color: "var(--text)", border: "1px solid var(--border)" }
                }
              >
                {loading === plan.key ? "Redirection…" : currentPlan === plan.key ? "Plan actuel" : plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center pb-5 font-mono text-[10px]" style={{ color: "var(--text-ter)" }}>
          Paiement sécurisé via Stripe · Annulable à tout moment
        </p>
      </div>
    </div>
  )
}
