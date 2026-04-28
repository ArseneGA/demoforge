"use client"

import { useState, useEffect } from "react"
import type { WizardInstallation } from "./WizardShell"
import type { GithubRepo } from "@/app/api/github/repos/route"

interface Props {
  orgId: string
  installation: WizardInstallation | null
  onRepoSelected: (repo: { full_name: string; branch: string; install_id: string }) => void
  onBack: () => void
}

function NoInstallBlock() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function handleSync() {
    setLoading(true)
    setMsg(null)
    const res = await fetch("/api/github/sync", { method: "POST" })
    const data = await res.json()
    if (!res.ok) {
      setMsg(data.error ?? "Sync échoué.")
    } else {
      setMsg(`✓ Installation détectée — rechargement…`)
      setTimeout(() => { window.location.href = "/onboarding?step=2" }, 1000)
    }
    setLoading(false)
  }

  return (
    <div className="p-6 rounded-xl text-center flex flex-col items-center gap-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <p className="text-[14px]" style={{ color: "var(--text-sec)" }}>
        Aucune installation GitHub App détectée.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => window.open("/api/github/install", "_blank", "noopener,noreferrer")}
          className="px-4 py-2.5 rounded-lg text-[13px] font-medium text-white"
          style={{ background: "var(--brand)" }}
        >
          Autoriser sur GitHub →
        </button>
        <button
          onClick={handleSync}
          disabled={loading}
          className="px-4 py-2.5 rounded-lg text-[13px] font-medium disabled:opacity-50"
          style={{ border: "1px solid var(--border)", color: "var(--brand-light)", background: "transparent" }}
        >
          {loading ? "Vérification…" : "↻ Déjà installé ?"}
        </button>
      </div>
      {msg && <p className="font-mono text-[11px]" style={{ color: msg.startsWith("✓") ? "var(--success)" : "#f87171" }}>{msg}</p>}
    </div>
  )
}

const LANG_COLOR: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Vue: "#42b883",
  Python: "#3572A5",
  Go: "#00ADD8",
}

