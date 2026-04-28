"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { AnalyticsPanel } from "./AnalyticsPanel"
import { CommentsPanel } from "./CommentsPanel"
import { usePostHog } from "posthog-js/react"

// ─── Types ────────────────────────────────────────────────
export interface RealStep {
  id: string
  order_index: number
  route_path: string
  intent: string
  actions: Array<{ type: string; [k: string]: unknown }>
  duration_s: number
  transition_in: string
}

export interface RealAnnotation {
  id: string
  step_id: string
  target_selector: string | null
  position: string
  text: string
  trigger_at_ms: number
  duration_ms: number
  style: string
}

export interface RealMock {
  id: string
  endpoint_method: string
  endpoint_path: string
  latency_ms: number
}

interface EditorProps {
  demo: { id: string; title: string; status: string; project_id: string }
  project: { repo_full_name: string; branch: string; framework: string | null }
  steps: RealStep[]
  annotations: RealAnnotation[]
  mocks: RealMock[]
  orgId: string
}

// ─── Constants ────────────────────────────────────────────
const TOOL_BTNS = [
  { title: "Sélectionner",      svg: <path d="M5 3l14 8-7 2-2 7-5-17z"/> },
  { title: "Ajouter étape",     svg: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></> },
  { title: "Annotation",        svg: <><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></> },
  { title: "Mock data",         svg: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6"/></> },
]

const ACTION_TYPES = ["click", "type", "nav", "wait", "highlight", "scroll"]

// ─── Static preview (S5 — pas encore connectée au vrai repo) ──
function routeLabel(path: string): string {
  if (path === "/") return "Accueil"
  return path.slice(1).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

function MockApp({ routePath, projectRoutes }: { routePath: string; projectRoutes?: string[] }) {
  return (
    <div className="relative grid overflow-hidden" style={{ gridTemplateColumns: "140px 1fr", flex: 1, minHeight: 0, background: "var(--bg)" }}>
      <aside className="flex flex-col px-2.5 py-2.5 gap-0.5 overflow-hidden" style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
        <div className="font-bold text-[11px] pb-2 mb-1.5 border-b" style={{ fontFamily: "var(--font-display)", borderColor: "var(--border)" }}>App</div>
        {(projectRoutes && projectRoutes.length > 0 ? projectRoutes.slice(0, 7) : ["/", "/dashboard", "/projects", "/settings"]).map(r => (
          <div key={r} className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px]"
            style={r === routePath || (routePath.startsWith(r) && r !== "/")
              ? { background: "var(--brand-dim)", color: "var(--brand-light)" }
              : { color: "var(--text-sec)" }
            }
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: r === routePath ? "var(--brand)" : "var(--surface-raised)" }} />
            <span className="text-[9px] truncate">{routeLabel(r)}</span>
          </div>
        ))}
      </aside>
      <main className="px-4 py-3 flex flex-col gap-2.5 overflow-hidden">
        <div className="font-mono text-[9px] uppercase tracking-[.06em] mb-1" style={{ color: "var(--text-ter)" }}>Aperçu · {routePath}</div>
        <div className="flex flex-col gap-1.5">
          {[80, 55, 90, 40, 70].map((w, i) => (
            <div key={i} className="h-[8px] rounded" style={{ width: `${w}%`, background: i === 0 ? "var(--brand-dim)" : "var(--surface-raised)", border: i === 0 ? "1px solid var(--brand)" : "none" }} />
          ))}
        </div>
        <div className="mt-2 grid gap-1.5" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          {["KPI 1", "KPI 2", "KPI 3"].map(k => (
            <div key={k} className="h-14 rounded-lg flex flex-col items-center justify-center gap-1" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="font-mono text-[8px] uppercase tracking-[.04em]" style={{ color: "var(--text-ter)" }}>{k}</div>
              <div className="font-bold text-[14px]" style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}>—</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

// ─── Main shell ───────────────────────────────────────────
export function EditorShell({ demo, project, steps: initialSteps, annotations: initialAnnotations, mocks, orgId }: EditorProps) {
  const sb = useRef(createClient())

  const [steps, setSteps] = useState<RealStep[]>(initialSteps)
  const [annotations, setAnnotations] = useState<RealAnnotation[]>(initialAnnotations)
  const [curIdx, setCurIdx] = useState(0)
  const [activeTool, setActiveTool] = useState(0)
  const [activeInspectTab, setActiveInspectTab] = useState(0)
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved")
  const [lastSaved, setLastSaved] = useState<Date>(new Date())
  const ph = usePostHog()
  const [activeEdTab, setActiveEdTab] = useState<"editor" | "analytics">("editor")
  const [sharePanel, setSharePanel] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debounceSave = useCallback((fn: () => Promise<void>) => {
    setSaveStatus("unsaved")
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaveStatus("saving")
      await fn()
      setSaveStatus("saved")
      setLastSaved(new Date())
    }, 1500)
  }, [])

  const curStep = steps[curIdx] ?? null
  const curAnnotations = curStep ? annotations.filter(a => a.step_id === curStep.id) : []
  const totalDuration = steps.reduce((s, step) => s + step.duration_s, 0)

  // ─── Step mutations ───────────────────────────────────
  function handleDurationChange(stepId: string, val: number) {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, duration_s: val } : s))
    debounceSave(async () => { await sb.current.from("steps").update({ duration_s: val }).eq("id", stepId) })
  }

  function handleActionTypeChange(stepId: string, type: string) {
    setSteps(prev => prev.map(s => {
      if (s.id !== stepId) return s
      const acts = s.actions.length > 0
        ? [{ ...s.actions[0], type }, ...s.actions.slice(1)]
        : [{ type }]
      return { ...s, actions: acts }
    }))
    const step = steps.find(s => s.id === stepId)
    if (!step) return
    const acts = step.actions.length > 0
      ? [{ ...step.actions[0], type }, ...step.actions.slice(1)]
      : [{ type }]
    debounceSave(async () => { await sb.current.from("steps").update({ actions: acts }).eq("id", stepId) })
  }

  function handleAnnotationText(annotId: string, text: string) {
    setAnnotations(prev => prev.map(a => a.id === annotId ? { ...a, text } : a))
    debounceSave(async () => { await sb.current.from("annotations").update({ text }).eq("id", annotId) })
  }

  async function addStep() {
    const newOrder = steps.length + 1
    const { data } = await sb.current.from("steps").insert({
      demo_id: demo.id,
      order_index: newOrder,
      route_path: "/",
      intent: "Nouvelle étape",
      actions: [],
      duration_s: 10,
      transition_in: "cut",
    }).select().single()
    if (data) {
      setSteps(prev => [...prev, data as RealStep])
      setCurIdx(steps.length)
    }
  }

  async function deleteStep(stepId: string) {
    await sb.current.from("steps").delete().eq("id", stepId)
    setSteps(prev => {
      const next = prev.filter(s => s.id !== stepId)
      if (curIdx >= next.length) setCurIdx(Math.max(0, next.length - 1))
      return next
    })
    setAnnotations(prev => prev.filter(a => a.step_id !== stepId))
  }

  // ─── Save indicator text ──────────────────────────────
  const saveLabel = saveStatus === "saving" ? "Sauvegarde…"
    : saveStatus === "unsaved" ? "Modifications non sauvegardées"
    : (() => {
      const secs = Math.round((Date.now() - lastSaved.getTime()) / 1000)
      return secs < 5 ? "Auto-sauvegardé · à l'instant" : `Auto-sauvegardé · il y a ${secs}s`
    })()

  // Refresh the "il y a Xs" label every 10s
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 10000)
    return () => clearInterval(t)
  }, [])

  // Primary action type of current step
  const primaryActionType = curStep?.actions?.[0]?.type as string ?? "nav"

  const fmtDuration = (s: number) => s >= 60 ? `${Math.floor(s / 60)}m${s % 60 > 0 ? s % 60 + "s" : ""}` : `${s}s`

  return (
    <div className="flex flex-col" style={{ height: "100vh", background: "var(--bg)", overflow: "hidden" }}>

      {/* ── Top bar ── */}
      <header
        className="flex-shrink-0 flex items-center gap-3 px-4 border-b"
        style={{ height: "50px", background: "var(--surface)", borderColor: "var(--border)", zIndex: 30 }}
      >
        <Link href={`/chat?demo_id=${demo.id}`} className="font-mono text-[11px] uppercase tracking-[.04em] no-underline px-2 py-1.5 rounded-lg transition-colors" style={{ color: "var(--text-ter)" }}>
          ← Chat
        </Link>
        <div className="w-px h-5" style={{ background: "var(--border)" }} />
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold truncate">{demo.title}</div>
          <div className="font-mono text-[10px] uppercase tracking-[.04em]" style={{ color: "var(--text-ter)" }}>
            {steps.length} étape{steps.length !== 1 ? "s" : ""} · {fmtDuration(totalDuration)}
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10.5px]" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-sec)" }}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55 0-.27-.01-.99-.01-1.95-3.2.69-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.93 10.93 0 015.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.66.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
          </svg>
          <strong style={{ color: "var(--text)" }}>{project.repo_full_name}</strong> · {project.branch}
        </div>

        <div className="font-mono text-[10px] uppercase tracking-[.04em] flex items-center gap-1.5" style={{ color: "var(--text-ter)" }}>
          <span className="w-[5px] h-[5px] rounded-full" style={{ background: saveStatus === "saved" ? "var(--success)" : "var(--warn)", animation: saveStatus === "saving" ? "pulse 1s infinite" : "none" }} />
          {saveLabel}
        </div>

        {/* Ed tabs */}
        <div className="flex gap-0.5 mx-2">
          {(["editor", "analytics"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveEdTab(tab)}
              className="px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[.04em] rounded-lg transition-colors"
              style={activeEdTab === tab
                ? { background: "var(--surface-raised)", color: "var(--text)" }
                : { background: "transparent", color: "var(--text-ter)" }
              }
            >
              {tab === "editor" ? "Éditeur" : "Analytics"}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-1.5 relative">
          <button
            onClick={() => setSharePanel(p => !p)}
            className="px-3 py-1.5 rounded-lg font-mono text-[11px] uppercase tracking-[.04em] transition-colors"
            style={{ border: "1px solid var(--border)", color: sharePanel ? "var(--brand-light)" : "var(--text-sec)", background: sharePanel ? "var(--brand-dim)" : "transparent" }}
          >
            Partager
          </button>
          {shareUrl && (
            <a href={shareUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] uppercase tracking-[.04em] text-white no-underline transition-all"
              style={{ background: "var(--brand)", border: "1px solid var(--brand)" }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Présenter
            </a>
          )}
          {!shareUrl && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] uppercase tracking-[.04em] text-white transition-all opacity-50" disabled style={{ background: "var(--brand)", border: "1px solid var(--brand)" }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Présenter
            </button>
          )}

          {/* Share panel */}
          {sharePanel && (
            <div className="absolute top-full right-0 mt-2 z-50 w-80 rounded-xl p-4 flex flex-col gap-3" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 16px 40px rgba(0,0,0,.5)" }}>
              <div className="font-mono text-[10px] uppercase tracking-[.06em]" style={{ color: "var(--text-ter)" }}>Partager la démo</div>
              {shareUrl ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--bg)", border: "1px solid var(--brand)" }}>
                    <span className="font-mono text-[11px] flex-1 truncate" style={{ color: "var(--brand-light)" }}>{shareUrl}</span>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                    className="w-full py-2 rounded-lg font-mono text-[11px] uppercase tracking-[.04em] transition-all"
                    style={{ background: copied ? "var(--success)" : "var(--brand)", color: "#fff", border: "none" }}
                  >
                    {copied ? "✓ Copié !" : "Copier le lien"}
                  </button>
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="text-center font-mono text-[10px] uppercase tracking-[.04em] no-underline" style={{ color: "var(--text-ter)" }}>
                    Ouvrir →
                  </a>
                </>
              ) : (
                <>
                  <p className="text-[12px]" style={{ color: "var(--text-sec)" }}>
                    Génère un lien public pour partager cette démo sans authentification.
                  </p>
                  <button
                    disabled={shareLoading}
                    onClick={async () => {
                      setShareLoading(true)
                      try {
                        const res = await fetch("/api/share-links", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ demo_id: demo.id, org_id: orgId, visibility: "public" }),
                        })
                        const data = await res.json()
                        if (data.token) {
                          setShareUrl(`${window.location.origin}/d/${data.token}`)
                          ph?.capture("demo_shared", { demo_id: demo.id, visibility: "public" })
                        }
                      } finally {
                        setShareLoading(false)
                      }
                    }}
                    className="w-full py-2.5 rounded-lg font-mono text-[11px] uppercase tracking-[.04em] text-white transition-all disabled:opacity-60"
                    style={{ background: "var(--brand)", border: "none" }}
                  >
                    {shareLoading ? "Génération…" : "Créer un lien public"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Analytics view ── */}
      {activeEdTab === "analytics" && (
        <div className="flex-1 min-h-0" style={{ background: "var(--bg)" }}>
          <AnalyticsPanel demoId={demo.id} />
        </div>
      )}

      {/* ── Main grid ── */}
      {activeEdTab === "editor" && <main
        className="flex-1 min-h-0 grid"
        style={{
          gridTemplateColumns: "56px 1fr 340px",
          gridTemplateRows: "1fr 210px",
          gridTemplateAreas: '"rail preview inspect" "rail steps steps"',
        }}
      >
        {/* ── Tool rail ── */}
        <aside className="flex flex-col items-center py-2.5 gap-1" style={{ gridArea: "rail", background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
          {TOOL_BTNS.map((t, i) => (
            <button key={t.title} onClick={() => setActiveTool(i)} title={t.title}
              className="w-9 h-9 rounded-[7px] flex items-center justify-center transition-all"
              style={activeTool === i
                ? { color: "var(--brand-light)", background: "var(--brand-dim)" }
                : { color: "var(--text-ter)", background: "transparent" }
              }
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17">{t.svg}</svg>
            </button>
          ))}
          <div className="flex-1" />
          <Link href={`/chat?demo_id=${demo.id}`} className="relative w-9 h-9 rounded-[7px] flex items-center justify-center no-underline" style={{ color: "var(--brand-light)" }} title="Demander aux agents">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </Link>
        </aside>

        {/* ── Preview ── */}
        <section className="flex flex-col min-h-0" style={{ gridArea: "preview", background: "var(--bg)" }}>
          <div className="flex-shrink-0 flex justify-between items-center px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[.04em]" style={{ color: "var(--text-ter)" }}>
              Aperçu · étape <span style={{ color: "var(--brand-light)" }}>{String(curIdx + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</span>
            </div>
            {curStep && (
              <div className="flex gap-3.5 font-mono text-[10.5px] uppercase tracking-[.04em]" style={{ color: "var(--text-ter)" }}>
                <span>Route · <span style={{ color: "var(--brand-light)" }}>{curStep.route_path}</span></span>
                <span>Annotations · <span style={{ color: "var(--brand-light)" }}>{curAnnotations.length}</span></span>
                <span>Mocks · <span style={{ color: "var(--brand-light)" }}>{mocks.length}</span></span>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 flex items-center justify-center px-6 py-4 relative overflow-hidden">
            {curStep && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-[.06em] whitespace-nowrap"
                style={{ background: "var(--surface)", backdropFilter: "blur(14px)", border: "1px solid var(--brand)", boxShadow: "var(--brand-glow)" }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--brand)", animation: "pulse 1.4s ease-in-out infinite" }} />
                <span style={{ color: "var(--brand-light)", fontWeight: 600 }}>{primaryActionType.toUpperCase()}</span>
                <span style={{ color: "var(--text)" }}>→ {curStep.route_path}</span>
                {curAnnotations.length > 0 && <span style={{ color: "var(--text-ter)" }}>+ {curAnnotations.length} annotation{curAnnotations.length > 1 ? "s" : ""}</span>}
              </div>
            )}

            <div className="flex flex-col overflow-hidden" style={{ width: "100%", maxWidth: "780px", height: "100%", maxHeight: "420px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", boxShadow: "0 20px 50px -15px rgba(0,0,0,.7)" }}>
              <div className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2 border-b" style={{ background: "var(--surface-raised)", borderColor: "var(--border)" }}>
                <div className="flex gap-1.5">
                  {["#ef4444","#f59e0b","#34d399"].map(c => <span key={c} className="w-[9px] h-[9px] rounded-full" style={{ background: c }} />)}
                </div>
                <div className="flex-1 px-2.5 py-1 rounded text-[11px] font-mono" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-sec)" }}>
                  {project.repo_full_name}<strong style={{ color: "var(--brand-light)" }}>{curStep?.route_path ?? "/"}</strong>
                </div>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded uppercase tracking-[.04em]" style={{ background: "color-mix(in oklab, var(--success) 14%, transparent)", color: "var(--success)", border: "1px solid color-mix(in oklab, var(--success) 28%, transparent)" }}>
                  S5 · aperçu statique
                </span>
              </div>
              <MockApp routePath={curStep?.route_path ?? "/"} projectRoutes={[...new Set(steps.map(s => s.route_path))]} />
            </div>
          </div>

          {/* Transport */}
          <div className="flex-shrink-0 flex items-center gap-3.5 px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <button onClick={() => setCurIdx(i => Math.max(0, i - 1))} className="w-[30px] h-[30px] rounded-lg flex items-center justify-center" style={{ color: curIdx === 0 ? "var(--text-ter)" : "var(--text-sec)", background: "transparent", border: "1px solid transparent" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
            </button>
            <button className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-white" style={{ background: "var(--brand)" }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
            <button onClick={() => setCurIdx(i => Math.min(steps.length - 1, i + 1))} className="w-[30px] h-[30px] rounded-lg flex items-center justify-center" style={{ color: curIdx === steps.length - 1 ? "var(--text-ter)" : "var(--text-sec)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
            </button>
            <div className="font-mono text-[12.5px]" style={{ fontVariantNumeric: "tabular-nums" }}>
              Étape <span style={{ color: "var(--brand-light)" }}>{String(curIdx + 1).padStart(2, "0")}</span> / {steps.length}
              <span className="mx-2" style={{ color: "var(--text-ter)" }}>·</span>
              {fmtDuration(steps.slice(0, curIdx + 1).reduce((s, st) => s + st.duration_s, 0))} <span style={{ color: "var(--text-ter)" }}>/ {fmtDuration(totalDuration)}</span>
            </div>
          </div>
        </section>

        {/* ── Inspector ── */}
        <aside className="flex flex-col min-h-0" style={{ gridArea: "inspect", background: "var(--surface)", borderLeft: "1px solid var(--border)" }}>
          <div className="flex-shrink-0 flex gap-0.5 p-2 border-b" style={{ borderColor: "var(--border)" }}>
            {["Étape", "Mocks", "Annotations", "Commentaires"].map((t, i) => (
              <button key={t} onClick={() => setActiveInspectTab(i)}
                className="flex-1 py-1.5 font-mono text-[10.5px] uppercase tracking-[.04em] rounded-lg transition-colors"
                style={activeInspectTab === i
                  ? { background: "var(--surface-raised)", color: "var(--text)" }
                  : { background: "transparent", color: "var(--text-ter)" }
                }
              >
                {t}
              </button>
            ))}
          </div>

          {activeInspectTab === 3 && (
            <CommentsPanel
              demoId={demo.id}
              stepId={curStep?.id ?? null}
              stepLabel={curStep ? String(curIdx + 1).padStart(2, "0") : ""}
            />
          )}
          <div className="flex-1 overflow-y-auto px-4 py-3.5 flex flex-col gap-4" style={{ display: activeInspectTab === 3 ? "none" : undefined }}>

            {/* ── TAB ÉTAPE ── */}
            {activeInspectTab === 0 && curStep && (
              <div>
                <div className="flex justify-between font-mono text-[10px] uppercase tracking-[.08em] mb-2.5 pb-1.5 border-b" style={{ color: "var(--text-ter)", borderColor: "var(--border)" }}>
                  <span>Étape sélectionnée</span>
                  <span style={{ color: "var(--brand-light)" }}>{String(curIdx + 1).padStart(2, "0")} / {steps.length}</span>
                </div>
                <div className="px-3.5 py-3 rounded-xl" style={{ background: "var(--bg)", border: "1px solid var(--brand)" }}>
                  <div className="flex items-start gap-2.5 mb-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold text-white flex-shrink-0" style={{ background: "var(--brand)" }}>
                      {String(curIdx + 1).padStart(2, "0")}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold leading-tight">{curStep.intent}</div>
                      <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--text-ter)" }}>{curStep.route_path}</div>
                    </div>
                  </div>

                  {/* Action type picker */}
                  <div className="mb-3">
                    <label className="font-mono text-[10px] uppercase tracking-[.06em] mb-1.5 block" style={{ color: "var(--text-ter)" }}>Action principale</label>
                    <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                      {ACTION_TYPES.map(a => (
                        <button key={a} onClick={() => handleActionTypeChange(curStep.id, a)}
                          className="py-1.5 rounded-lg font-mono text-[9.5px] uppercase tracking-[.04em] transition-colors"
                          style={a === primaryActionType
                            ? { background: "var(--brand)", color: "#fff", border: "1px solid var(--brand)" }
                            : { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-sec)" }
                          }
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration slider */}
                  <div className="mb-2">
                    <label className="flex justify-between font-mono text-[10px] uppercase tracking-[.06em] mb-1.5" style={{ color: "var(--text-ter)" }}>
                      Durée <span style={{ color: "var(--text-sec)", fontWeight: 500, textTransform: "none" }}>{curStep.duration_s}s</span>
                    </label>
                    <input
                      type="range" min={2} max={60} value={curStep.duration_s}
                      onChange={e => handleDurationChange(curStep.id, Number(e.target.value))}
                      className="w-full h-[3px]" style={{ accentColor: "var(--brand)" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeInspectTab === 0 && !curStep && (
              <div className="text-center py-8">
                <p className="font-mono text-[10px] uppercase tracking-[.06em]" style={{ color: "var(--text-ter)" }}>Aucune étape — clique sur "+ étape" pour commencer</p>
              </div>
            )}

            {/* ── TAB MOCKS ── */}
            {activeInspectTab === 1 && (
              <div>
                <div className="flex justify-between font-mono text-[10px] uppercase tracking-[.08em] mb-2.5 pb-1.5 border-b" style={{ color: "var(--text-ter)", borderColor: "var(--border)" }}>
                  <span>Mocks API</span><span style={{ color: "var(--brand-light)" }}>{mocks.length}</span>
                </div>
                {mocks.length === 0 ? (
                  <p className="font-mono text-[11px]" style={{ color: "var(--text-ter)" }}>Aucun mock généré — relance Faker depuis le chat.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {mocks.map(m => (
                      <div key={m.id} className="grid items-center gap-2 px-3 py-2 rounded-lg" style={{ gridTemplateColumns: "auto 1fr auto", background: "var(--bg)", border: "1px solid var(--border)" }}>
                        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: "color-mix(in oklab, var(--success) 14%, transparent)", color: "var(--success)" }}>{m.endpoint_method}</span>
                        <span className="font-mono text-[11px] truncate" style={{ color: "var(--text)" }}>{m.endpoint_path}</span>
                        <span className="font-mono text-[9.5px]" style={{ color: "var(--text-ter)" }}>{m.latency_ms}ms</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB ANNOTATIONS ── */}
            {activeInspectTab === 2 && (
              <div>
                <div className="flex justify-between font-mono text-[10px] uppercase tracking-[.08em] mb-2.5 pb-1.5 border-b" style={{ color: "var(--text-ter)", borderColor: "var(--border)" }}>
                  <span>Annotations · étape {curIdx + 1}</span>
                  <span style={{ color: "var(--brand-light)" }}>{curAnnotations.length}</span>
                </div>
                {curAnnotations.length === 0 ? (
                  <p className="font-mono text-[11px]" style={{ color: "var(--text-ter)" }}>Aucune annotation sur cette étape.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {curAnnotations.map(a => (
                      <div key={a.id} className="px-3.5 py-3 rounded-xl" style={{ background: "var(--bg)", border: "1px solid var(--agent-4)" }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] font-bold text-white" style={{ background: "var(--agent-4)" }}>!</div>
                          <div className="font-mono text-[9px] uppercase tracking-[.04em]" style={{ color: "var(--agent-4)" }}>{a.position} · {a.trigger_at_ms}ms</div>
                        </div>
                        <div className="mb-1.5">
                          <label className="font-mono text-[10px] uppercase tracking-[.06em] mb-1.5 block" style={{ color: "var(--text-ter)" }}>Texte</label>
                          <input
                            type="text"
                            value={a.text}
                            maxLength={80}
                            onChange={e => handleAnnotationText(a.id, e.target.value)}
                            className="w-full px-3 py-2 rounded-lg font-sans text-[12px] outline-none"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                          />
                        </div>
                        {a.target_selector && (
                          <div className="font-mono text-[9px]" style={{ color: "var(--text-ter)" }}>Cible · {a.target_selector}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ── Steps strip ── */}
        <section className="flex flex-col min-h-0" style={{ gridArea: "steps", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
          <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="font-mono text-[11px] font-medium uppercase tracking-[.06em]">Storyboard</span>
            {[
              [String(steps.length), "étapes"],
              [fmtDuration(totalDuration), "durée"],
              [String(mocks.length), "mocks"],
              [String(annotations.length), "annotations"],
            ].map(([v, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-px h-3.5" style={{ background: "var(--border)" }} />
                <span className="font-mono text-[10.5px] uppercase tracking-[.04em]" style={{ color: "var(--text-ter)" }}>
                  {l} · <strong style={{ color: "var(--brand-light)" }}>{v}</strong>
                </span>
              </div>
            ))}
            <div className="ml-auto">
              <button
                onClick={addStep}
                className="font-mono text-[10.5px] uppercase tracking-[.04em] px-3 py-1.5 rounded-lg transition-colors"
                style={{ border: "1px dashed var(--brand)", color: "var(--brand-light)", background: "transparent" }}
              >
                + étape
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-3.5">
            <div className="flex items-stretch gap-2.5" style={{ height: "100%", minWidth: "max-content" }}>
              {steps.map((s, i) => {
                const stepAnnots = annotations.filter(a => a.step_id === s.id)
                const isActive = i === curIdx
                return (
                  <div key={s.id} className="flex items-center gap-2.5">
                    <div
                      onClick={() => setCurIdx(i)}
                      className="relative flex flex-col overflow-hidden cursor-pointer transition-all group"
                      style={{
                        width: "190px", flexShrink: 0,
                        background: "var(--bg)",
                        border: isActive ? "1px solid var(--brand)" : "1px solid var(--border)",
                        borderRadius: "8px",
                        boxShadow: isActive ? "var(--brand-glow)" : "none",
                      }}
                    >
                      {isActive && <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 font-mono text-[12px]" style={{ color: "var(--brand)" }}>▾</div>}

                      <div className="flex items-center justify-between px-2.5 py-1.5 border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                        <span className="font-mono text-[10px]" style={{ color: isActive ? "var(--brand-light)" : "var(--text-ter)" }}>
                          <strong>{String(s.order_index).padStart(2, "0")}</strong>
                        </span>
                        <span className="font-mono text-[10px]" style={{ color: "var(--text-ter)" }}>{s.duration_s}s</span>
                      </div>

                      <div className="flex flex-col gap-1 p-2 border-b" style={{ background: "linear-gradient(135deg, #2a2735, #1f1d28)", borderColor: "var(--border)", minHeight: "56px" }}>
                        {[70, 90, 50].map((w, j) => (
                          <span key={j} className="block h-[4px] rounded-sm" style={{ width: `${w}%`, background: j === 0 ? "var(--brand-dim)" : "var(--surface-raised)" }} />
                        ))}
                      </div>

                      <div className="px-2.5 py-2 flex flex-col gap-1">
                        <div className="text-[11px] font-medium truncate">{s.intent}</div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded uppercase tracking-[.04em]" style={{ background: "var(--brand-dim)", color: "var(--brand-light)" }}>
                            {s.actions?.[0]?.type ?? "nav"}
                          </span>
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded max-w-[90px] truncate" style={{ background: "var(--surface-raised)", color: "var(--text-sec)", border: "1px solid var(--border)" }}>
                            {s.route_path}
                          </span>
                        </div>
                      </div>

                      {/* Indicators */}
                      <div className="absolute top-1.5 right-1.5 flex gap-0.5">
                        {stepAnnots.length > 0 && (
                          <span className="w-3.5 h-3.5 rounded-sm flex items-center justify-center font-mono text-[8px] font-bold" style={{ background: "var(--agent-4)", color: "#fff" }}>A</span>
                        )}
                      </div>

                      {/* Delete on hover */}
                      <button
                        onClick={e => { e.stopPropagation(); if (confirm("Supprimer cette étape ?")) deleteStep(s.id) }}
                        className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(239,68,68,.15)", color: "#f87171", border: "1px solid rgba(239,68,68,.3)" }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        </svg>
                      </button>
                    </div>

                    {i < steps.length - 1 && (
                      <span className="font-mono text-[14px]" style={{ color: "var(--text-ter)", flexShrink: 0 }}>→</span>
                    )}
                  </div>
                )
              })}

              <span className="font-mono text-[14px] self-center" style={{ color: "var(--text-ter)" }}>→</span>
              <div
                onClick={addStep}
                className="flex items-center justify-center font-mono text-[10.5px] uppercase tracking-[.04em] cursor-pointer transition-all self-stretch"
                style={{ width: "190px", flexShrink: 0, border: "1px dashed var(--border)", borderRadius: "8px", color: "var(--text-ter)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; (e.currentTarget as HTMLElement).style.color = "var(--brand-light)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-ter)" }}
              >
                + ajouter une étape
              </div>
            </div>
          </div>
        </section>
      </main>}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
      `}</style>
    </div>
  )
}
