"use client"

import { useState } from "react"
import Link from "next/link"
import { UpgradeModal } from "@/components/billing/UpgradeModal"

type Status = "rendering" | "published" | "draft" | "review"
type AgentId = "SC" | "DI" | "FA" | "NA"
type EntityType = "demo" | "project"

interface Project {
  id: string
  entityType: EntityType
  title: string
  badge: string
  status: Status
  duration?: string
  renderPct?: number
  draftLabel?: string
  agents: AgentId[]
}


const KPIS = [
  { label: "Projets actifs",  value: "12",      sub: "7 en cours · 5 archivés", accent: true },
  { label: "En rendu",        value: "2",       sub: "~ 4 min restantes" },
  { label: "Publiés ce mois", value: "8",       sub: "+ 2 vs. mois dernier" },
  { label: "Démos publiées",  value: "27 / 30", sub: "Plan Studio · renouv. 12/05" },
]

const FILTER_KEYS = ["all", "draft", "rendering", "published", "review"] as const
const FILTER_LABELS: Record<string, string> = {
  all: "Tous", draft: "Brouillons", rendering: "En rendu", published: "Publiés", review: "Prêts"
}

const AGENT_COLOR: Record<AgentId, string> = {
  SC: "var(--agent-1)",
  DI: "var(--agent-2)",
  FA: "var(--agent-3)",
  NA: "var(--agent-4)",
}

const STATUS_PILL: Record<Status, { bg: string; color: string; border?: string; label: string }> = {
  published: { bg: "color-mix(in oklab, var(--success) 14%, transparent)", color: "var(--success)", label: "Publié" },
  rendering: { bg: "var(--brand-dim)", color: "var(--brand-light)", label: "Rendu en cours" },
  draft:     { bg: "var(--surface-raised)", color: "var(--text-ter)", border: "1px solid var(--border)", label: "Brouillon" },
  review:    { bg: "color-mix(in oklab, var(--warn) 14%, transparent)", color: "var(--warn)", label: "Prêt à partager" },
}

