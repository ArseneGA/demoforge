"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"

// ─── Types ────────────────────────────────────────────────
interface Step {
  id: string
  order_index: number
  route_path: string
  intent: string
  actions: Array<{ type: string; [k: string]: unknown }>
  duration_s: number
}

interface Annotation {
  id: string
  step_id: string
  text: string
  position: string
  trigger_at_ms: number
  duration_ms: number
  style: string
}

interface DesignTokens {
  colors: Record<string, string>
  typography: { sans?: string; mono?: string; display?: string }
  logo_url: string | null
  favicon_url: string | null
}

interface Props {
  shareLinkId: string
  demo: { id: string; title: string }
  projectName: string
  steps: Step[]
  annotations: Annotation[]
  designTokens: DesignTokens | null
  viewerDevice?: 'mobile' | 'desktop'
  viewerCountry?: string | null
}

// ─── Annotation position → CSS ────────────────────────────
const POSITION_STYLE: Record<string, React.CSSProperties> = {
  "top-right":    { top: "12%", right: "5%" },
  "top-left":     { top: "12%", left: "5%" },
  "bottom-right": { bottom: "18%", right: "5%" },
  "bottom-left":  { bottom: "18%", left: "5%" },
  "top-center":   { top: "12%", left: "50%", transform: "translateX(-50%)" },
  "bottom-center":{ bottom: "18%", left: "50%", transform: "translateX(-50%)" },
  "center":       { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
}

// ─── Route-aware mock app ─────────────────────────────────
function routeLabel(path: string): string {
  if (path === "/") return "Accueil"
  return path.slice(1).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

function MockScreen({ route, tokens, projectRoutes }: { route: string; tokens: DesignTokens | null; projectRoutes?: string[] }) {
  const brand = tokens?.colors?.brand ?? tokens?.colors?.primary ?? "hsl(268 78% 60%)"
  const navItems = projectRoutes && projectRoutes.length > 0
    ? projectRoutes.slice(0, 7).map(p => ({ path: p, label: routeLabel(p), icon: "·" }))
    : getNavItems(route)
  const content = getRouteContent(route)

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "var(--bg)", fontFamily: tokens?.typography?.sans ?? "inherit" }}>
      {/* Sidebar */}
      <aside className="flex flex-col flex-shrink-0 px-3 py-4 gap-1" style={{ width: "160px", background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
        <div className="font-bold text-[12px] mb-3 px-2" style={{ fontFamily: tokens?.typography?.display ?? "inherit", color: "var(--text)" }}>
          {tokens?.logo_url
            ? <img src={tokens.logo_url} alt="logo" style={{ height: "20px", objectFit: "contain" }} />
            : "App"
          }
        </div>
        {navItems.map(item => (
          <div key={item.path} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] transition-colors"
            style={route.startsWith(item.path) && item.path !== "/"
              ? { background: `color-mix(in oklab, ${brand} 15%, transparent)`, color: brand, borderLeft: `2px solid ${brand}` }
              : route === "/" && item.path === "/"
              ? { background: `color-mix(in oklab, ${brand} 15%, transparent)`, color: brand }
              : { color: "var(--text-sec)" }
            }
          >
            <span className="text-[10px]">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-hidden px-6 py-5 flex flex-col gap-4">
        {content}
      </main>
    </div>
  )
}

function getNavItems(route: string) {
  const all = [
    { path: "/", label: "Accueil", icon: "⊡" },
    { path: "/dashboard", label: "Dashboard", icon: "◫" },
    { path: "/onboarding", label: "Onboarding", icon: "◎" },
    { path: "/projects", label: "Projets", icon: "▤" },
    { path: "/analytics", label: "Analytics", icon: "▦" },
    { path: "/settings", label: "Paramètres", icon: "◈" },
  ]
  // Add route-specific items that aren't in defaults
  const known = all.map(i => i.path)
  const seg = "/" + route.split("/")[1]
  if (!known.includes(seg) && seg.length > 1) {
    all.splice(1, 0, { path: seg, label: capitalize(seg.slice(1)), icon: "◉" })
  }
  return all.slice(0, 6)
}

function getRouteContent(route: string): React.ReactNode {
  const seg = route.split("/")[1] ?? ""

  if (seg === "" || seg === "home") return <HomeContent />
  if (seg === "dashboard") return <DashboardContent />
  if (seg.startsWith("onboard")) return <OnboardingContent route={route} />
  if (seg === "login" || seg === "signup") return <AuthContent />
  if (seg === "analytics") return <AnalyticsContent />
  if (seg === "settings") return <SettingsContent />
  return <GenericContent route={route} />
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

function HomeContent() {
  return (
    <>
      <div>
        <div className="h-4 w-48 rounded mb-2" style={{ background: "var(--brand)", opacity: 0.7 }} />
        <div className="h-3 w-72 rounded" style={{ background: "var(--surface-raised)" }} />
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {["Démarrer", "Explorer", "Importer"].map(l => (
          <div key={l} className="h-24 rounded-xl flex items-center justify-center font-medium text-[12px]" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-sec)" }}>{l}</div>
        ))}
      </div>
    </>
  )
}

function DashboardContent() {
  return (
    <>
      <div className="h-5 w-40 rounded" style={{ background: "var(--surface-raised)" }} />
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[["128", "Utilisateurs"], ["4.2k", "Sessions"], ["87%", "Rétention"], ["2.4s", "Temps moyen"]].map(([v, l]) => (
          <div key={l} className="px-4 py-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[9px] uppercase tracking-[.04em] mb-1" style={{ color: "var(--text-ter)" }}>{l}</div>
            <div className="font-bold text-[22px]" style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}>{v}</div>
          </div>
        ))}
      </div>
      <div className="flex-1 rounded-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)", minHeight: "80px" }}>
        <div className="px-4 py-2 border-b font-mono text-[9px] uppercase tracking-[.04em]" style={{ borderColor: "var(--border)", color: "var(--text-ter)" }}>Activité · 30 jours</div>
        <svg viewBox="0 0 400 60" preserveAspectRatio="none" style={{ width: "100%", height: "60px" }}>
          <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(268 78% 64%)" stopOpacity=".35"/><stop offset="100%" stopColor="hsl(268 78% 64%)" stopOpacity="0"/></linearGradient></defs>
          <path d="M0 50 L40 42 L80 46 L120 34 L160 38 L200 24 L240 18 L280 12 L320 16 L360 8 L400 4 L400 60 L0 60Z" fill="url(#pg)"/>
          <path d="M0 50 L40 42 L80 46 L120 34 L160 38 L200 24 L240 18 L280 12 L320 16 L360 8 L400 4" fill="none" stroke="hsl(268 78% 76%)" strokeWidth="1.5"/>
        </svg>
      </div>
    </>
  )
}