export function Step2Repo({ orgId, installation, onRepoSelected, onBack }: Props) {
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [filter, setFilter] = useState("")

  useEffect(() => {
    if (!installation) { setLoading(false); return }
    fetch(`/api/github/repos?org_id=${orgId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setRepos(data.repos ?? [])
      })
      .catch(() => setError("Impossible de charger les repos."))
      .finally(() => setLoading(false))
  }, [orgId, installation])

  const filtered = repos.filter(r =>
    r.full_name.toLowerCase().includes(filter.toLowerCase()) ||
    (r.description ?? "").toLowerCase().includes(filter.toLowerCase())
  )

  const selectedRepo = selected !== null ? repos.find(r => r.id === selected) : null

  function handleNext() {
    if (!selectedRepo || !installation) return
    onRepoSelected({
      full_name: selectedRepo.full_name,
      branch: selectedRepo.default_branch,
      install_id: installation.id,  // UUID de notre table, pas le numéro GitHub
    })
  }

  return (
    <>
      <section className="relative z-10 max-w-[880px] mx-auto w-full px-6 pt-8 pb-4 flex-1">
        <p className="font-mono text-[11px] uppercase tracking-[.08em] mb-3.5" style={{ color: "var(--brand-light)" }}>
          Étape 02 sur 04 · Quel repo, quelle branche ?
        </p>
        <h1 className="font-bold leading-[1.1] tracking-[-0.03em] mb-3.5" style={{ fontFamily: "var(--font-display)", fontSize: "36px" }}>
          Choisissez le projet à indexer.
        </h1>
        <p className="text-[14.5px] leading-[1.6] max-w-[640px] mb-8" style={{ color: "var(--text-sec)" }}>
          Sélectionnez un repo et la branche à utiliser comme référence. Vous pourrez créer plusieurs démos depuis le même repo.
        </p>

        {!installation ? (
          <NoInstallBlock />
        ) : (
          <>
            {/* Account bar */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold" style={{ background: "var(--surface-raised)", color: "var(--text)" }}>
                {installation.github_account_login.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-[13px]">Connecté en tant que <strong>{installation.github_account_login}</strong> via GitHub</p>
                <p className="font-mono text-[10.5px] uppercase tracking-[.04em]" style={{ color: "var(--text-ter)" }}>
                  {repos.length} repos accessibles
                </p>
              </div>
              <button
                onClick={() => window.open("/api/github/install", "_blank", "noopener,noreferrer")}
                className="font-mono text-[10.5px] uppercase tracking-[.04em] transition-colors"
                style={{ color: "var(--brand-light)" }}
              >
                Changer
              </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ color: "var(--text-ter)", flexShrink: 0 }}>
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                type="text"
                placeholder="Filtrer les repos…"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-[13px]"
                style={{ color: "var(--text)", fontFamily: "var(--font-sans)" }}
              />
            </div>

            {/* Repo list */}
            {loading ? (
              <div className="text-center py-12 font-mono text-[12px]" style={{ color: "var(--text-ter)" }}>
                Chargement des repos…
              </div>
            ) : error ? (
              <div className="px-4 py-3 rounded-xl text-[13px]" style={{ background: "color-mix(in oklab, #ef4444 10%, transparent)", color: "#f87171", border: "1px solid color-mix(in oklab, #ef4444 30%, transparent)" }}>
                {error}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 mb-5 max-h-[360px] overflow-y-auto">
                {filtered.map(r => {
                  const sel = selected === r.id
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelected(r.id)}
                      className="flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: sel ? "var(--brand-dim)" : "var(--surface)",
                        border: `1px solid ${sel ? "var(--brand)" : "var(--border)"}`,
                      }}
                    >
                      <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{ border: `2px solid ${sel ? "var(--brand)" : "var(--border-hover)"}` }}>
                        {sel && <div className="w-2 h-2 rounded-full" style={{ background: "var(--brand)" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px]">
                          <span style={{ color: "var(--text-ter)" }}>{r.owner.login} / </span>
                          <strong className="font-semibold">{r.name}</strong>
                        </p>
                        {r.description && <p className="text-[12px] mt-0.5 truncate" style={{ color: "var(--text-ter)" }}>{r.description}</p>}
                      </div>
                      {r.language && (
                        <div className="flex items-center gap-1.5 font-mono text-[11px]" style={{ color: "var(--text-ter)" }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: LANG_COLOR[r.language] ?? "var(--text-ter)" }} />
                          {r.language}
                        </div>
                      )}
                      <span className="font-mono text-[9.5px] px-1.5 py-0.5 rounded uppercase tracking-[.04em]" style={{ background: "var(--surface-raised)", color: "var(--text-ter)", border: "1px solid var(--border)" }}>
                        {r.private ? "Privé" : "Public"}
                      </span>
                      <div className="text-right font-mono text-[10px]" style={{ color: "var(--text-ter)" }}>
                        <div>{r.default_branch}</div>
                        {r.updated_at && <div>{formatAge(r.updated_at)}</div>}
                      </div>
                    </div>
                  )
                })}
                {filtered.length === 0 && (
                  <div className="text-center py-8 font-mono text-[12px]" style={{ color: "var(--text-ter)" }}>
                    Aucun repo trouvé.
                  </div>
                )}
              </div>
            )}

            {/* Selected config */}
            {selectedRepo && (
              <div className="grid gap-3 p-5 rounded-xl" style={{ gridTemplateColumns: "1fr 1fr 1fr", background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div>
                  <h4 className="font-mono text-[10.5px] uppercase tracking-[.06em] mb-2" style={{ color: "var(--text-ter)" }}>Branche</h4>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-[12.5px]" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12" style={{ color: "var(--text-ter)" }}>
                      <circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="8" r="2"/>
                      <path d="M6 8v8M18 10c0 4-6 4-6 8"/>
                    </svg>
                    {selectedRepo.default_branch}
                  </div>
                </div>
                <div>
                  <h4 className="font-mono text-[10.5px] uppercase tracking-[.06em] mb-2" style={{ color: "var(--text-ter)" }}>Profondeur</h4>
                  <div className="px-3 py-2 rounded-lg font-mono text-[12px]" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}>
                    Code source uniquement
                  </div>
                </div>
                <div>
                  <h4 className="font-mono text-[10.5px] uppercase tracking-[.06em] mb-2" style={{ color: "var(--text-ter)" }}>Inclure</h4>
                  <div className="flex flex-col gap-1">
                    {["Pages & routes", "Composants UI", "Stores / state"].map(l => (
                      <label key={l} className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-sec)" }}>
                        <span className="w-3.5 h-3.5 rounded flex-shrink-0" style={{ background: "var(--brand)" }} />
                        {l}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <footer className="relative z-10 flex justify-between items-center px-6 py-4 border-t" style={{ background: "var(--surface-glass)", backdropFilter: "blur(14px)", borderColor: "var(--border)" }}>
        <span className="font-mono text-[11px] uppercase tracking-[.06em]" style={{ color: "var(--text-ter)" }}>
          Étape <strong className="font-medium" style={{ color: "var(--text)" }}>02</strong> · 04
        </span>
        <div className="flex gap-2.5">
          <button onClick={onBack} className="px-4 py-2.5 rounded-lg text-[13px] font-medium" style={{ border: "1px solid var(--border)", color: "var(--text-sec)", background: "transparent" }}>
            ← Retour
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedRepo || !installation}
            className="px-4 py-2.5 rounded-lg text-[13px] font-medium text-white disabled:opacity-40"
            style={{ background: "var(--brand)" }}
          >
            Lancer l'analyse →
          </button>
        </div>
      </footer>
    </>
  )
}

function formatAge(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `il y a ${d}j`
  return `il y a ${Math.floor(d / 30)}mois`
}
