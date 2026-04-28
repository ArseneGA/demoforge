import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { requireAuth, requireOrgMember, unauthorized, forbidden, badRequest, notFound, serverError } from '@/lib/api'

async function resolveDemo(id: string) {
  return createServiceClient().from('demos').select('org_id').eq('id', id).single()
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  const { data: demo } = await resolveDemo(id)
  if (!demo) return notFound('Demo not found')

  const member = await requireOrgMember(supabase, user.id, demo.org_id)
  if (!member) return forbidden()

  const svc = createServiceClient()
  const { data: comments, error } = await svc
    .from('comments')
    .select('id, step_id, user_email, content, created_at')
    .eq('demo_id', id)
    .order('created_at', { ascending: true })

  if (error) return serverError('Failed to fetch comments')
  return NextResponse.json({ comments: comments ?? [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  const { content, step_id } = await request.json()
  if (!content?.trim()) return badRequest('content required')

  const { data: demo } = await resolveDemo(id)
  if (!demo) return notFound('Demo not found')

  const member = await requireOrgMember(supabase, user.id, demo.org_id, 'editor')
  if (!member) return forbidden()

  const svc = createServiceClient()
  const { data: comment, error } = await svc
    .from('comments')
    .insert({
      demo_id: id,
      step_id: step_id ?? null,
      user_id: user.id,
      user_email: user.email ?? 'unknown',
      content: content.trim(),
    })
    .select('id, step_id, user_email, content, created_at')
    .single()

  if (error || !comment) return serverError('Failed to create comment')
  return NextResponse.json({ comment })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user } = await requireAuth()
  if (!user) return unauthorized()

  const { comment_id } = await request.json()
  if (!comment_id) return badRequest('comment_id required')

  const svc = createServiceClient()
  const { error } = await svc
    .from('comments')
    .delete()
    .eq('id', comment_id)
    .eq('user_id', user.id)

  if (error) return serverError('Failed to delete comment')
  return NextResponse.json({ success: true })
}