function OnboardingContent({ route }: { route: string }) {
  const step = route.split("/").filter(Boolean)[1] ?? "welcome"
  const steps = ["welcome", "account-setup", "store-connect", "goals-setup", "complete"]
  const cur = steps.indexOf(step.toLowerCase()) + 1 || 1
  return (
    <>
      {/* Progress */}
      <div className="flex items-center gap-2 mb-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold"
              style={{ background: i < cur ? "var(--brand)" : "var(--surface)", color: i < cur ? "#fff" : "var(--text-ter)", border: i < cur ? "none" : "1px solid var(--border)" }}>
              {i + 1}
            </div>
            {i < steps.length - 1 && <div className="h-px w-8" style={{ background: i < cur - 1 ? "var(--brand)" : "var(--border)" }} />}
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-4 max-w-md">
        <div className="h-5 w-64 rounded" style={{ background: "var(--surface-raised)" }} />
        <div className="h-3 w-80 rounded" style={{ background: "var(--surface-raised)", opacity: 0.6 }} />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
        ))}
        <div className="h-10 rounded-lg flex items-center justify-center font-medium text-[12px] text-white" style={{ background: "var(--brand)" }}>
          Continuer →
        </div>
      </div>
    </>
  )
}

function AuthContent() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-80 flex flex-col gap-3">
        <div className="h-5 w-32 rounded mx-auto" style={{ background: "var(--surface-raised)" }} />
        {["Email", "Mot de passe"].map(l => (
          <div key={l} className="h-10 rounded-lg px-3 flex items-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <span className="font-mono text-[10px]" style={{ color: "var(--text-ter)" }}>{l}</span>
          </div>
        ))}
        <div className="h-10 rounded-lg flex items-center justify-center text-[12px] font-medium text-white" style={{ background: "var(--brand)" }}>Se connecter</div>
      </div>
    </div>
  )
}

