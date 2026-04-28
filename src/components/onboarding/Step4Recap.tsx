"use client"

import React from "react"
import { useRouter } from "next/navigation"
import type { WizardProject } from "./WizardShell"

interface Props {
  project: WizardProject
  onBack: () => void
}

export function Step4Recap({ project, onBack }: Props) {
  const router = useRouter()

  const config = [
    ["Source", "GitHub"],
    ["Repo", project.repo_full_name],
    ["Branche", project.branch],
    ["Stack", project.framework ?? "React / Next.js"],
    ["Status", project.scan_status],
  ]

  return (
    <>
      <section className="relative z-10 max-w-[880px] mx-auto w-full px-6 pt-8 pb-4 flex-1">
        <p className="font-mono text-[11px] uppercase tracking-[.08em] mb-3.5" style={{ color: "var(--brand-light)" }}>
          Étape 04 sur 04 · Récapitulatif
        </p>
        <h1 className="font-bold leading-[1.1] tracking-[-0.03em] mb-3.5" style={{ fontFamily: "var(--font-display)", fontSize: "36px" }}>
          Tout est prêt.
        </h1>
        <p className="text-[14.5px] leading-[1.6] max-w-[640px] mb-8" style={{ color: "var(--text-sec)" }}>
          Scout a indexé votre codebase. Vous pouvez maintenant créer votre première démo en briefant les 4 agents.
        </p>

        <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Config */}
          <div className="p-5 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h3 className="font-mono text-[10.5px] uppercase tracking-[.06em] mb-3.5" style={{ color: "var(--text-ter)" }}>
              Configuration du projet
            </h3>
            <div className="grid gap-x-4 gap-y-2 font-mono text-[12px]" style={{ gridTemplateColumns: "auto 1fr" }}>
              {config.map(([k, v]) => (
                <React.Fragment key={k}>
                  <span style={{ color: "var(--text-ter)" }}>{k}</span>
                  <span className="font-semibold truncate" style={{ color: "var(--text)" }}>{v}</span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Mock mode */}
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "color-mix(in oklab, var(--success) 8%, transparent)", border: "1px solid color-mix(in oklab, var(--success) 25%, transparent)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="flex-shrink-0 mt-0.5" style={{ color: "var(--success)" }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              <div className="text-[13px] leading-[1.55]" style={{ color: "var(--text-sec)" }}>
                <strong style={{ color: "var(--text)" }}>Mode démo scriptée activé.</strong>
                <br />
                Les endpoints API détectés seront remplacés par des mocks déterministes. Aucune écriture BDD, aucun appel sortant.
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--brand-dim)" }}>
              <p className="font-mono text-[10.5px] uppercase tracking-[.06em] mb-2" style={{ color: "var(--brand-light)" }}>Prochaine étape</p>
              <p className="text-[13px] leading-[1.55]" style={{ color: "var(--text-sec)" }}>
                Depuis le dashboard, cliquez <strong style={{ color: "var(--text)" }}>+ Nouvelle démo</strong> et briefez les agents en chat pour scripter votre premier parcours.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 flex justify-between items-center px-6 py-4 border-t" style={{ background: "var(--surface-glass)", backdropFilter: "blur(14px)", borderColor: "var(--border)" }}>
        <span className="font-mono text-[11px] uppercase tracking-[.06em]" style={{ color: "var(--text-ter)" }}>
          Tout est prêt · repo <strong style={{ color: "var(--text)" }}>{project.repo_full_name}</strong>
        </span>
        <div className="flex gap-2.5">
          <button onClick={onBack} className="px-4 py-2.5 rounded-lg text-[13px] font-medium" style={{ border: "1px solid var(--border)", color: "var(--text-sec)", background: "transparent" }}>
            ← Re-analyser
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 rounded-lg text-[14px] font-semibold text-white"
            style={{ background: "var(--brand)", boxShadow: "var(--brand-glow)" }}
          >
            Aller au dashboard →
          </button>
        </div>
      </footer>
    </>
  )
}
