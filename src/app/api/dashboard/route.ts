import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireOrgMember, unauthorized, badRequest, forbidden, serverError } from '@/lib/api'

export async function GET(request: NextRequest) {
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  const orgId = request.nextUrl.searchParams.get('org_id')
  if (!orgId) return badRequest('org_id required')

  const member = await requireOrgMember(supabase, user.id, orgId)
  if (!member) return forbidden()

  // Projets de l'org
  const { data: projects } = await supabase
    .from('projects')
    .select('id, repo_full_name, scan_status')
    .eq('org_id', orgId)
    .is('deleted_at', null)

  // Démos avec leurs steps et jobs
  const { data: demos } = await supabase
    .from('demos')
    .select(`
      id, title, status, template_slug, duration_target_s, created_at, updated_at,
      jobs(status, progress)
    `)
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (!demos) return serverError('Failed to fetch demos')

  // KPIs
  const activeProjects = (projects ?? []).filter(p => p.scan_status === 'ready').length
  const publishedThisMonth = (demos ?? []).filter(d => {
    if (d.status !== 'published') return false
    const updated = new Date(d.updated_at)
    const now = new Date()
    return updated.getMonth() === now.getMonth() && updated.getFullYear() === now.getFullYear()
  }).length

  const rendering = (demos ?? []).filter(d => {
    const job = Array.isArray(d.jobs) ? d.jobs[0] : null
    return job?.status === 'running'
  }).length

  return NextResponse.json({
    projects: projects ?? [],
    demos: demos ?? [],
    kpis: {
      active_projects: activeProjects,
      total_projects: (projects ?? []).length,
      rendering,
      published_this_month: publishedThisMonth,
    },
  })
}
