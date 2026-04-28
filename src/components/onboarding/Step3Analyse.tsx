"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import type { WizardProject } from "./WizardShell"

interface ScanRepo {
  full_name: string
  branch: string
  install_id: string  // UUID de github_installations.id
}

interface Props {
  orgId: string
  repo: ScanRepo
  onScanComplete: (project: WizardProject, jobId: string) => void
  onBack: () => void
}

type LogLevel = "init" | "scan" | "ok" | "note" | "ind"
type LogLine = { ts: string; lvl: LogLevel; body: string }

const LVL_COLOR: Record<LogLevel, string> = {
  init: "var(--text-ter)",
  ok:   "var(--success)",
  scan: "var(--brand-light)",
  note: "var(--warn)",
  ind:  "",
}

export function Step3Analyse({ orgId, repo, onScanComplete, onBack }: Props) {
  const [pct, setPct] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lines, setLines] = useState<LogLine[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  function addLine(line: LogLine) {
    setLines(prev => [...prev, line])
    setTimeout(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }, 50)
  }

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const now = () => new Date().toTimeString().slice(0, 8)

    addLine({ ts: now(), lvl: "init", body: `Initialisation · ${repo.full_name} @ ${repo.branch}…` })

    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        org_id: orgId,
        github_install_id: repo.install_id,
        repo_full_name: repo.full_name,
        branch: repo.branch,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
          return
        }
        setProjectId(data.project.id)
        addLine({ ts: now(), lvl: "ok", body: "Projet créé · scan démarré" })
        addLine({ ts: now(), lvl: "scan", body: "Détection du framework…" })
      })
      .catch(() => setError("Erreur lors de la création du projet."))
  }, [])

  useEffect(() => {
    if (!projectId) return
    const supabase = createClient()
    let lastProgress = -1

    const poll = async () => {
      const { data: job } = await supabase
        .from("jobs")
        .select("id, status, progress")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (!job) return

      if (job.progress !== lastProgress) {
        lastProgress = job.progress
        setPct(job.progress ?? 0)

        if (job.progress === 50) {
          const ts = new Date().toTimeString().slice(0, 8)
          addLine({ ts, lvl: "scan", body: "Parsing composants & props…" })
          addLine({ ts, lvl: "ind", body: "→ Routes détectées · design tokens extraits" })
        }
      }

      if (job.status === "success" && !done) {
        const ts = new Date().toTimeString().slice(0, 8)
        addLine({ ts, lvl: "ok", body: "Analyse terminée · prêt à scripter" })
        setDone(true)
        clearInterval(interval)

        const { data: project } = await supabase
          .from("projects")
          .select("id, repo_full_name, branch, scan_status, framework")
          .eq("id", projectId)
          .single()

        if (project) onScanComplete(project as WizardProject, job.id)
      }

      if (job.status === "failed") {
        setError("Le scan a échoué. Vérifiez les permissions GitHub App.")
        clearInterval(interval)
      }
    }

    const interval = setInterval(poll, 2000)
    poll() // premier appel immédiat

    return () => clearInterval(interval)
  }, [projectId])

  return (
    <>
      <section className="relative z-10 max-w-[880px] mx-auto w-full px-6 pt-8 pb-4 flex flex-col min-h-0 flex-1">
        <p className="font-mono text-[11px] uppercase tracking-[.08em] mb-3.5" style={{ color: "var(--brand-light)" }}>
          Étape 03 sur 04 · L'agent lit votre code
        </p>
        <h1 className="font-bold leading-[1.1] tracking-[-0.03em] mb-3.5" style={{ fontFamily: "var(--font-display)", fontSize: "36px" }}>
          {done ? "Analyse terminée." : error ? "Erreur d'analyse." : "Compréhension du repo en cours…"}
        </h1>
        <p className="text-[14.5px] leading-[1.6] max-w-[640px] mb-6" style={{ color: "var(--text-sec)" }}>
          Scout parcourt votre codebase pour cartographier les pages et déduire les parcours. Le backend ne sera pas exécuté — les appels seront <em>fakés</em> lors de la démo.
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-[13px]" style={{ background: "color-mix(in oklab, #ef4444 10%, transparent)", color: "#f87171", border: "1px solid color-mix(in oklab, #ef4444 30%, transparent)" }}>
            {error}
          </div>
        )}

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-6 font-mono text-[11px] uppercase tracking-[.04em]" style={{ color: "var(--text-ter)" }}>
          <span>Avancement</span>
          <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--surface-raised)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--brand), var(--brand-light))" }}
            />
          </div>
          <span style={{ color: done ? "var(--success)" : "var(--brand-light)" }}>{pct}%</span>
        </div>

        <div className="grid gap-4 flex-1 min-h-0" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
          {/* Terminal */}
          <div className="flex flex-col rounded-xl overflow-hidden" style={{ background: "#0c0a10", border: "1px solid var(--border)", minHeight: "320px" }}>
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {["#ef4444","#f59e0b","#34d399"].map(c => <span key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />)}
              <span className="ml-2 font-mono text-[11px] uppercase tracking-[.06em]" style={{ color: "var(--text-ter)" }}>
                scout@demoforge — analysis log
              </span>
              {!done && !error && (
                <div className="ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.06em]" style={{ color: "var(--brand-light)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand-light)", animation: "pulse 1.4s ease-in-out infinite" }} />
                  Scanning
                </div>
              )}
            </div>
            <div ref={bodyRef} className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-0">
              {lines.map((l, i) => (
                <div key={i} className={`font-mono text-[12px] leading-[1.7] ${l.lvl === "ind" ? "pl-[76px]" : "flex gap-2.5"}`} style={{ color: l.lvl === "ind" ? "var(--text-ter)" : "var(--text-sec)" }}>
                  {l.lvl !== "ind" && (
                    <>
                      <span className="flex-shrink-0 w-[72px]" style={{ color: "var(--text-ter)" }}>{l.ts}</span>
                      <span className="w-12 flex-shrink-0 uppercase tracking-[.04em]" style={{ color: LVL_COLOR[l.lvl] }}>{l.lvl}</span>
                    </>
                  )}
                  <span>{l.body}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Discovery summary */}
          <div className="flex flex-col gap-3 overflow-y-auto">
            {[
              { title: "Repo", items: [`${repo.full_name}`, `Branche : ${repo.branch}`] },
              { title: "Stack détectée", items: pct >= 50 ? ["React / Next.js", "TypeScript strict", "Tailwind CSS"] : ["…"] },
              { title: "Routes détectées", items: pct >= 80 ? ["/dashboard", "/projects/[id]", "/settings"] : ["…"] },
            ].map(card => (
              <div key={card.title} className="p-4 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h3 className="font-mono text-[10.5px] uppercase tracking-[.06em] mb-3" style={{ color: "var(--text-ter)" }}>{card.title}</h3>
                <ul className="flex flex-col gap-1 list-none p-0">
                  {card.items.map(item => (
                    <li key={item} className="font-mono text-[11.5px]" style={{ color: "var(--text)" }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 flex justify-between items-center px-6 py-4 border-t" style={{ background: "var(--surface-glass)", backdropFilter: "blur(14px)", borderColor: "var(--border)" }}>
        <span className="font-mono text-[11px] uppercase tracking-[.06em]" style={{ color: "var(--text-ter)" }}>
          Étape <strong className="font-medium" style={{ color: "var(--text)" }}>03</strong> · 04 — analyse en arrière-plan
        </span>
        <div className="flex gap-2.5">
          <button onClick={onBack} disabled={!error} className="px-4 py-2.5 rounded-lg text-[13px] font-medium disabled:opacity-40" style={{ border: "1px solid var(--border)", color: "var(--text-sec)", background: "transparent" }}>
            Annuler
          </button>
          <button
            disabled={!done}
            onClick={() => { /* onScanComplete appelé automatiquement via Realtime */ }}
            className="px-4 py-2.5 rounded-lg text-[13px] font-medium text-white disabled:opacity-40"
            style={{ background: "var(--brand)" }}
          >
            Voir le récap →
          </button>
        </div>
      </footer>
    </>
  )
}