function AnalyticsContent() {
  return (
    <>
      <div className="h-5 w-32 rounded" style={{ background: "var(--surface-raised)" }} />
      <div className="flex gap-3">
        {["7j", "30j", "90j"].map(p => (
          <div key={p} className="px-3 py-1 rounded-full font-mono text-[10px]" style={{ background: p === "30j" ? "var(--brand)" : "var(--surface)", color: p === "30j" ? "#fff" : "var(--text-ter)", border: "1px solid var(--border)" }}>{p}</div>
        ))}
      </div>
      <div className="flex-1 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)", minHeight: "100px" }}>
        <svg viewBox="0 0 400 100" preserveAspectRatio="none" style={{ width: "100%", height: "100px" }}>
          <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(268 78% 64%)" stopOpacity=".4"/><stop offset="100%" stopColor="hsl(268 78% 64%)" stopOpacity="0"/></linearGradient></defs>
          <path d="M0 80 L50 70 L100 75 L150 55 L200 60 L250 40 L300 30 L350 20 L400 10 L400 100 L0 100Z" fill="url(#ag)"/>
          <path d="M0 80 L50 70 L100 75 L150 55 L200 60 L250 40 L300 30 L350 20 L400 10" fill="none" stroke="hsl(268 78% 76%)" strokeWidth="2"/>
        </svg>
      </div>
    </>
  )
}

function SettingsContent() {
  return (
    <>
      <div className="h-5 w-32 rounded" style={{ background: "var(--surface-raised)" }} />
      {["Profil", "Notifications", "Intégrations", "Facturation", "Équipe"].map(s => (
        <div key={s} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <span className="text-[12px]" style={{ color: "var(--text)" }}>{s}</span>
          <span style={{ color: "var(--text-ter)" }}>›</span>
        </div>
      ))}
    </>
  )
}

function GenericContent({ route }: { route: string }) {
  return (
    <>
      <div className="h-5 w-48 rounded" style={{ background: "var(--surface-raised)" }} />
      <div className="font-mono text-[10px] uppercase tracking-[.06em]" style={{ color: "var(--text-ter)" }}>{route}</div>
      <div className="flex flex-col gap-2">
        {[80, 60, 90, 45, 70].map((w, i) => (
          <div key={i} className="h-3 rounded" style={{ width: `${w}%`, background: "var(--surface-raised)" }} />
        ))}
      </div>
    </>
  )
}

