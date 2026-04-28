import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { requireAuth, requireOrgMember, unauthorized, badRequest, forbidden, serverError } from '@/lib/api'
import { inngest } from '@/inngest/client'

export async function POST(request: NextRequest) {
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  const body = await request.json()
  const { org_id, project_id, title, brief, template_slug, tags, duration_target_s, duplicate_from } = body

  if (!org_id || !project_id || !title) return badRequest('org_id, project_id, title required')

  const member = await requireOrgMember(supabase, user.id, org_id, 'editor')
  if (!member) return forbidden()

  const svc = createServiceClient()

  // Duplication : copie le storyboard de la démo source
  let storyboard = {}
  if (duplicate_from) {
    const { data: source } = await svc
      .from('demos')
      .select('storyboard, tags, duration_target_s')
      .eq('id', duplicate_from)
      .single()
    if (source) {
      storyboard = source.storyboard ?? {}
    }
  }

  const { data: demo, error } = await svc
    .from('demos')
    .insert({
      org_id,
      project_id,
      title,
      brief: brief ?? null,
      template_slug: template_slug ?? null,
      tags: tags ?? {},
      duration_target_s: duration_target_s ?? null,
      duplicated_from: duplicate_from ?? null,
      storyboard,
      status: 'draft',
      created_by: user.id,
    })
    .select()
    .single()

  if (error || !demo) {
    console.error('[demos/POST] create failed', error)
    return serverError('Failed to create demo')
  }

  // Déclenche les agents si brief fourni
  if (brief) {
    await inngest.send({
      name: 'agents/run',
      data: { demo_id: demo.id, org_id, project_id, brief, template_slug },
    })
  }

  return NextResponse.json({ demo })
}

export async function GET(request: NextRequest) {
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  const orgId = request.nextUrl.searchParams.get('org_id')
  if (!orgId) return badRequest('org_id required')

  const member = await requireOrgMember(supabase, user.id, orgId)
  if (!member) return forbidden()

  const { data: demos, error } = await supabase
    .from('demos')
    .select('id, title, status, template_slug, duration_target_s, created_at, updated_at')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (error) return serverError('Failed to fetch demos')
  return NextResponse.json({ demos })
}
