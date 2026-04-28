"use client"

import { useState, useEffect } from "react"

interface AnalyticsData {
  total_views: number
  avg_duration_ms: number
  completion_rate: number
  step_reach: number[]
  step_count: number
  devices: { desktop: number; mobile: number; unknown: number }
  top_countries: Array<{ country: string; count: number }>
  recent: Array<{
    started_at: string
    duration_ms: number | null
    ended_at_step_index: number | null
    device: string
    country: string | null
  }>
}

function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000)
  return s >= 60 ? `${Math.floor(s / 60)}m${s % 60 > 0 ? s % 60 + 's' : ''}` : `${s}s`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function AnalyticsPanel({ demoId }: { demoId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/demos/${demoId}/analytics`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [demoId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-mono text-[11px] uppercase tracking-[.06em]" style={{ color: "var(--text-ter)" }}>Chargement…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-mono text-[11px]" style={{ color: "var(--text-ter)" }}>Impossible de charger les analytics.</p>
      </div>
    )
  }

  const maxReach = data.step_reach[0] ?? 1
  const totalDevices = data.devices.desktop + data.devices.mobile + data.devices.unknown

  return (
    <div className="h-full overflow-y-auto px-8 py-6 flex flex-col gap-8 max-w-3xl mx-auto w-full">

      {/* ── KPIs ── */}
      <div>
        <h2 className="font-mono text-[10px] uppercase tracking-[.08em] mb-4" style={{ color: "var(--text-ter)" }}>Vue d'ensemble</h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[
            { label: "Vues totales",   value: String(data.total_views),                       accent: false },
            { label: "Durée moyenne",  value: data.avg_duration_ms > 0 ? fmtDuration(data.avg_duration_ms) : "—", accent: false },
            { label: "Complétion",     value: `${data.completion_rate}%`,                     accent: true  },
          ].map(k => (
            <div key={k.label} className="px-5 py-4 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="font-mono text-[10px] uppercase tracking-[.06em] mb-2" style={{ color: "var(--text-ter)" }}>{k.label}</p>
              <p className="font-bold tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: k.accent ? "var(--brand-light)" : "var(--text)" }}>
                {k.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── No data ── */}
      {data.total_views === 0 && (
        <div className="flex flex-col items-center justify-center py-12 rounded-2xl" style={{ border: "1px dashed var(--border)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32" className="mb-3" style={{ color: "var(--text-ter)" }}>
            <path d="M18 20V10M12 20V4M6 20v-6"/>
          </svg>
          <p className="text-[14px] font-semibold mb-1" style={{ color: "var(--text-sec)" }}>Aucune vue pour l'instant</p>
          <p className="font-mono text-[11px]" style={{ color: "var(--text-ter)" }}>Partage le lien pour collecter des données</p>
        </div>
      )}

      {data.total_views > 0 && (
        <>
          {/* ── Drop-off ── */}
          {data.step_reach.length > 0 && (
            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-[.08em] mb-4" style={{ color: "var(--text-ter)" }}>
                Drop-off par étape
              </h2>
              <div className="flex flex-col gap-2.5">
                {data.step_reach.map((count, i) => {
                  const pct = maxReach > 0 ? Math.round(count / maxReach * 100) : 0
                  const color = pct > 70 ? "var(--brand)" : pct > 40 ? "var(--warn)" : "hsl(0 65% 55%)"
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="font-mono text-[10px] w-7 flex-shrink-0 text-right" style={{ color: "var(--text-ter)" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: "var(--surface-raised)" }}>
                        <div
                          className="h-full rounded-lg flex items-center px-2 transition-all"
                          style={{ width: `${Math.max(pct, 4)}%`, background: color }}
                        >
                          {pct > 15 && (
                            <span className="font-mono text-[9px] font-bold text-white">{count}</span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] w-9 text-right" style={{ color: "var(--text-sec)" }}>{pct}%</span>
                    </div>
                  )
                })}
              </div>
              <p className="font-mono text-[9px] mt-2" style={{ color: "var(--text-ter)" }}>
                % de viewers ayant atteint chaque étape · base = étape 1
              </p>
            </div>
          )}

          {/* ── Devices ── */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-[.08em] mb-3" style={{ color: "var(--text-ter)" }}>Appareils</h2>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Desktop", count: data.devices.desktop,  icon: "⊡" },
                  { label: "Mobile",  count: data.devices.mobile,   icon: "▭" },
                ].map(d => {
                  const pct = totalDevices > 0 ? Math.round(d.count / totalDevices * 100) : 0
                  return (
                    <div key={d.label} className="px-3 py-2.5 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[12px]" style={{ color: "var(--text-sec)" }}>{d.icon} {d.label}</span>
                        <span className="font-mono text-[11px] font-bold" style={{ color: "var(--text)" }}>{pct}%</span>
                      </div>
                      <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "var(--surface-raised)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--brand)" }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Countries ── */}
            {data.top_countries.length > 0 && (
              <div>
                <h2 className="font-mono text-[10px] uppercase tracking-[.08em] mb-3" style={{ color: "var(--text-ter)" }}>Pays (top 5)</h2>
                <div className="flex flex-col gap-1.5">
                  {data.top_countries.map(({ country, count }) => {
                    const pct = data.total_views > 0 ? Math.round(count / data.total_views * 100) : 0
                    return (
                      <div key={country} className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <span className="font-mono text-[11px] flex-1" style={{ color: "var(--text)" }}>{country}</span>
                        <span className="font-mono text-[10px]" style={{ color: "var(--text-ter)" }}>{count}</span>
                        <div className="w-16 h-[3px] rounded-full overflow-hidden" style={{ background: "var(--surface-raised)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--brand)" }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Recent views ── */}
          <div>
            <h2 className="font-mono text-[10px] uppercase tracking-[.08em] mb-3" style={{ color: "var(--text-ter)" }}>Vues récentes</h2>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="grid px-4 py-2 border-b" style={{ gridTemplateColumns: "1fr auto auto auto auto", borderColor: "var(--border)", background: "var(--surface)" }}>
                {["Date", "Durée", "Étape finale", "Appareil", "Pays"].map(h => (
                  <span key={h} className="font-mono text-[9px] uppercase tracking-[.06em]" style={{ color: "var(--text-ter)" }}>{h}</span>
                ))}
              </div>
              {data.recent.map((v, i) => (
                <div key={i} className="grid items-center px-4 py-2.5 border-b last:border-b-0 text-[12px]"
                  style={{ gridTemplateColumns: "1fr auto auto auto auto", borderColor: "var(--border)", background: i % 2 === 0 ? "var(--bg)" : "var(--surface)" }}>
                  <span style={{ color: "var(--text-sec)" }}>{fmtDate(v.started_at)}</span>
                  <span className="font-mono text-[11px]" style={{ color: "var(--text)" }}>{v.duration_ms ? fmtDuration(v.duration_ms) : "—"}</span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded mx-2" style={{ background: "var(--surface-raised)", color: "var(--text-ter)" }}>
                    {(v.ended_at_step_index ?? 0) + 1}
                  </span>
                  <span className="font-mono text-[10px] mx-2" style={{ color: "var(--text-ter)" }}>{v.device}</span>
                  <span className="font-mono text-[10px]" style={{ color: "var(--text-ter)" }}>{v.country ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