// ─── Main player ──────────────────────────────────────────
export function DemoPlayer({ shareLinkId, demo, projectName, steps, annotations, designTokens, viewerDevice, viewerCountry }: Props) {
  const [curIdx, setCurIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0) // ms within current step
  const sessionId = useRef(crypto.randomUUID())
  const startTime = useRef(Date.now())
  const curIdxRef = useRef(curIdx)
  curIdxRef.current = curIdx

  const curStep = steps[curIdx] ?? null
  const curAnnotations = curStep ? annotations.filter(a => a.step_id === curStep.id) : []
  const totalDuration = steps.reduce((s, st) => s + st.duration_s, 0)
  const elapsedTotal = steps.slice(0, curIdx).reduce((s, st) => s + st.duration_s, 0) + elapsed / 1000

  // Visible annotations for current step
  const visibleAnnotations = curAnnotations.filter(a =>
    elapsed >= a.trigger_at_ms && elapsed < a.trigger_at_ms + a.duration_ms
  )

  // ─── Player loop ──────────────────────────────────────
  useEffect(() => {
    if (!playing || !curStep) return
    const tick = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 100
        if (next >= curStep.duration_s * 1000) {
          const nextIdx = curIdxRef.current + 1
          if (nextIdx < steps.length) {
            setCurIdx(nextIdx)
            return 0
          } else {
            setPlaying(false)
            return curStep.duration_s * 1000
          }
        }
        return next
      })
    }, 100)
    return () => clearInterval(tick)
  }, [playing, curStep, steps.length])

  // Reset elapsed when step changes
  useEffect(() => { setElapsed(0) }, [curIdx])

  const goTo = useCallback((idx: number) => {
    setCurIdx(Math.max(0, Math.min(steps.length - 1, idx)))
  }, [steps.length])

  // ─── Analytics ───────────────────────────────────────
  useEffect(() => {
    const sb = createClient()
    sb.from('demo_views').insert({
      share_link_id: shareLinkId,
      demo_id: demo.id,
      session_id: sessionId.current,
      user_agent_device: viewerDevice ?? null,
      ip_country: viewerCountry ?? null,
    }).then(() => {})

    return () => {
      const duration = Date.now() - startTime.current
      sb.from('demo_views').update({
        duration_ms: duration,
        ended_at_step_index: curIdxRef.current,
      }).eq('session_id', sessionId.current).then(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const pct = totalDuration > 0 ? (elapsedTotal / totalDuration) * 100 : 0
  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`

  if (steps.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4" style={{ background: "var(--bg)" }}>
        <p className="text-[16px] font-semibold" style={{ color: "var(--text)" }}>{demo.title}</p>
        <p className="font-mono text-[12px]" style={{ color: "var(--text-ter)" }}>Cette démo n'a pas encore d'étapes.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: "100vh", background: "var(--bg)", overflow: "hidden" }}>

      {/* ── Top bar ── */}
      <header className="flex-shrink-0 flex items-center gap-4 px-5 border-b" style={{ height: "52px", background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold tracking-[-0.02em] truncate">{demo.title}</div>
          <div className="font-mono text-[10px] uppercase tracking-[.04em]" style={{ color: "var(--text-ter)" }}>
            {projectName} · {steps.length} étapes · {fmtTime(totalDuration)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex-1 max-w-xs">
          <div className="relative h-[3px] rounded-full overflow-hidden" style={{ background: "var(--surface-raised)" }}>
            <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-100" style={{ width: `${pct}%`, background: "var(--brand)" }} />
          </div>
          <div className="flex justify-between font-mono text-[9px] mt-0.5" style={{ color: "var(--text-ter)" }}>
            <span>{fmtTime(elapsedTotal)}</span>
            <span>{fmtTime(totalDuration)}</span>
          </div>
        </div>

        <div className="font-mono text-[10px] uppercase tracking-[.04em]" style={{ color: "var(--text-ter)" }}>
          <span style={{ color: "var(--brand-light)" }}>{String(curIdx + 1).padStart(2, "0")}</span> / {steps.length}
        </div>
      </header>

      {/* ── Main ── */}
      <div className="flex-1 min-h-0 relative flex flex-col">

        {/* Intent bar */}
        {curStep && (
          <div className="flex-shrink-0 px-6 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] font-bold text-white flex-shrink-0" style={{ background: "var(--brand)" }}>
                {String(curIdx + 1).padStart(2, "0")}
              </div>
              <p className="text-[13.5px] leading-snug flex-1" style={{ color: "var(--text)" }}>{curStep.intent}</p>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[9.5px] uppercase tracking-[.04em] flex-shrink-0"
                style={{ background: "var(--brand-dim)", color: "var(--brand-light)", border: "1px solid var(--brand)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand)", animation: playing ? "pulse 1s infinite" : "none" }} />
                {curStep.actions?.[0]?.type ?? "nav"} · {curStep.route_path}
              </div>
            </div>
          </div>
        )}

        {/* Browser frame */}
        <div className="flex-1 min-h-0 flex items-center justify-center px-8 py-5 relative">
          <div className="flex flex-col overflow-hidden w-full h-full" style={{ maxWidth: "960px", maxHeight: "560px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", boxShadow: "0 24px 60px -20px rgba(0,0,0,.8)" }}>
            {/* Browser chrome */}
            <div className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2 border-b" style={{ background: "var(--surface-raised)", borderColor: "var(--border)" }}>
              <div className="flex gap-1.5">
                {["#ef4444","#f59e0b","#34d399"].map(c => <span key={c} className="w-[9px] h-[9px] rounded-full" style={{ background: c }} />)}
              </div>
              <div className="flex-1 px-3 py-1 rounded font-mono text-[11px]" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-sec)" }}>
                {projectName}<strong style={{ color: "var(--brand-light)" }}>{curStep?.route_path ?? "/"}</strong>
              </div>
              <div className="flex gap-2">
                <span className="font-mono text-[9px] px-2 py-0.5 rounded" style={{ background: "color-mix(in oklab, var(--success) 14%, transparent)", color: "var(--success)", border: "1px solid color-mix(in oklab, var(--success) 28%, transparent)" }}>
                  Live
                </span>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded" style={{ background: "var(--brand-dim)", color: "var(--brand-light)", border: "1px solid var(--brand)" }}>
                  Mocks actifs
                </span>
              </div>
            </div>

            {/* Mock app */}
            <div className="flex-1 min-h-0 relative">
              <MockScreen route={curStep?.route_path ?? "/"} tokens={designTokens} projectRoutes={[...new Set(steps.map(s => s.route_path))]} />

              {/* Annotation overlays */}
              {visibleAnnotations.map(a => (
                <div key={a.id} className="absolute z-30 max-w-[220px]" style={{ ...(POSITION_STYLE[a.position] ?? POSITION_STYLE["top-right"]), animation: "annotIn 0.3s ease" }}>
                  <div className="px-3 py-2 rounded-lg text-[12px] leading-[1.45] text-white" style={{ background: "var(--agent-4)", boxShadow: "0 8px 20px rgba(0,0,0,.5)" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0" style={{ background: "rgba(255,255,255,.25)" }}>!</span>
                      <span className="font-mono text-[9px] uppercase tracking-[.04em] opacity-70">{a.style}</span>
                    </div>
                    {a.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Transport ── */}
        <div className="flex-shrink-0 flex items-center gap-4 px-6 py-4 border-t" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <button onClick={() => goTo(curIdx - 1)} disabled={curIdx === 0}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
            style={{ border: "1px solid var(--border)", color: "var(--text-sec)", background: "transparent" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
          </button>

          <button onClick={() => setPlaying(p => !p)}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white transition-all"
            style={{ background: "var(--brand)", boxShadow: playing ? "0 0 0 4px color-mix(in oklab, var(--brand) 30%, transparent)" : "none" }}>
            {playing
              ? <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              : <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            }
          </button>

          <button onClick={() => goTo(curIdx + 1)} disabled={curIdx === steps.length - 1}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
            style={{ border: "1px solid var(--border)", color: "var(--text-sec)", background: "transparent" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
          </button>

          {/* Step strip */}
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto">
            {steps.map((s, i) => (
              <button key={s.id} onClick={() => goTo(i)}
                className="flex-shrink-0 h-8 rounded-lg font-mono text-[10px] px-2.5 transition-all"
                style={i === curIdx
                  ? { background: "var(--brand)", color: "#fff", border: "1px solid var(--brand)", minWidth: "80px" }
                  : { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-ter)", minWidth: "40px" }
                }
              >
                {String(i + 1).padStart(2, "0")}
                {i === curIdx && <span className="ml-1 truncate" style={{ maxWidth: "120px", display: "inline-block", verticalAlign: "middle" }}> · {s.route_path}</span>}
              </button>
            ))}
          </div>

          {/* Watermark */}
          <a href="/" className="flex items-center gap-1.5 no-underline flex-shrink-0" style={{ color: "var(--text-ter)" }}>
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[.04em]">DemoForge</span>
          </a>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
        @keyframes annotIn { from { opacity: 0; transform: translateY(-6px) scale(.96); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  )
}
