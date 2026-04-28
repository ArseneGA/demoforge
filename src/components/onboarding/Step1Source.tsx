"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"

type Source = "github" | "gitlab" | "zip"

const sources: {
  id: Source
  title: string
  desc: string
  pills: string[]
  soon?: boolean
  icon: React.ReactNode
}[] = [
  {
    id: "github",
    title: "GitHub",
    desc: "Repos publics & privés · OAuth ou GitHub App",
    pills: ["Recommandé", "OAuth"],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55 0-.27-.01-.99-.01-1.95-3.2.69-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.93 10.93 0 015.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.66.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
      </svg>
    ),
  },
  {
    id: "gitlab",
    title: "GitLab",
    desc: "SaaS ou self-hosted · jusqu'à GitLab 14+",
    pills: ["OAuth", "Self-host"],
    soon: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M22.65 13.39 12 21.5 1.35 13.39a.94.94 0 0 1-.34-1.05l1.18-3.63 2.4-7.39a.5.5 0 0 1 .94 0l2.4 7.39h8.14l2.4-7.39a.5.5 0 0 1 .94 0l2.4 7.39 1.18 3.63a.94.94 0 0 1-.34 1.05Z"/>
      </svg>
    ),
  },
  {
    id: "zip",
    title: "Archive ZIP / Dossier",
    desc: "Upload ponctuel · idéal pour tester sans connecter Git",
    pills: ["Sandbox", "Sans Git"],
    soon: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="24" height="24">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
        <path d="M14 3v6h6M12 11v7M9 14l3-3 3 3"/>
      </svg>
    ),
  },
]

interface Props {
  orgId: string
  isOwner: boolean
  onNext: () => void
  onCancel: () => void
}

