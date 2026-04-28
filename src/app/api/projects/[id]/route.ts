import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { requireAuth, requireOrgMember, unauthorized, forbidden, notFound, serverError } from '@/lib/api'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  // Vérifie que le projet appartient bien à une org de l'user
  const { data: project } = await supabase
    .from('projects')
    .select('org_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!project) return notFound('Project not found')

  const member = await requireOrgMember(supabase, user.id, project.org_id, 'editor')
  if (!member) return forbidden()

  const svc = createServiceClient()
  const { error } = await svc
    .from('projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return serverError('Failed to delete project')
  return NextResponse.json({ success: true })
}
