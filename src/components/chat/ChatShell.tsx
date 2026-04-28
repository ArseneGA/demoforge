"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { usePostHog } from "posthog-js/react"

// ─── Constants ────────────────────────────────────────────
const AGENT_COLOR = {
  SC: "var(--agent-1)",
  DI: "var(--agent-2)",
  FA: "var(--agent-3)",
  NA: "var(--agent-4)",
} as const

const CONVS = [
  { name: "Onboarding nouveau client",    time: "14:14", preview: "Director · 6 étapes · parcours A",       agents: ["SC","DI","FA","NA"], active: true },
  { name: "Édition projet existant",       time: "11:02", preview: "Faker · 24 projets factices générés",   agents: ["DI","FA"] },
  { name: "Démo feature Webhooks",         time: "Hier",  preview: "Director · 4 étapes scriptées",         agents: ["DI","NA"] },
  { name: "Pitch série A — flow signup",   time: "Hier",  preview: "Vous · \"skippe l'étape 3\"",           agents: ["SC","DI","NA"] },
  { name: "Tutoriel intégration API",      time: "Lun",   preview: "Narrator · 8 annotations posées",      agents: ["SC","NA"] },
  { name: "Démo investisseur Q1",          time: "Lun",   preview: "Faker · KPIs cohérents générés",        agents: ["SC","FA"] },
  { name: "Walkthrough admin panel",       time: "Sam",   preview: "Director · 12 étapes · branchements",   agents: ["DI","NA"] },
  { name: "Démo client Vault",             time: "12 avr",preview: "Export final livré",                    agents: ["FA","NA"] },
]

// ─── Message sub-components ───────────────────────────────

function PageRow({ n, route, desc, match, pct }: { n: string; route: string; desc: string; match?: boolean; pct: number }) {
  return (
    <div
      className="grid items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all"
      style={{
        gridTemplateColumns: "auto 1fr auto",
        background: match ? `color-mix(in oklab, ${AGENT_COLOR.SC} 8%, var(--bg))` : "var(--bg)",
        border: `1px solid ${match ? AGENT_COLOR.SC : "var(--border)"}`,
      }}
    >
      <div
        className="w-[22px] h-[22px] rounded flex items-center justify-center font-mono text-[9px]"
        style={{ background: match ? AGENT_COLOR.SC : "var(--surface-raised)", color: match ? "#fff" : "var(--text-ter)" }}
      >
        {n}
      </div>
      <div className="min-w-0">
        <div className="font-mono text-[11px] truncate" style={{ color: "var(--text)" }}>{route}</div>
        <div className="text-[10.5px] truncate" style={{ color: "var(--text-ter)" }}>{desc}</div>
      </div>
      <div className="font-mono text-[10px]" style={{ color: match ? AGENT_COLOR.SC : "var(--text-ter)" }}>{pct}%</div>
    </div>
  )
}

function SbFrame({ n, route, body }: { n: string; route: string; body: string }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "linear-gradient(135deg, #2a2735, #1f1d28)", border: "1px solid var(--border)" }}>
      <div className="flex justify-between px-2.5 py-1.5 border-b" style={{ background: "rgba(0,0,0,.3)", borderColor: "var(--border)" }}>
        <span className="font-mono text-[9px]" style={{ color: "var(--text-ter)" }}>{n}</span>
        <span className="font-mono text-[9px] truncate" style={{ color: "var(--brand-light)" }}>{route}</span>
      </div>
      <div className="p-2.5 text-[10.5px] leading-[1.35]" style={{ color: "var(--text-sec)" }}>
        {body}
        <div className="flex flex-col gap-1 mt-2">
          {["70%","90%","50%"].map((w,i) => <span key={i} className="block h-[4px] rounded-sm" style={{ width: w, background: "var(--surface-raised)" }} />)}
        </div>
      </div>
    </div>
  )
}