const NAV_ICONS = [
  { href: "/dashboard", title: "Projets", active: true,
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
  { href: "/chat", title: "Chat agentique", active: false,
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { href: "#", title: "Assets", active: false,
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg> },
  { href: "#", title: "Rendus", active: false,
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><polygon points="5 3 19 12 5 21 5 3"/></svg> },
]

function ProjectCard({ p, onDelete, orgId }: { p: Project; onDelete?: (id: string) => void; orgId?: string }) {
  // Normalise les statuts inconnus (ex: "ready") vers "draft"
  const safeStatus: Status = (p.status in STATUS_PILL ? p.status : "draft") as Status
  const pill = STATUS_PILL[safeStatus]
  const isRendering = p.status === "rendering"
  const isDraft = p.status === "draft"
  const hasPlay = p.status === "published" || p.status === "review"

  let href = "#"
  if (p.entityType === "project") {
    href = isDraft ? `/chat?project_id=${p.id}` : "#"
  } else {
    // démo
    if (isDraft || isRendering) href = `/chat?demo_id=${p.id}`
    else if (hasPlay) href = `/storyboard?demo_id=${p.id}`
  }

  return (
    <article
      onClick={() => { if (href !== "#") window.location.href = href }}
      className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200 group relative cursor-pointer"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--border-hover)"
        e.currentTarget.style.transform = "translateY(-3px)"
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,.35)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--border)"
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      {/* Thumbnail */}
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          height: "160px",
          background: isRendering
            ? "linear-gradient(135deg, hsl(268 60% 18%), hsl(268 40% 12%))"
            : isDraft
            ? "#1a1820"
            : "linear-gradient(135deg, #1f1c25, #13111a)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Subtle noise pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 50% 0%, var(--brand-dim), transparent 70%)",
            opacity: isRendering ? 0.6 : 0.3,
          }}
        />

        {/* Badge — top left */}
        <span
          className="absolute top-3 left-3 font-mono text-[10px] px-2.5 py-1 rounded-full uppercase tracking-[.05em] z-10"
          style={{
            background: "rgba(0,0,0,.55)",
            color: "var(--text-sec)",
            border: "1px solid rgba(255,255,255,.08)",
            backdropFilter: "blur(8px)",
          }}
        >
          {p.badge}
        </span>

        {/* Duration — bottom right */}
        {p.duration && (
          <span
            className="absolute bottom-3 right-3 font-mono text-[10px] px-2 py-0.5 rounded z-10"
            style={{ background: "rgba(0,0,0,.65)", color: "#fff", backdropFilter: "blur(6px)" }}
          >
            {p.duration}
          </span>
        )}

        {/* Rendering: spinner */}
        {isRendering && (
          <div className="relative z-10 flex items-center justify-center">
            <div
              className="w-12 h-12 rounded-full"
              style={{
                border: "2px solid rgba(255,255,255,.08)",
                borderTopColor: "var(--brand-light)",
                animation: "spin 1s linear infinite",
              }}
            />
            <span
              className="absolute font-mono text-[12px] font-semibold"
              style={{ color: "var(--brand-light)" }}
            >
              {p.renderPct}%
            </span>
          </div>
        )}

        {/* Draft: text label */}
        {isDraft && (
          <span
            className="font-mono text-[11px] uppercase tracking-[.08em] z-10"
            style={{ color: "var(--text-ter)" }}
          >
            — {p.draftLabel} —
          </span>
        )}

        {/* Play button */}
        {hasPlay && (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center z-10 transition-all duration-200 group-hover:scale-110"
            style={{
              background: "rgba(255,255,255,.07)",
              border: "1px solid rgba(255,255,255,.12)",
              backdropFilter: "blur(8px)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="white" width="13" height="13">
              <path d="M5 3l14 9-14 9V3z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-3 px-5 py-4">
        <p className="text-[14px] font-semibold leading-[1.35] tracking-[-0.01em]">
          {p.title}
        </p>
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-[9.5px] px-2.5 py-1 rounded-full uppercase tracking-[.04em]"
            style={{
              background: pill.bg,
              color: pill.color,
              border: pill.border,
            }}
          >
            {pill.label}
          </span>

          {p.agents.length > 0 && (
            <div className="flex items-center">
              {p.agents.map((av, i) => (
                <div
                  key={av}
                  className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[8px] font-bold border-2"
                  style={{
                    background: `color-mix(in oklab, ${AGENT_COLOR[av]} 45%, #0e0d11)`,
                    color: "#fff",
                    borderColor: "var(--surface)",
                    marginLeft: i === 0 ? 0 : "-5px",
                    zIndex: p.agents.length - i,
                    position: "relative",
                  }}
                >
                  {av}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete button — visible au hover */}
      {onDelete && (
        <button
          onClick={e => { e.stopPropagation(); if (confirm('Supprimer ce projet ?')) onDelete(p.id) }}
          className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          style={{ background: "rgba(239,68,68,.15)", color: "#f87171", border: "1px solid rgba(239,68,68,.3)" }}
          title="Supprimer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      )}
    </article>
  )
}

interface RealProject {
  id: string
  repo_full_name: string
  branch: string
  scan_status: string
  framework: string | null
  github_install_id: string | null
  has_new_commits: boolean
}
interface RealDemo { id: string; title: string; status: string; template_slug: string | null; duration_target_s: number | null; updated_at: string }

interface Props {
  firstName: string
  userEmail: string
  orgId?: string
  orgPlan?: "free" | "forge" | "studio" | "atelier"
  hasStripeCustomer?: boolean
  projects?: RealProject[]
  demos?: RealDemo[]
  activeProjects?: number
}

function demosToProjects(demos: RealDemo[], projects: RealProject[]): Project[] {
  if (projects.length === 0 && demos.length === 0) return []

  if (demos.length === 0) {
    return projects.map(p => ({
      id: p.id,
      entityType: 'project' as EntityType,
      title: p.repo_full_name,
      badge: p.framework ?? 'Repo',
      status: 'draft' as Status,
      draftLabel: p.scan_status === 'ready' ? 'Prêt à scripter' : 'Scan en cours…',
      agents: [],
    }))
  }

  return demos.map(d => ({
    id: d.id,
    entityType: 'demo' as EntityType,
    title: d.title,
    badge: d.template_slug ?? 'Démo',
    status: (d.status === 'ready' ? 'review' : d.status) as Status,
    duration: d.duration_target_s
      ? `${Math.floor(d.duration_target_s / 60)}m${d.duration_target_s % 60 > 0 ? d.duration_target_s % 60 + 's' : ''}`
      : undefined,
    draftLabel: d.status === 'draft' ? 'Brief en cours' : undefined,
    agents: d.status === 'draft' ? [] : (['SC', 'DI', 'FA', 'NA'] as AgentId[]),
  }))
}

export function DashboardShell({ firstName, userEmail, orgId, orgPlan = "free", hasStripeCustomer = false, projects = [], demos = [], activeProjects = 0 }: Props) {
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [rescanning, setRescanning] = useState<string | null>(null)
  const [dismissedStale, setDismissedStale] = useState<Set<string>>(new Set())

  const staleProjects = projects.filter(p => p.has_new_commits && !dismissedStale.has(p.id))

  async function handleRescan(p: RealProject) {
    if (!orgId || !p.github_install_id) return
    setRescanning(p.id)
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          github_install_id: p.github_install_id,
          repo_full_name: p.repo_full_name,
          branch: p.branch,
        }),
      })
      setDismissedStale(prev => new Set([...prev, p.id]))
    } finally {
      setRescanning(null)
    }
  }

  const allProjects = demosToProjects(demos, projects)

  const KPIS_REAL = [
    { label: "Projets actifs",  value: String(activeProjects || projects.filter(p => p.scan_status === 'ready').length), sub: `${projects.length} total`, accent: true },
    { label: "En rendu",        value: String(demos.filter(d => d.status === 'rendering').length), sub: "jobs en cours" },
    { label: "Publiées ce mois", value: String(demos.filter(d => {
      if (d.status !== 'published') return false
      const u = new Date(d.updated_at)
      const n = new Date()
      return u.getMonth() === n.getMonth() && u.getFullYear() === n.getFullYear()
    }).length), sub: "ce mois" },
    { label: "Démos totales",   value: String(demos.length) + (orgPlan === 'free' ? ' / 1' : orgPlan === 'forge' ? ' / 5' : ' / 30'), sub: `Plan ${orgPlan.charAt(0).toUpperCase() + orgPlan.slice(1)}` },
  ]

  const [localProjects, setLocalProjects] = useState(allProjects)

  const visible = localProjects
    .filter(p => filter === "all" || p.status === filter)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()))

  async function handleDelete(id: string) {
    const item = localProjects.find(p => p.id === id)
    setLocalProjects(prev => prev.filter(p => p.id !== id))
    const endpoint = item?.entityType === 'demo' ? `/api/demos/${id}` : `/api/projects/${id}`
    await fetch(endpoint, { method: 'DELETE' }).catch(() => {})
  }

  const counts: Record<string, number> = { all: localProjects.length }
  for (const p of localProjects) {
    counts[p.status] = (counts[p.status] ?? 0) + 1
  }

  const filters = FILTER_KEYS.map(key => ({
    key,
    label: `${FILTER_LABELS[key]} · ${key === "all" ? localProjects.length : (counts[key] ?? 0)}`,
  }))

  return (
    <div className="flex min-h-screen overflow-x-hidden" style={{ background: "var(--bg)" }}>

      {/* ── Rail ── */}
      <aside
        className="flex-shrink-0 flex flex-col items-center py-6 gap-2"
        style={{
          width: "72px",
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <Link href="/" className="mb-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M8 5v14l11-7z" fill="white" />
            </svg>
          </div>
        </Link>

        {NAV_ICONS.map(item => (
          <Link
            key={item.title}
            href={item.href}
            title={item.title}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{
              color: item.active ? "var(--brand-light)" : "var(--text-ter)",
              background: item.active ? "var(--brand-dim)" : "transparent",
            }}
          >
            {item.active && (
              <span
                className="absolute rounded-r-sm"
                style={{
                  left: "-16px", top: "10px", bottom: "10px",
                  width: "2px",
                  background: "var(--brand)",
                }}
              />
            )}
            {item.svg}
          </Link>
        ))}

        <div className="flex-1" />

        {/* Signout / avatar */}
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            title="Se déconnecter"
            className="w-10 h-10 rounded-xl flex items-center justify-center font-mono text-[11px] font-bold transition-colors"
            style={{
              background: "var(--surface-raised)",
              color: "var(--text-sec)",
              border: "1px solid var(--border)",
            }}
          >
            {firstName.slice(0, 2).toUpperCase()}
          </button>
        </form>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 min-w-0 px-12 py-10 flex flex-col gap-10 relative overflow-y-auto">

        {/* Ambient */}
        <div
          className="pointer-events-none absolute -top-32 -right-24 w-[500px] h-[500px] rounded-full"
          style={{
            filter: "blur(120px)",
            background: "radial-gradient(circle, var(--brand-dim), transparent 65%)",
            zIndex: 0,
          }}
        />

        {/* ── Stale project banners ── */}
        {staleProjects.map(p => (
          <div key={p.id} className="relative z-10 flex items-center gap-4 px-5 py-3 rounded-2xl" style={{ background: "color-mix(in oklab, var(--warn) 10%, var(--surface))", border: "1px solid var(--warn)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" style={{ color: "var(--warn)", flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                Nouveaux commits sur <strong>{p.repo_full_name}</strong>
              </span>
              <span className="text-[12px] ml-2" style={{ color: "var(--text-ter)" }}>
                Vos démos peuvent être désynchronisées
              </span>
            </div>
            <button
              onClick={() => handleRescan(p)}
              disabled={rescanning === p.id}
              className="px-4 py-1.5 rounded-lg font-mono text-[10.5px] uppercase tracking-[.04em] transition-all disabled:opacity-60 flex-shrink-0"
              style={{ background: "var(--warn)", color: "#fff", border: "none" }}
            >
              {rescanning === p.id ? "Scan en cours…" : "Re-scanner"}
            </button>
            <button onClick={() => setDismissedStale(prev => new Set([...prev, p.id]))} className="flex-shrink-0" style={{ color: "var(--text-ter)", background: "transparent", border: "none", cursor: "pointer" }}>✕</button>
          </div>
        ))}

        {/* ── Header ── */}
        <div className="relative z-10 flex justify-between items-start gap-6">
          <div>
            <h1
              className="font-semibold tracking-[-0.03em] mb-2"
              style={{ fontFamily: "var(--font-display)", fontSize: "32px", lineHeight: 1.2 }}
            >
              Bonjour{" "}
              <em className="not-italic" style={{ color: "var(--brand-light)" }}>
                {firstName}
              </em>
            </h1>
            <p className="text-[13px]" style={{ color: "var(--text-ter)" }}>
              {projects.length} projet{projects.length !== 1 ? 's' : ''} · {demos.filter(d => d.status === 'published').length} démo{demos.filter(d => d.status === 'published').length !== 1 ? 's' : ''} publiée{demos.filter(d => d.status === 'published').length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0 items-start">
            {orgPlan === "free" ? (
              <button
                onClick={() => setShowUpgrade(true)}
                className="px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                style={{ border: "1px solid var(--brand)", color: "var(--brand-light)", background: "var(--brand-dim)" }}
              >
                ↑ Passer à Forge
              </button>
            ) : (
              <button
                onClick={async () => {
                  if (!orgId || !hasStripeCustomer) { setShowUpgrade(true); return }
                  const res = await fetch("/api/stripe/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ org_id: orgId }) })
                  const data = await res.json()
                  if (data.url) window.location.href = data.url
                }}
                className="px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all capitalize"
                style={{ border: "1px solid var(--border)", color: "var(--text-sec)", background: "transparent" }}
              >
                Plan {orgPlan} · Gérer
              </button>
            )}
            <Link
              href="/onboarding"
              className="px-5 py-2.5 rounded-xl text-[13px] font-medium no-underline transition-all"
              style={{ border: "1px solid var(--border)", color: "var(--text-sec)", background: "transparent" }}
            >
              Importer
            </Link>
            <Link
              href="/chat"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white no-underline"
              style={{ background: "var(--brand)" }}
            >
              + Nouvelle démo
            </Link>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div
          className="relative z-10 rounded-2xl overflow-hidden"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1px",
            background: "var(--border)",
            border: "1px solid var(--border)",
          }}
        >
          {KPIS_REAL.map(k => (
            <div
              key={k.label}
              className="px-8 py-7"
              style={{ background: "var(--surface)" }}
            >
              <p
                className="font-mono text-[10.5px] uppercase tracking-[.06em] mb-3"
                style={{ color: "var(--text-ter)" }}
              >
                {k.label}
              </p>
              <p
                className="font-bold leading-none tracking-[-0.03em] mb-2"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "34px",
                  ...(k.accent
                    ? {
                        background: "linear-gradient(135deg, var(--brand), var(--brand-light))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }
                    : { color: "var(--text)" }),
                }}
              >
                {k.value}
              </p>
              <p className="text-[12.5px]" style={{ color: "var(--text-sec)" }}>
                {k.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="relative z-10 flex justify-between items-center gap-4 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="px-4 py-2 rounded-full font-mono text-[10.5px] uppercase tracking-[.04em] transition-all border"
                style={
                  filter === f.key
                    ? { background: "var(--brand-dim)", borderColor: "transparent", color: "var(--brand-light)" }
                    : { background: "transparent", borderColor: "var(--border)", color: "var(--text-sec)" }
                }
              >
                {f.label}
              </button>
            ))}
          </div>

          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
            style={{ width: "260px", border: "1px solid var(--border)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14" style={{ color: "var(--text-ter)", flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une démo…"
              className="flex-1 bg-transparent border-0 outline-none text-[13px]"
              style={{ color: "var(--text)", fontFamily: "var(--font-sans)" }}
            />
          </div>
        </div>

        {/* ── Project grid ── */}
        <div
          className="relative z-10 grid gap-5 pb-10"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
        >
          {visible.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
              <p className="font-mono text-[12px] uppercase tracking-[.08em]" style={{ color: "var(--text-ter)" }}>
                {projects.length === 0 ? "Aucun repo connecté" : "Aucune démo dans cette catégorie"}
              </p>
              {projects.length === 0 && (
                <a href="/onboarding" className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-white no-underline" style={{ background: "var(--brand)" }}>
                  Connecter un repo →
                </a>
              )}
              {projects.length > 0 && demos.length === 0 && (
                <a href="/chat" className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-white no-underline" style={{ background: "var(--brand)" }}>
                  + Créer une première démo
                </a>
              )}
            </div>
          ) : (
            visible.map(p => <ProjectCard key={p.id} p={p} onDelete={handleDelete} orgId={orgId} />)
          )}
        </div>
      </main>
      {showUpgrade && orgId && (
        <UpgradeModal
          orgId={orgId}
          currentPlan={orgPlan}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  )
}
