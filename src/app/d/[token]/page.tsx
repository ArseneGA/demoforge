import { NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { notFound } from 'next/navigation'
import { DemoPlayer } from '@/components/player/DemoPlayer'
import { headers } from 'next/headers'

export const metadata = { title: 'DemoForge — Démo interactive' }

function detectDevice(ua: string): 'mobile' | 'desktop' {
  return /mobile|android|iphone|ipad/i.test(ua) ? 'mobile' : 'desktop'
}

// No auth check — public page
export default async function PlayerPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const hdrs = await headers()
  const ua = hdrs.get('user-agent') ?? ''
  const device = detectDevice(ua)
  const country = hdrs.get('x-vercel-ip-country') ?? hdrs.get('cf-ipcountry') ?? null
  const svc = createServiceClient()

  // Resolve share link
  const { data: link } = await svc
    .from('share_links')
    .select('id, demo_id, visibility, expires_at')
    .eq('token', token)
    .single()

  if (!link) notFound()
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="font-mono text-[13px]" style={{ color: 'var(--text-ter)' }}>Ce lien a expiré.</p>
      </div>
    )
  }
  if (link.visibility !== 'public') {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="font-mono text-[13px]" style={{ color: 'var(--text-ter)' }}>Accès restreint.</p>
      </div>
    )
  }

  // Fetch demo
  const { data: demo } = await svc
    .from('demos')
    .select('id, title, project_id')
    .eq('id', link.demo_id)
    .single()

  if (!demo) notFound()

  // Fetch project design tokens
  const { data: tokens } = await svc
    .from('design_tokens')
    .select('colors, typography, logo_url, favicon_url')
    .eq('project_id', demo.project_id)
    .maybeSingle()

  // Fetch project info
  const { data: project } = await svc
    .from('projects')
    .select('repo_full_name')
    .eq('id', demo.project_id)
    .single()

  // Fetch steps
  const { data: steps } = await svc
    .from('steps')
    .select('id, order_index, route_path, intent, actions, duration_s')
    .eq('demo_id', demo.id)
    .order('order_index', { ascending: true })

  // Fetch annotations
  const stepIds = (steps ?? []).map(s => s.id)
  let annotations: any[] = []
  if (stepIds.length > 0) {
    const { data } = await svc
      .from('annotations')
      .select('id, step_id, text, position, trigger_at_ms, duration_ms, style')
      .in('step_id', stepIds)
    annotations = data ?? []
  }

  return (
    <DemoPlayer
      shareLinkId={link.id}
      demo={{ id: demo.id, title: demo.title }}
      projectName={project?.repo_full_name ?? ''}
      steps={steps ?? []}
      annotations={annotations}
      designTokens={tokens ?? null}
      viewerDevice={device}
      viewerCountry={country}
    />
  )
}