function ToolPill({ label, color }: { label: string; color: string }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-2 rounded-full font-mono text-[10px] uppercase tracking-[.04em]"
      style={{
        background: `color-mix(in oklab, ${color} 10%, transparent)`,
        border: `1px solid color-mix(in oklab, ${color} 22%, transparent)`,
        color,
      }}
    >
      <span className="flex gap-[3px]">
        {[0,1,2].map(i => (
          <span key={i} className="w-[3px] h-[3px] rounded-full" style={{ background: "currentColor", animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </span>
      {label}
    </div>
  )
}

function MockCard() {
  return (
    <div className="rounded-lg overflow-hidden my-2.5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
        <span className="font-sans text-[12px] font-medium" style={{ color: "var(--text)" }}>GET</span>
        <span className="font-mono text-[11px]" style={{ color: AGENT_COLOR.FA }}>/api/v1/dashboard/kpis</span>
        <span className="ml-auto font-mono text-[9px] px-2 py-0.5 rounded" style={{ background: `color-mix(in oklab, ${AGENT_COLOR.FA} 18%, transparent)`, color: AGENT_COLOR.FA }}>mock 200 · 180ms</span>
      </div>
      <pre className="px-3.5 py-3 m-0 font-mono text-[11.5px] leading-[1.6] overflow-x-auto" style={{ color: "var(--text-sec)" }}>
        <span style={{ color: "var(--text-ter)" }}>{`// réponse factice cohérente`}</span>{"\n"}
        {"{"}{"\n"}
        {"  "}<span style={{ color: "var(--brand-light)" }}>"campaigns_active"</span>{": "}<span style={{ color: "hsl(35 90% 70%)" }}>12</span>{",\n"}
        {"  "}<span style={{ color: "var(--brand-light)" }}>"impressions_30d"</span>{": "}<span style={{ color: "hsl(35 90% 70%)" }}>1284900</span>{",\n"}
        {"  "}<span style={{ color: "var(--brand-light)" }}>"ctr_30d"</span>{": "}<span style={{ color: "hsl(35 90% 70%)" }}>0.0421</span>{",\n"}
        {"  "}<span style={{ color: "var(--brand-light)" }}>"top_channel"</span>{": "}<span style={{ color: "hsl(155 60% 70%)" }}>"Email"</span>{"\n"}
        {"}"}
      </pre>
    </div>
  )
}

function AnnotCard() {
  return (
    <div
      className="grid items-start gap-3 my-2.5 px-3.5 py-3 rounded-lg"
      style={{
        gridTemplateColumns: "auto 1fr auto",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${AGENT_COLOR.NA}`,
      }}
    >
      <div className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold text-white" style={{ background: AGENT_COLOR.NA }}>!</div>
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[.04em] mb-1" style={{ color: "var(--text-ter)" }}>
          Cible · <b style={{ color: AGENT_COLOR.NA }}>[data-kpi="impressions"]</b> sur <b style={{ color: AGENT_COLOR.NA }}>/dashboard</b>
        </div>
        <div className="text-[13px] leading-[1.5]" style={{ color: "var(--text)" }}>
          "+38% sur 30 jours — c'est exactement le boost que Marie veut montrer à son board."
        </div>
      </div>
      <div className="font-mono text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap" style={{ border: "1px solid var(--border)", color: "var(--text-ter)" }}>0:58</div>
    </div>
  )
}

function ActionCard({ label, meta, actions }: { label: string; meta: string; actions: { text: string; primary?: boolean }[] }) {
  return (
    <div
      className="flex justify-between items-center gap-4 my-2.5 px-3.5 py-3 rounded-lg"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div>
        <div className="text-[13px] font-medium">{label}</div>
        <div className="font-mono text-[10px] uppercase tracking-[.04em] mt-0.5" style={{ color: "var(--text-ter)" }}>{meta}</div>
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        {actions.map(a => (
          <button
            key={a.text}
            className="px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-[.04em] cursor-pointer transition-all"
            style={
              a.primary
                ? { background: "var(--brand)", color: "#fff", border: "1px solid var(--brand)" }
                : { background: "transparent", border: "1px solid var(--border)", color: "var(--text-sec)" }
            }
          >
            {a.text}
          </button>
        ))}
      </div>
    </div>
  )
}

type Agent = "user" | "scout" | "director" | "faker" | "narrator"

interface Msg {
  agent: Agent
  av: string
  name: string
  role?: string
  time: string
  content: React.ReactNode
}

const AV_STYLE: Record<Agent, React.CSSProperties> = {
  user:     { background: "var(--surface-raised)", color: "var(--text)", border: "1px solid var(--border)" },
  scout:    { background: `color-mix(in oklab, ${AGENT_COLOR.SC} 16%, transparent)`, color: AGENT_COLOR.SC, border: `1px solid color-mix(in oklab, ${AGENT_COLOR.SC} 30%, transparent)` },
  director: { background: `color-mix(in oklab, ${AGENT_COLOR.DI} 16%, transparent)`, color: AGENT_COLOR.DI, border: `1px solid color-mix(in oklab, ${AGENT_COLOR.DI} 30%, transparent)` },
  faker:    { background: `color-mix(in oklab, ${AGENT_COLOR.FA} 16%, transparent)`, color: AGENT_COLOR.FA, border: `1px solid color-mix(in oklab, ${AGENT_COLOR.FA} 30%, transparent)` },
  narrator: { background: `color-mix(in oklab, ${AGENT_COLOR.NA} 16%, transparent)`, color: AGENT_COLOR.NA, border: `1px solid color-mix(in oklab, ${AGENT_COLOR.NA} 30%, transparent)` },
}

const MESSAGES: Msg[] = [
  {
    agent: "user", av: "MC", name: "Marie", time: "14:08",
    content: (
      <>
        <p className="mb-2">Je dois faire une démo de Stratus à un prospect mid-market jeudi (visio, 15 min). Cible : un VP Marketing qui veut voir <strong>concrètement</strong> comment on simplifie la gestion de campagnes multi-canaux.</p>
        <p>Scénarise-moi un parcours <em>onboarding nouveau client</em> à partir de zéro : signup → setup workspace → import première campagne → vue dashboard avec données. Le tout en ~90 secondes de démo live.</p>
      </>
    ),
  },
  {
    agent: "scout", av: "SC", name: "Scout", role: "Lecture du repo", time: "14:08",
    content: (
      <>
        <p className="mb-3">J'ai parcouru <code className="font-mono text-[12px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--brand-light)" }}>acme/stratus-app @ main</code>. Voici les 4 pages pertinentes pour ton parcours :</p>
        <div className="grid gap-1.5 mb-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <PageRow n="01" route="/signup" desc="Formulaire signup + magic link" match pct={96} />
          <PageRow n="02" route="/onboarding/:step" desc="4 étapes : workspace, équipe, intégrations" match pct={94} />
          <PageRow n="03" route="/projects/new" desc="Modal création projet (5 champs)" match pct={88} />
          <PageRow n="04" route="/dashboard" desc="KPI grid · widgets campagnes" match pct={91} />
          <PageRow n="··" route="/projects/:id" desc="Détail projet (bonus)" pct={62} />
          <PageRow n="··" route="/settings/team" desc="Gestion équipe (peut être skippé)" pct={51} />
        </div>
        <ToolPill label="repo · 12 routes scannées" color={AGENT_COLOR.SC} />
      </>
    ),
  },
  {
    agent: "director", av: "DI", name: "Director", role: "Scénario démo", time: "14:09",
    content: (
      <>
        <p className="mb-3">Sur la base des 4 pages de Scout, voici la séquence en 6 étapes — chaque étape scripte précisément les actions à jouer :</p>
        <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <SbFrame n="01" route="/signup" body="Marie tape son email + nom workspace" />
          <SbFrame n="02" route="/onboarding/1" body="Bienvenue + nom de l'équipe" />
          <SbFrame n="03" route="/onboarding/3" body="Connexion HubSpot (skip après 2s)" />
          <SbFrame n="04" route="/projects/new" body="Crée «Campagne Q4 — Promo» (modal pré-rempli)" />
        </div>
        <p className="text-[13px] mb-1" style={{ color: "var(--text-sec)" }}>Étapes 5 & 6 : transition vers <code className="font-mono text-[11px] px-1 py-0.5 rounded" style={{ background: "var(--bg)", color: "var(--brand-light)" }}>/dashboard</code> avec données factices (Faker prend la main).</p>
        <ToolPill label="script · 6 étapes · 1m 28 estimé" color={AGENT_COLOR.DI} />
      </>
    ),
  },
  {
    agent: "faker", av: "FA", name: "Faker", role: "Données & mocks API", time: "14:10",
    content: (
      <>
        <p className="mb-2">Je génère un set de données factices cohérent pour Acme (B2B SaaS, 240 employés). Tous les <strong>36 endpoints détectés</strong> sont mockés — aucune base réelle touchée.</p>
        <MockCard />
        <p className="text-[13px]" style={{ color: "var(--text-sec)" }}>+ 23 autres endpoints prêts. Latences simulées entre <code className="font-mono text-[11px] px-1 py-0.5 rounded" style={{ background: "var(--bg)" }}>120ms</code> et <code className="font-mono text-[11px] px-1 py-0.5 rounded" style={{ background: "var(--bg)" }}>340ms</code>.</p>
        <ToolPill label="mock · 36/36 endpoints · dataset Acme" color={AGENT_COLOR.FA} />
      </>
    ),
  },
  {
    agent: "user", av: "MC", name: "Marie", time: "14:14",
    content: (
      <p>Skippe l'étape 03 (intégrations) — mon prospect ne tournera pas avec HubSpot. Et ajoute une <strong>annotation</strong> visible sur le KPI <em>impressions 30j</em> pour insister sur la croissance.</p>
    ),
  },
  {
    agent: "director", av: "DI", name: "Director", role: "Mise à jour script", time: "14:14",
    content: (
      <>
        <p className="mb-2">Reçu. Étape 03 retirée → <strong>5 étapes au total</strong>, durée actualisée : <strong>1m 12s</strong>.</p>
        <div className="my-2.5 px-4 py-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${AGENT_COLOR.DI}` }}>
          <div className="font-mono text-[9.5px] uppercase tracking-[.06em] mb-1.5" style={{ color: "var(--text-ter)" }}>Étape 03 (supprimée)</div>
          <div className="text-[13px] line-through" style={{ color: "var(--text-sec)", opacity: 0.5 }}>Connecter HubSpot · click bouton · skip après 2s</div>
        </div>
        <div className="my-2.5 px-4 py-3 rounded-lg" style={{ background: "var(--brand-dim)", border: `1px solid var(--brand)`, borderLeft: `3px solid var(--brand)` }}>
          <div className="font-mono text-[9.5px] uppercase tracking-[.06em] mb-1.5" style={{ color: "var(--brand-light)" }}>Nouvelle séquence</div>
          <div className="text-[13px]" style={{ color: "var(--text)" }}>
            02 → <code className="font-mono text-[11px] px-1 rounded" style={{ background: "rgba(0,0,0,.3)", color: "var(--brand-light)" }}>/onboarding/1</code> → 04 → <code className="font-mono text-[11px] px-1 rounded" style={{ background: "rgba(0,0,0,.3)", color: "var(--brand-light)" }}>/projects/new</code> → 05 → <code className="font-mono text-[11px] px-1 rounded" style={{ background: "rgba(0,0,0,.3)", color: "var(--brand-light)" }}>/dashboard</code>
          </div>
        </div>
      </>
    ),
  },
  {
    agent: "narrator", av: "NA", name: "Narrator", role: "Annotations", time: "14:15",
    content: (
      <>
        <p className="mb-2">Annotation posée sur le widget <em>Impressions 30 jours</em> de <code className="font-mono text-[11px] px-1 rounded" style={{ background: "var(--bg)", color: "var(--brand-light)" }}>/dashboard</code>. Elle apparaîtra à <strong>0:58</strong> avec un fade-in de 400ms.</p>
        <AnnotCard />
        <p className="text-[13px] mb-2" style={{ color: "var(--text-sec)" }}>Tu peux la déplacer dans le storyboard. Veux-tu une voix-off lue à ce moment-là ?</p>
        <ActionCard label="Voix-off optionnelle" meta="Synthèse 2,8 s · voix Confident-FR-warm" actions={[{ text: "Pas maintenant" }, { text: "Générer la voix", primary: true }]} />
      </>
    ),
  },
  {
    agent: "director", av: "DI", name: "Director", role: "Récap", time: "14:16",
    content: (
      <>
        <p className="mb-2">La démo est prête à être prévisualisée. <strong>5 étapes · 1m 12s · 8 mocks API · 1 annotation</strong>.</p>
        <ActionCard label="Prêt à présenter" meta="Démo scriptée · données factices · aucun appel réel" actions={[{ text: "Re-générer" }, { text: "Ouvrir le storyboard →", primary: true }]} />
      </>
    ),
  },
]

const AGENT_TASKS = [
  { id: "SC", name: "Scout",    color: AGENT_COLOR.SC, status: "done",  desc: "4 pages pertinentes identifiées",           pct: 100 },
  { id: "DI", name: "Director", color: AGENT_COLOR.DI, status: "done",  desc: "5 étapes scriptées · 1m 12s",              pct: 100 },
  { id: "FA", name: "Faker",    color: AGENT_COLOR.FA, status: "done",  desc: "36 endpoints mockés · dataset Acme",       pct: 100 },
  { id: "NA", name: "Narrator", color: AGENT_COLOR.NA, status: "done",  desc: "1 annotation posée sur /dashboard",        pct: 100 },
]

const SCENARIO_STEPS = [
  { n: "01", label: "Signup", route: "/signup",       act: "type", cur: false },
  { n: "02", label: "Workspace", route: "/onboarding/1", act: "type", cur: false },
  { n: "03", label: "Nouveau projet", route: "/projects/new", act: "click", cur: false },
  { n: "04", label: "Dashboard", route: "/dashboard",  act: "nav", cur: true },
  { n: "05", label: "KPI Impressions", route: "/dashboard", act: "highlight", cur: false },
]

const TEMPLATES = [
  { slug: "feature-launch",  label: "Feature launch" },
  { slug: "onboarding",      label: "Onboarding" },
  { slug: "pitch",           label: "Pitch investor" },
] as const

interface RealMessage {
  id: string
  demo_id: string
  agent: string
  role: string
  content: string
  metadata: Record<string, unknown>
  created_at: string
}

interface ChatProject {
  id: string
  repo_full_name: string
  branch: string
  framework: string | null
}

interface RecentDemo {
  id: string
  title: string
  status: string
}

interface ChatProps {
  orgId: string
  userId: string
  firstName: string
  projects: ChatProject[]
  initialProjectId: string | null
  initialDemoId: string | null
  initialMessages: RealMessage[]
  initialDemo: { id: string; title: string; status: string; project_id: string } | null
  recentDemos?: RecentDemo[]
}

function agentToClass(agent: string): string {
  const map: Record<string, string> = { scout: 'scout', director: 'director', faker: 'faker', narrator: 'narrator', user: 'user', system: 'user' }
  return map[agent] ?? 'user'
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const isListItem = /^[-*]\s/.test(line)
    const content = line.replace(/^[-*]\s/, '')

    // Inline: **bold**, `code`
    const parseInline = (s: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = []
      const regex = /\*\*(.+?)\*\*|`(.+?)`/g
      let last = 0, m
      while ((m = regex.exec(s)) !== null) {
        if (m.index > last) parts.push(s.slice(last, m.index))
        if (m[1]) parts.push(<strong key={m.index}>{m[1]}</strong>)
        if (m[2]) parts.push(<code key={m.index} className="font-mono text-[12px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg)", color: "var(--brand-light)", border: "1px solid var(--border)" }}>{m[2]}</code>)
        last = m.index + m[0].length
      }
      if (last < s.length) parts.push(s.slice(last))
      return parts
    }

    const parsed = parseInline(content)
    if (isListItem) {
      return (
        <div key={i} className="flex gap-2 mt-1">
          <span style={{ color: "var(--text-ter)", flexShrink: 0 }}>·</span>
          <span>{parsed}</span>
        </div>
      )
    }
    if (!line.trim()) return <div key={i} className="h-2" />
    return <div key={i}>{parsed}</div>
  })
}

