import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { requireAuth, requireOrgMember, unauthorized, forbidden, badRequest, notFound, serverError } from '@/lib/api'

async function resolveDemo(id: string) {
  const svc = createServiceClient()
  const { data } = await svc
    .from('demos')
    .select('org_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  return data
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  const demo = await resolveDemo(id)
  if (!demo) return notFound('Demo not found')

  const member = await requireOrgMember(supabase, user.id, demo.org_id, 'editor')
  if (!member) return forbidden()

  const svc = createServiceClient()
  const { error } = await svc
    .from('demos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return serverError('Failed to delete demo')
  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  const demo = await resolveDemo(id)
  if (!demo) return notFound('Demo not found')

  const member = await requireOrgMember(supabase, user.id, demo.org_id, 'editor')
  if (!member) return forbidden()

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if (body.status !== undefined) updates.status = body.status
  if (body.title !== undefined) updates.title = body.title

  if (Object.keys(updates).length === 0) return badRequest('Nothing to update')

  const svc = createServiceClient()
  const { error } = await svc.from('demos').update(updates).eq('id', id)
  if (error) return serverError('Failed to update demo')
  return NextResponse.json({ success: true })
}
