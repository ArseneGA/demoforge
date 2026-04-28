'use client'

import { useState } from 'react'
import Link from 'next/link'
import { loginWithPassword, signupWithPassword, loginWithGoogle } from './actions'

const agents = [
  { av: 'SC', cls: 'a1', color: 'var(--agent-1)', name: 'Scout',    role: 'Lit votre code',       pct: 96 },
  { av: 'DI', cls: 'a2', color: 'var(--agent-2)', name: 'Director', role: 'Script & storyboard',   pct: 74 },
  { av: 'FA', cls: 'a3', color: 'var(--agent-3)', name: 'Faker',    role: 'Mocks & données',       pct: 48 },
  { av: 'NA', cls: 'a4', color: 'var(--agent-4)', name: 'Narrator', role: 'Annotations & captions', pct: 22 },
]

type Tab = 'login' | 'signup'
type Msg = { type: 'success' | 'error'; text: string }

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<Msg | null>(null)

  async function handle(action: (fd: FormData) => Promise<{ error?: string; success?: string } | void>, fd: FormData) {
    setLoading(true)
    setMsg(null)
    try {
      const res = await action(fd)
      if (res?.error) setMsg({ type: 'error', text: res.error })
      else if (res?.success) setMsg({ type: 'success', text: res.success })
    } catch { /* redirect throws */ }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── LEFT : form ── */}
      <section
        className="flex flex-col px-16 py-14 overflow-y-auto"
        style={{ flex: '1', maxWidth: '560px', minWidth: '340px' }}
      >
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 no-underline mb-auto">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-deep))' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M8 5v14l11-7z" fill="white" />
            </svg>
          </div>
          <span
            className="text-[15px] font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
          >
            Demo<em className="not-italic" style={{ color: 'var(--brand-light)' }}>Forge</em>
          </span>
        </Link>

        {/* Content */}
        <div className="py-14 w-full max-w-[380px]">
          <p className="font-mono text-[11px] uppercase tracking-[.08em] mb-3.5" style={{ color: 'var(--brand)' }}>
            Bienvenue
          </p>
          <h1
            className="font-bold tracking-[-0.03em] leading-[1.15] mb-2.5"
            style={{ fontFamily: 'var(--font-display)', fontSize: '32px' }}
          >
            {tab === 'login' ? 'Démarrez votre studio' : 'Créez votre studio'}
          </h1>
          <p className="text-[14px] leading-[1.55] mb-8" style={{ color: 'var(--text-sec)' }}>
            {tab === 'login'
              ? 'Connectez-vous pour reprendre vos projets ou créez un compte pour générer votre première démo.'
              : 'Créez votre compte pour commencer à forger des démos depuis votre repo GitHub.'}
          </p>

          {/* Tabs */}
          <div
            className="inline-flex gap-0.5 p-[3px] rounded-full mb-7"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {(['login', 'signup'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setMsg(null) }}
                className="font-mono text-[11px] px-4 py-1.5 rounded-full uppercase tracking-[.04em] transition-all"
                style={
                  tab === t
                    ? { background: 'var(--brand)', color: '#fff' }
                    : { background: 'transparent', color: 'var(--text-ter)' }
                }
              >
                {t === 'login' ? 'Login' : 'Signup'}
              </button>
            ))}
          </div>

          {/* SSO */}
          <div className="flex flex-col gap-2 mb-5">
            <form action={loginWithGoogle}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-[13.5px] font-medium transition-all"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuer avec Google
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <span className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="font-mono text-[10px] uppercase tracking-[.08em]" style={{ color: 'var(--text-ter)' }}>
              ou avec votre email
            </span>
            <span className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* Form */}
          <form className="flex flex-col gap-0">
            {tab === 'signup' && (
              <div className="mb-3.5">
                <label className="flex justify-between font-mono text-[10.5px] uppercase tracking-[.06em] mb-1.5" style={{ color: 'var(--text-ter)' }}>
                  Nom complet
                </label>
                <input
                  name="fullname"
                  type="text"
                  placeholder="Léa Martin"
                  className="w-full px-3.5 py-3 rounded-xl text-[14px] transition-all outline-none"
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-sans)',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'var(--brand)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px var(--brand-dim)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            )}

            <div className="mb-3.5">
              <label className="flex justify-between font-mono text-[10.5px] uppercase tracking-[.06em] mb-1.5" style={{ color: 'var(--text-ter)' }}>
                Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="vous@studio.fr"
                autoComplete="email"
                required
                className="w-full px-3.5 py-3 rounded-xl text-[14px] transition-all outline-none"
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-sans)',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'var(--brand)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--brand-dim)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            <div className="mb-2">
              <label className="flex justify-between font-mono text-[10.5px] uppercase tracking-[.06em] mb-1.5" style={{ color: 'var(--text-ter)' }}>
                Mot de passe
                {tab === 'login' && (
                  <a href="#" className="normal-case tracking-normal no-underline" style={{ color: 'var(--brand-light)' }}>
                    Oublié ?
                  </a>
                )}
              </label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                required
                className="w-full px-3.5 py-3 rounded-xl text-[14px] transition-all outline-none"
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-sans)',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'var(--brand)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--brand-dim)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {msg && (
              <div
                className="px-3.5 py-2.5 rounded-lg text-[13px] my-2"
                style={{
                  background: msg.type === 'success' ? 'color-mix(in oklab, var(--success) 14%, transparent)' : 'color-mix(in oklab, #ef4444 14%, transparent)',
                  color: msg.type === 'success' ? 'var(--success)' : '#f87171',
                  border: `1px solid ${msg.type === 'success' ? 'color-mix(in oklab, var(--success) 30%, transparent)' : 'color-mix(in oklab, #ef4444 30%, transparent)'}`,
                }}
              >
                {msg.text}
              </div>
            )}

            <div className="flex flex-col gap-2.5 mt-2">
              <button
                type="submit"
                disabled={loading}
                formAction={(fd) => handle(tab === 'login' ? loginWithPassword : signupWithPassword, fd)}
                className="w-full py-3.5 rounded-xl text-[14px] font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: 'var(--brand)', letterSpacing: '-0.005em' }}
              >
                {loading ? '…' : tab === 'login' ? 'Se connecter' : 'Créer le compte'}
              </button>
            </div>
          </form>

          <p className="text-[11.5px] text-center leading-[1.5] mt-4" style={{ color: 'var(--text-ter)' }}>
            En continuant, vous acceptez les{' '}
            <a href="#" style={{ color: 'var(--text-sec)' }}>CGU</a>
            {' '}et la{' '}
            <a href="#" style={{ color: 'var(--text-sec)' }}>politique de confidentialité</a>
            {' '}de DemoForge.
          </p>
        </div>

        <p className="font-mono text-[10.5px] uppercase tracking-[.04em] mt-auto" style={{ color: 'var(--text-ter)' }}>
          © 2026 DemoForge · Tous droits réservés
        </p>
      </section>

      {/* ── RIGHT : visual ── */}
      <aside
        className="relative hidden lg:flex flex-col justify-between p-14 overflow-hidden flex-1"
        style={{
          background: 'linear-gradient(135deg, #18171C 0%, #1B1622 50%, #221A33 100%)',
          borderLeft: '1px solid var(--border)',
        }}
      >
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at 60% 40%, #000 30%, transparent 80%)',
          }}
        />
        {/* Orbs */}
        <div className="absolute -top-[120px] -right-[100px] w-[420px] h-[420px] rounded-full pointer-events-none" style={{ filter: 'blur(90px)', background: 'radial-gradient(circle, hsl(268 78% 50% / .35), transparent 65%)' }} />
        <div className="absolute -bottom-[160px] -left-[80px] w-[360px] h-[360px] rounded-full pointer-events-none" style={{ filter: 'blur(90px)', background: 'radial-gradient(circle, hsl(195 78% 50% / .18), transparent 65%)' }} />

        {/* Quote */}
        <div className="relative z-10 max-w-[460px]">
          <span
            className="inline-block font-mono text-[10.5px] uppercase tracking-[.06em] px-3 py-1.5 rounded-full mb-5"
            style={{
              color: 'var(--brand-light)',
              background: 'var(--brand-dim)',
              border: '1px solid color-mix(in oklab, var(--brand) 30%, transparent)',
            }}
          >
            Studio agentique
          </span>
          <h2
            className="font-semibold leading-[1.25] tracking-[-0.025em] mb-4"
            style={{ fontFamily: 'var(--font-display)', fontSize: '26px' }}
          >
            Quatre agents collaborent pour transformer votre repo en démo SaaS prête à publier.
          </h2>
          <p className="text-[14.5px] leading-[1.6]" style={{ color: 'var(--text-sec)' }}>
            Scout lit le code, Director script le parcours, Faker génère les données, Narrator guide le spectateur. Vous pilotez, ils exécutent.
          </p>
        </div>

        {/* Agent status mock */}
        <div
          className="relative z-10 max-w-[460px] p-[18px] rounded-2xl"
          style={{
            background: 'var(--surface-glass)',
            backdropFilter: 'blur(14px)',
            border: '1px solid var(--border-hover)',
          }}
        >
          <div className="flex justify-between items-center mb-3.5">
            <span className="font-mono text-[10.5px] uppercase tracking-[.06em]" style={{ color: 'var(--text-ter)' }}>
              Status studio · live
            </span>
            <span
              className="font-mono text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-[.04em]"
              style={{ background: 'var(--brand-dim)', color: 'var(--brand-light)' }}
            >
              4/4 actifs
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {agents.map(a => (
              <div key={a.av} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-mono text-[10px] font-semibold flex-shrink-0"
                  style={{
                    background: `color-mix(in oklab, ${a.color} 18%, transparent)`,
                    color: a.color,
                    border: `1px solid color-mix(in oklab, ${a.color} 30%, transparent)`,
                  }}
                >
                  {a.av}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium">{a.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[.04em]" style={{ color: 'var(--text-ter)' }}>
                    {a.role}
                  </p>
                </div>
                <div className="w-20 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--bg)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${a.pct}%`, background: a.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