function agentToAv(agent: string, firstName: string): string {
  const map: Record<string, string> = { scout: 'SC', director: 'DI', faker: 'FA', narrator: 'NA', system: '⚡' }
  return map[agent] ?? firstName.slice(0, 2).toUpperCase()
}

// ─── Main component ───────────────────────────────────────
export function ChatShell({
  orgId, userId, firstName, projects,
  initialProjectId, initialDemoId, initialMessages, initialDemo, recentDemos = []
}: ChatProps) {
  const ph = usePostHog()
  const [activeTab, setActiveTab] = useState<"tasks" | "brief" | "mocks">("tasks")
  const [text, setText] = useState("")
  const [activeChip, setActiveChip] = useState("@all")
  const [templateSlug, setTemplateSlug] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [demoId, setDemoId] = useState<string | null>(initialDemoId)
  const [demo, setDemo] = useState(initialDemo)
  const [projectId] = useState<string | null>(initialProjectId)
  const currentProject = projects.find(p => p.id === projectId) ?? null
  const [liveMessages, setLiveMessages] = useState<RealMessage[]>(initialMessages)
  const msgsRef = useRef<HTMLDivElement>(null)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  // Utilise les messages réels si disponibles, sinon les messages mock
  const useRealMessages = demoId !== null
  const displayMessages = useRealMessages ? liveMessages : []

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [displayMessages])

  // Subscribe Realtime + fetch messages existants quand demo_id change
  useEffect(() => {
    if (!demoId) return
    const sb = createClient()
    supabaseRef.current = sb

    // 1. S'abonne AVANT de fetcher pour ne rien manquer
    const channel = sb
      .channel(`chat-${demoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_messages',
          filter: `demo_id=eq.${demoId}`,
        },
        (payload) => {
          const msg = payload.new as RealMessage
          setLiveMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          if (msg.agent === 'director' && msg.content.startsWith('✅')) {
            setSending(false)
          }
          setTimeout(() => {
            if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
          }, 50)
        }
      )
      .subscribe((status, err) => {
        if (err) console.error('[Realtime] subscribe error', err)
      })

    // 2. Fetch les messages déjà écrits (race condition avec Inngest)
    sb.from('agent_messages')
      .select('*')
      .eq('demo_id', demoId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('[agent_messages] fetch error', error)
          return
        }
        if (data && data.length > 0) {
          setLiveMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const newMsgs = (data as RealMessage[]).filter(m => !existingIds.has(m.id))
            return [...prev, ...newMsgs]
          })
          const isDone = (data as RealMessage[]).some(
            m => m.agent === 'director' && m.content.startsWith('✅')
          )
          if (isDone) setSending(false)
        }
      })

    return () => { sb.removeChannel(channel) }
  }, [demoId])

  // Polling fallback — toutes les 3s pendant que les agents tournent
  useEffect(() => {
    if (!demoId || !sending) return
    const sb = createClient()

    const poll = async () => {
      const { data } = await sb
        .from('agent_messages')
        .select('*')
        .eq('demo_id', demoId)
        .order('created_at', { ascending: true })
      if (!data || data.length === 0) return

      setLiveMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id))
        const newMsgs = (data as RealMessage[]).filter(m => !existingIds.has(m.id))
        return newMsgs.length === 0 ? prev : [...prev, ...newMsgs]
      })

      if ((data as RealMessage[]).some(m => m.agent === 'director' && m.content.startsWith('✅'))) {
        setSending(false)
      }
    }

    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [demoId, sending])

  async function handleSend() {
    if (!text.trim() || sending || !projectId) return
    setSending(true)
    const brief = text.trim()
    setText('')

    try {
      if (!demoId) {
        const res = await fetch('/api/demos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            org_id: orgId,
            project_id: projectId,
            title: brief.slice(0, 80),
            brief,
            template_slug: templateSlug,
            tags: { tone: 'pro', persona: 'PMM' },
          }),
        })
        const data = await res.json()
        if (data.demo?.id) {
          setDemoId(data.demo.id)
          setDemo(data.demo)
          ph?.capture("demo_created", { project_id: projectId, template_slug: templateSlug })
          // Sauvegarde le message user — apparaîtra via Realtime ou fetch
          fetch('/api/agent-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ demo_id: data.demo.id, content: brief }),
          }).catch(() => {})
        }
      } else {
        // Démo existante — message user livré via Realtime après insert
        fetch('/api/demos/iterate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ demo_id: demoId, message: brief }),
        }).catch(() => {})
      }
    } catch (e) {
      console.error('send error', e)
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "100vh", background: "var(--bg)", overflow: "hidden" }}>

      {/* ── Top bar ── */}
      <header
        className="flex-shrink-0 flex items-center gap-4 px-5 border-b"
        style={{ height: "52px", background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <Link href="/dashboard" className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[.04em] no-underline px-2.5 py-1.5 rounded-lg transition-colors" style={{ color: "var(--text-ter)" }}>
          ← Dashboard
        </Link>
        <div className="w-px h-5" style={{ background: "var(--border)" }} />
        <div>
          <div className="text-[13.5px] font-semibold">
            {demo?.title ?? "Nouvelle démo"}
          </div>
          <div className="font-mono text-[10.5px] uppercase tracking-[.04em]" style={{ color: "var(--text-ter)" }}>
            {currentProject
              ? `${currentProject.repo_full_name} · ${currentProject.branch}`
              : "Sélectionne un projet pour démarrer"}
          </div>
        </div>
        {currentProject && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-mono text-[10.5px]"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-sec)" }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55 0-.27-.01-.99-.01-1.95-3.2.69-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.93 10.93 0 015.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.66.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
            </svg>
            <strong style={{ color: "var(--text)" }}>{currentProject.repo_full_name}</strong>
            {currentProject.framework && <span> · {currentProject.framework}</span>}
          </div>
        )}
        <div className="ml-auto flex gap-2">
          {demoId && (
            <Link href={`/storyboard?demo_id=${demoId}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium text-white no-underline" style={{ background: "var(--brand)" }}>
              Ouvrir le storyboard
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          )}
        </div>
      </header>

      {/* ── 3-panel grid ── */}
      <div className="flex-1 min-h-0 grid" style={{ gridTemplateColumns: "260px 1fr 320px" }}>

        {/* ── LEFT sidebar ── */}
        <aside className="flex flex-col min-h-0" style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
          <div className="flex-shrink-0 px-4 pt-3.5 pb-2.5">
            <div className="font-mono text-[10px] uppercase tracking-[.08em] mb-2" style={{ color: "var(--text-ter)" }}>Démos récentes</div>
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13" style={{ color: "var(--text-ter)", flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder="Rechercher une démo…" className="flex-1 bg-transparent border-0 outline-none text-[12.5px]" style={{ color: "var(--text)", fontFamily: "var(--font-sans)" }} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {/* Démo active */}
            {demoId && (
              <div className="mb-1 px-3 py-2.5 rounded-lg" style={{ background: "var(--brand-dim)", border: "1px solid var(--brand)" }}>
                <div className="font-mono text-[9px] uppercase tracking-[.06em] mb-0.5" style={{ color: "var(--brand-light)" }}>En cours</div>
                <div className="text-[12.5px] font-medium truncate" style={{ color: "var(--brand-light)" }}>
                  {demo?.title ?? "Démo en cours"}
                </div>
              </div>
            )}
            {/* Démos récentes */}
            {recentDemos.filter(d => d.id !== demoId).map(d => (
              <a
                key={d.id}
                href={`/chat?demo_id=${d.id}`}
                className="block px-3 py-2.5 rounded-lg mb-0.5 no-underline transition-colors"
                style={{ color: "var(--text-sec)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-raised)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div className="text-[12px] truncate">{d.title}</div>
                <div className="font-mono text-[9px] uppercase tracking-[.04em] mt-0.5" style={{ color: "var(--text-ter)" }}>
                  {d.status}
                </div>
              </a>
            ))}
            {!demoId && recentDemos.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[.06em]" style={{ color: "var(--text-ter)" }}>Aucune démo récente</p>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center font-mono text-[10px] font-bold" style={{ background: "var(--surface-raised)", color: "var(--text)" }}>
              {firstName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-[12.5px] font-medium">{firstName}</div>
              <div className="font-mono text-[9.5px] uppercase tracking-[.04em]" style={{ color: "var(--text-ter)" }}>DemoForge</div>
            </div>
          </div>
        </aside>

        {/* ── MAIN messages ── */}
        <main className="flex flex-col min-h-0" style={{ background: "var(--bg)" }}>
          {/* Chat header */}
          <div className="flex-shrink-0 flex justify-between items-center px-6 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
            <div>
              <div className="text-[16px] font-semibold tracking-[-0.02em]">
                {demo?.title ?? "Nouvelle démo"}
              </div>
              <div className="font-mono text-[10.5px] uppercase tracking-[.04em] mt-0.5" style={{ color: "var(--text-ter)" }}>
                {demoId ? `${demo?.status ?? 'draft'} · ${projects.find(p => p.id === projectId)?.repo_full_name ?? ''}` : "Brief les agents pour scripter une démo"}
              </div>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              {(["SC","DI","FA","NA"] as const).map(a => (
                <div key={a} className="w-[22px] h-[22px] rounded-[5px] flex items-center justify-center font-mono text-[9px] font-bold"
                  style={{ background: `color-mix(in oklab, ${AGENT_COLOR[a]} 16%, transparent)`, color: AGENT_COLOR[a] }}>
                  {a}
                </div>
              ))}
              <span className="font-mono text-[10px] pl-2 border-l flex items-center gap-1.5" style={{ borderColor: "var(--border)", color: "var(--brand-light)" }}>
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: "var(--brand)", animation: "pulse 2s infinite" }} />
                prêts
              </span>
            </div>
          </div>

          {/* Messages */}
          <div ref={msgsRef} className="flex-1 overflow-y-auto py-8">
            <div className="max-w-[820px] mx-auto px-6 flex flex-col gap-7">

              {/* État vide — toujours visible si pas de messages */}
              {displayMessages.length === 0 && !sending && (
                <div className="text-center py-16 max-w-[480px] mx-auto">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "var(--brand-dim)", border: "1px solid var(--brand)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22" style={{ color: "var(--brand-light)" }}>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <p className="text-[16px] font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                    {currentProject ? `${currentProject.repo_full_name} · prêt` : "Aucun projet connecté"}
                  </p>
                  <p className="text-[13.5px] leading-[1.6] mb-6" style={{ color: "var(--text-sec)" }}>
                    {currentProject
                      ? "Décris la démo à créer ci-dessous. Les 4 agents vont scripter le parcours, générer les données mockées et poser les annotations."
                      : "Connecte un repo GitHub depuis l'onboarding pour que Scout puisse lire ton code."}
                  </p>
                  {currentProject ? (
                    <div className="px-4 py-3 rounded-xl text-left" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                      <p className="font-mono text-[9.5px] uppercase tracking-[.06em] mb-1.5" style={{ color: "var(--text-ter)" }}>Exemple de brief</p>
                      <p className="text-[13px]" style={{ color: "var(--text-sec)" }}>
                        "Démo de l'application pour un prospect e-commerce, parcours onboarding, 5 étapes, 90 secondes"
                      </p>
                    </div>
                  ) : (
                    <Link href="/onboarding" className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-white no-underline" style={{ background: "var(--brand)" }}>
                      Connecter un repo →
                    </Link>
                  )}
                </div>
              )}

              {/* Messages réels */}
              {useRealMessages && (
                <>
                  {displayMessages.map((m, i) => {
                    const agentClass = agentToClass(m.agent)
                    const av = agentToAv(m.agent, firstName)
                    const avStyle = AV_STYLE[agentClass as keyof typeof AV_STYLE] ?? AV_STYLE.user
                    return (
                      <article key={m.id ?? i} className="grid gap-3.5" style={{ gridTemplateColumns: "36px 1fr" }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold flex-shrink-0" style={avStyle}>
                          {av}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2.5 mb-2">
                            <span className="text-[13.5px] font-semibold capitalize">{m.agent === 'user' ? firstName : m.agent}</span>
                            <span className="font-mono text-[10px] ml-auto" style={{ color: "var(--text-ter)" }}>
                              {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div
                            className="text-[14px] leading-[1.65]"
                            style={{
                              color: "var(--text)",
                              ...(m.agent === 'user' ? {
                                background: "var(--surface)", border: "1px solid var(--border)",
                                padding: "12px 14px", borderRadius: "4px 12px 12px 12px",
                                whiteSpace: "pre-wrap",
                              } : {}),
                            }}
                          >
                            {m.agent === 'user' ? m.content : renderMarkdown(m.content)}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                  {sending && (
                    <div className="grid gap-3.5" style={{ gridTemplateColumns: "36px 1fr" }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold flex-shrink-0"
                        style={{ background: "var(--brand-dim)", color: "var(--brand-light)", border: "1px solid var(--brand)" }}>
                        ⚡
                      </div>
                      <div className="min-w-0 pt-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[13.5px] font-semibold" style={{ color: "var(--brand-light)" }}>Agents en cours</span>
                          <div className="flex gap-1 ml-2">
                            {[0,1,2].map(i => (
                              <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand)", animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
                            ))}
                          </div>
                        </div>
                        <p className="text-[13px]" style={{ color: "var(--text-sec)" }}>
                          Scout lit le repo · Director script · Faker génère les mocks · Narrator annote…
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-[.06em] mt-1" style={{ color: "var(--text-ter)" }}>
                          ~15-30 secondes · ne quitte pas la page
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Composer */}
          <div className="flex-shrink-0 px-6 pb-6">
            <div className="max-w-[820px] mx-auto">
              {/* Template selector — visible uniquement avant la première démo */}
              {!demoId && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-[10px] uppercase tracking-[.06em]" style={{ color: "var(--text-ter)" }}>Template</span>
                  {TEMPLATES.map(t => (
                    <button
                      key={t.slug}
                      onClick={() => setTemplateSlug(prev => prev === t.slug ? null : t.slug)}
                      className="px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-[.04em] transition-all border"
                      style={
                        templateSlug === t.slug
                          ? { background: "var(--brand-dim)", borderColor: "var(--brand)", color: "var(--brand-light)" }
                          : { background: "transparent", borderColor: "var(--border)", color: "var(--text-ter)" }
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
              <div
                className="rounded-2xl transition-all"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder={projectId ? "Décrivez la démo à créer… (↩ pour envoyer)" : "Connecte d'abord un repo depuis l'onboarding"}
                  rows={1}
                  className="w-full px-4 pt-3.5 pb-1 bg-transparent border-0 outline-none text-[14px] resize-none"
                  style={{ color: "var(--text)", fontFamily: "var(--font-sans)", minHeight: "44px", maxHeight: "160px", lineHeight: 1.55 }}
                />
                <div className="flex items-center gap-2 px-3 pb-2.5">
                  {/* Tool icons */}
                  <div className="flex gap-1">
                    {[
                      <path key="a" d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>,
                      <><polyline key="b1" points="16 18 22 12 16 6"/><polyline key="b2" points="8 6 2 12 8 18"/></>,
                      <><rect key="c1" x="3" y="3" width="18" height="18" rx="2"/><circle key="c2" cx="8.5" cy="8.5" r="1.5"/><polyline key="c3" points="21 15 16 10 5 21"/></>,
                    ].map((path, i) => (
                      <button key={i} className="w-7 h-7 rounded-md flex items-center justify-center transition-colors" style={{ color: "var(--text-ter)", background: "transparent" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">{path}</svg>
                      </button>
                    ))}
                  </div>

                  {/* Agent chips */}
                  <div className="flex gap-1 flex-1 justify-center">
                    {["@all","@scout","@director","@faker","@narrator"].map(chip => (
                      <button
                        key={chip}
                        onClick={() => setActiveChip(chip)}
                        className="px-2.5 py-1 rounded-full font-mono text-[10px] uppercase tracking-[.04em] transition-all border"
                        style={
                          activeChip === chip
                            ? { background: "var(--brand-dim)", borderColor: "var(--brand)", color: "var(--brand-light)" }
                            : { background: "transparent", borderColor: "var(--border)", color: "var(--text-ter)" }
                        }
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Send */}
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending || !projectId}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40"
                    style={{ background: text && projectId ? "var(--brand)" : "var(--surface-raised)" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex justify-between mt-2 font-mono text-[10px] uppercase tracking-[.04em]" style={{ color: "var(--text-ter)" }}>
                <span><kbd className="px-1.5 py-0.5 rounded border text-[9px]" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>↩</kbd> envoyer · <kbd className="px-1.5 py-0.5 rounded border text-[9px]" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>⇧</kbd>+<kbd className="px-1.5 py-0.5 rounded border text-[9px]" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>↩</kbd> nouvelle ligne</span>
                <span>4 agents · vous restez le réalisateur</span>
              </div>
            </div>
          </div>
        </main>

        {/* ── RIGHT panel ── */}
        <aside className="flex flex-col min-h-0" style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}>
          <div className="flex-shrink-0 flex gap-0.5 p-2 border-b" style={{ borderColor: "var(--border)" }}>
            {(["tasks","brief","mocks"] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className="flex-1 py-1.5 font-mono text-[10.5px] uppercase tracking-[.04em] rounded-lg transition-colors"
                style={
                  activeTab === t
                    ? { background: "var(--surface-raised)", color: "var(--text)" }
                    : { background: "transparent", color: "var(--text-ter)" }
                }
              >
                {t === "tasks" ? "Tâches" : t === "brief" ? "Brief" : "Mocks"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
            {activeTab === "tasks" && (
              <>
                {/* Statut agents basé sur les vrais messages */}
                <div>
                  <h4 className="font-mono text-[10px] uppercase tracking-[.08em] pb-1.5 mb-2.5 flex justify-between border-b" style={{ color: "var(--text-ter)", borderColor: "var(--border)" }}>
                    <span>Agents</span>
                    <span style={{ color: liveMessages.length > 0 ? "var(--brand-light)" : "var(--text-ter)" }}>
                      {liveMessages.length > 0 ? "actifs" : "en attente"}
                    </span>
                  </h4>
                  {(["scout","director","faker","narrator"] as const).map(agent => {
                    const msgs = liveMessages.filter(m => m.agent === agent)
                    const lastMsg = msgs[msgs.length - 1]
                    const color = AGENT_COLOR[agent.toUpperCase() as keyof typeof AGENT_COLOR] ?? "var(--text-ter)"
                    return (
                      <div key={agent} className="mb-2 px-3 py-2.5 rounded-xl" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderLeft: `2px solid ${color}`, opacity: msgs.length === 0 ? 0.45 : 1 }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-semibold capitalize" style={{ color }}>{agent}</span>
                          <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[.04em]" style={{ color: msgs.length > 0 ? "var(--success)" : "var(--text-ter)" }}>
                            {msgs.length > 0 ? "✓ actif" : "en attente"}
                          </span>
                        </div>
                        {lastMsg && (
                          <div className="text-[11px] leading-[1.4] truncate" style={{ color: "var(--text-sec)" }}>
                            {lastMsg.content.slice(0, 60)}{lastMsg.content.length > 60 ? "…" : ""}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Actions rapides */}
                {demoId && (
                  <div>
                    <h4 className="font-mono text-[10px] uppercase tracking-[.08em] pb-1.5 mb-2.5 border-b" style={{ color: "var(--text-ter)", borderColor: "var(--border)" }}>
                      Actions
                    </h4>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: "Storyboard", href: `/storyboard?demo_id=${demoId}` },
                        { label: "Re-générer", href: "#" },
                      ].map(a => (
                        <a key={a.label} href={a.href} className="px-2.5 py-2 rounded-lg text-left font-mono text-[9.5px] uppercase tracking-[.04em] transition-all no-underline" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-sec)", display: "block" }}>
                          {a.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "brief" && (
              <div className="text-[13px] leading-[1.6]" style={{ color: "var(--text-sec)" }}>
                {demo ? (
                  <>
                    <p className="font-semibold mb-2" style={{ color: "var(--text)" }}>{demo.title}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[.04em]" style={{ color: "var(--text-ter)" }}>
                      Projet · {projects.find(p => p.id === projectId)?.repo_full_name ?? "—"}
                    </p>
                  </>
                ) : (
                  <p style={{ color: "var(--text-ter)" }}>Envoie un brief pour démarrer.</p>
                )}
              </div>
            )}

            {activeTab === "mocks" && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.06em] mb-3" style={{ color: "var(--text-ter)" }}>
                  {demoId ? "Mocks générés par Faker" : "Aucun mock pour l'instant"}
                </p>
                {!demoId && (
                  <p className="text-[12px]" style={{ color: "var(--text-ter)" }}>
                    Les mocks API seront listés ici après que Faker aura traité le storyboard.
                  </p>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: .3; }
          40% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
