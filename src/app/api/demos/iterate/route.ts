import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { requireAuth, requireOrgMember, unauthorized, badRequest, forbidden } from '@/lib/api'
import { inngest } from '@/inngest/client'

// POST /api/demos/iterate
// Relance les agents sur une démo existante avec un nouveau message
export async function POST(request: NextRequest) {
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  const { demo_id, message } = await request.json()
  if (!demo_id || !message) return badRequest('demo_id and message required')

  // Récupère la démo
  const svc = createServiceClient()
  const { data: demo } = await svc
    .from('demos')
    .select('org_id, project_id, template_slug')
    .eq('id', demo_id)
    .single()

  if (!demo) return NextResponse.json({ error: 'Demo not found' }, { status: 404 })

  const member = await requireOrgMember(supabase, user.id, demo.org_id, 'editor')
  if (!member) return forbidden()

  // Sauvegarde le message de l'user
  await svc.from('agent_messages').insert({
    demo_id,
    agent: 'user',
    role: 'user',
    content: message,
    metadata: { iteration: true },
  })

  // Relance les agents
  await inngest.send({
    name: 'agents/run',
    data: {
      demo_id,
      org_id: demo.org_id,
      project_id: demo.project_id,
      brief: message,
      template_slug: demo.template_slug,
    },
  })

  return NextResponse.json({ ok: true })
}