export function Step1Source({ orgId, isOwner, onNext, onCancel }: Props) {
  const [selected, setSelected] = useState<Source>("github")
  const [loading, setLoading] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const router = useRouter()

  function handleAuthorize() {
    if (!isOwner) return
    window.open("/api/github/install", "_blank", "noopener,noreferrer")
  }

  async function handleSync() {
    setLoading(true)
    setSyncMsg(null)
    try {
      const res = await fetch("/api/github/sync", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setSyncMsg(data.error ?? "Sync échoué.")
      } else {
        setSyncMsg(`✓ ${data.synced} installation(s) détectée(s). Passage à l'étape 2…`)
        setTimeout(() => {
          window.location.href = "/onboarding?step=2"
        }, 1200)
      }
    } catch {
      setSyncMsg("Erreur réseau.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <section className="relative z-10 max-w-[880px] mx-auto w-full px-6 pt-8 pb-4 flex-1">
        <p className="font-mono text-[11px] uppercase tracking-[.08em] mb-3.5" style={{ color: "var(--brand-light)" }}>
          Étape 01 sur 04 · D'où vient votre code ?
        </p>
        <h1
          className="font-bold leading-[1.1] tracking-[-0.03em] mb-3.5"
          style={{ fontFamily: "var(--font-display)", fontSize: "36px" }}
        >
          Connectez votre source.
        </h1>
        <p className="text-[14.5px] leading-[1.6] max-w-[640px] mb-9" style={{ color: "var(--text-sec)" }}>
          DemoForge a besoin d'accéder en lecture à votre codebase. Choisissez une source — vous pourrez en connecter plusieurs plus tard.
        </p>

        {!isOwner && (
          <div
            className="mb-6 px-4 py-3 rounded-xl text-[13px]"
            style={{
              background: "color-mix(in oklab, var(--warn) 10%, transparent)",
              border: "1px solid color-mix(in oklab, var(--warn) 30%, transparent)",
              color: "var(--warn)",
            }}
          >
            Seul l'owner de l'org peut connecter une source. Demandez à votre admin d'effectuer cette étape.
          </div>
        )}

        {/* Source cards */}
        <div className="grid gap-3.5 mb-7" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {sources.map(src => {
            const sel = selected === src.id && !src.soon
            return (
              <div
                key={src.id}
                onClick={() => !src.soon && setSelected(src.id)}
                className="relative flex flex-col gap-3.5 p-6 rounded-xl transition-all"
                style={{
                  background: sel ? "linear-gradient(180deg, var(--brand-dim), transparent 70%)" : "var(--surface)",
                  border: `1px solid ${sel ? "var(--brand)" : "var(--border)"}`,
                  boxShadow: sel ? "var(--brand-glow)" : "none",
                  cursor: src.soon ? "not-allowed" : "pointer",
                  opacity: src.soon ? 0.55 : 1,
                }}
              >
                {src.soon && (
                  <span className="absolute top-4 left-4 font-mono text-[9px] uppercase tracking-[.06em] px-2 py-0.5 rounded" style={{ background: "var(--surface-raised)", color: "var(--text-ter)", border: "1px solid var(--border)" }}>
                    Bientôt
                  </span>
                )}
                <div className="absolute top-4 right-4 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                  style={{
                    background: sel ? "var(--brand)" : "transparent",
                    border: `1.5px solid ${sel ? "var(--brand)" : "var(--border-hover)"}`,
                  }}
                >
                  {sel && <svg viewBox="0 0 12 12" fill="none" width="10" height="10"><path d="M2 6l3 3 5-6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <div className="w-11 h-11 rounded-[10px] flex items-center justify-center"
                  style={{ background: sel ? "var(--brand-dim)" : "var(--surface-raised)", color: sel ? "var(--brand-light)" : "var(--text)" }}
                >
                  {src.icon}
                </div>
                <p className="text-[15.5px] font-semibold tracking-[-0.01em]">{src.title}</p>
                <p className="font-mono text-[11px] uppercase tracking-[.04em] leading-[1.5]" style={{ color: "var(--text-ter)" }}>{src.desc}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {src.pills.map(p => (
                    <span key={p} className="font-mono text-[9.5px] px-1.5 py-0.5 rounded uppercase tracking-[.04em]"
                      style={{ background: sel ? "rgba(255,255,255,.06)" : "var(--surface-raised)", color: sel ? "var(--text-sec)" : "var(--text-ter)", border: `1px solid ${sel ? "transparent" : "var(--border)"}` }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Reveal panel */}
        <div className="grid gap-4 items-center p-5 rounded-xl mb-5" style={{ gridTemplateColumns: "1fr auto", background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[.06em] mb-2.5" style={{ color: "var(--text-ter)" }}>
              Compte GitHub à connecter
            </p>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg font-mono text-[12.5px]" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}>
              <span style={{ color: "var(--text-ter)" }}>github.com/</span>
              <span style={{ color: "var(--text)" }}>votre-organisation</span>
            </div>
            <p className="font-mono text-[10.5px] uppercase tracking-[.04em] mt-2" style={{ color: "var(--text-ter)" }}>
              Accès <strong className="font-medium" style={{ color: "var(--brand-light)" }}>lecture seule</strong> · aucun secret lu · clone détruit après l'analyse
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <button
              onClick={handleAuthorize}
              disabled={!isOwner}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap disabled:opacity-50"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", color: "var(--text)" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55 0-.27-.01-.99-.01-1.95-3.2.69-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.93 10.93 0 015.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.66.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
              </svg>
              Autoriser sur GitHub
            </button>
            <button
              onClick={handleSync}
              disabled={!isOwner || loading}
              className="font-mono text-[10.5px] uppercase tracking-[.04em] px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
              style={{ border: "1px solid var(--border)", color: "var(--brand-light)", background: "transparent" }}
            >
              {loading ? "Vérification…" : "↻ Déjà installé ? Vérifier"}
            </button>
            {syncMsg && (
              <p className="font-mono text-[10.5px] text-right" style={{ color: syncMsg.startsWith("✓") ? "var(--success)" : "#f87171" }}>
                {syncMsg}
              </p>
            )}
          </div>
        </div>

        {/* Privacy */}
        <div className="flex gap-3.5 items-start p-4 rounded-xl font-mono text-[11.5px] leading-[1.55]" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-sec)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="18" height="18" className="flex-shrink-0 mt-0.5" style={{ color: "var(--success)" }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
          <div>
            <strong className="font-medium" style={{ color: "var(--text)" }}>Lecture seule, jamais d'exécution.</strong>
            <br />
            DemoForge clone en sandbox isolée, lit les fichiers source, détruit le clone après. Aucun secret (<code className="text-[10px] px-1 py-0.5 rounded" style={{ background: "var(--surface-raised)" }}>.env</code>) n'est lu.
          </div>
        </div>
      </section>

      <footer className="relative z-10 flex justify-between items-center px-6 py-4 border-t" style={{ background: "var(--surface-glass)", backdropFilter: "blur(14px)", borderColor: "var(--border)" }}>
        <span className="font-mono text-[11px] uppercase tracking-[.06em]" style={{ color: "var(--text-ter)" }}>
          Étape <strong className="font-medium" style={{ color: "var(--text)" }}>01</strong> · 04
        </span>
        <div className="flex gap-2.5">
          <button onClick={onCancel} className="px-4 py-2.5 rounded-lg text-[13px] font-medium" style={{ border: "1px solid var(--border)", color: "var(--text-sec)", background: "transparent" }}>
            Annuler
          </button>
          <button onClick={onNext} disabled={!isOwner} className="px-4 py-2.5 rounded-lg text-[13px] font-medium text-white disabled:opacity-40" style={{ background: "var(--brand)" }}>
            Continuer →
          </button>
        </div>
      </footer>
    </>
  )
}
