import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { requireAuth, requireOrgMember, unauthorized, forbidden, notFound } from '@/lib/api'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  const svc = createServiceClient()

  const { data: demo } = await svc
    .from('demos')
    .select('id, org_id')
    .eq('id', id)
    .single()
  if (!demo) return notFound('Demo not found')

  const member = await requireOrgMember(supabase, user.id, demo.org_id)
  if (!member) return forbidden()

  const { data: views } = await svc
    .from('demo_views')
    .select('duration_ms, ended_at_step_index, user_agent_device, ip_country, started_at')
    .eq('demo_id', id)
    .order('started_at', { ascending: false })

  const { count: stepCount } = await svc
    .from('steps')
    .select('*', { count: 'exact', head: true })
    .eq('demo_id', id)

  const all = views ?? []
  const totalViews = all.length
  const withDuration = all.filter(v => v.duration_ms && v.duration_ms > 0)
  const avgDuration = withDuration.length > 0
    ? Math.round(withDuration.reduce((s, v) => s + (v.duration_ms ?? 0), 0) / withDuration.length)
    : 0

  const maxStep = Math.max(0, (stepCount ?? 1) - 1)
  const completionRate = totalViews > 0
    ? Math.round(all.filter(v => (v.ended_at_step_index ?? 0) >= maxStep).length / totalViews * 100)
    : 0

  // How many viewers reached each step index (cumulative)
  const stepReach: number[] = []
  for (let i = 0; i <= maxStep; i++) {
    stepReach.push(all.filter(v => (v.ended_at_step_index ?? 0) >= i).length)
  }

  const devices = { desktop: 0, mobile: 0, unknown: 0 }
  const countries: Record<string, number> = {}
  for (const v of all) {
    const d = v.user_agent_device as string ?? 'unknown'
    if (d === 'mobile') devices.mobile++
    else if (d === 'desktop') devices.desktop++
    else devices.unknown++
    if (v.ip_country) countries[v.ip_country] = (countries[v.ip_country] ?? 0) + 1
  }

  const topCountries = Object.entries(countries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([country, count]) => ({ country, count }))

  return NextResponse.json({
    total_views: totalViews,
    avg_duration_ms: avgDuration,
    completion_rate: completionRate,
    step_reach: stepReach,
    step_count: stepCount ?? 0,
    devices,
    top_countries: topCountries,
    recent: all.slice(0, 8).map(v => ({
      started_at: v.started_at,
      duration_ms: v.duration_ms,
      ended_at_step_index: v.ended_at_step_index,
      device: v.user_agent_device ?? 'unknown',
      country: v.ip_country,
    })),
  })
}
