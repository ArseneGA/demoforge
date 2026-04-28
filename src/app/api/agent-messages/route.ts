import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { requireAuth, unauthorized, badRequest } from '@/lib/api'

// POST /api/agent-messages
// Sauvegarde le message de l'utilisateur dans le chat
export async function POST(request: NextRequest) {
  const { user } = await requireAuth()
  if (!user) return unauthorized()

  const { demo_id, content } = await request.json()
  if (!demo_id || !content) return badRequest('demo_id and content required')

  const svc = createServiceClient()
  const { data, error } = await svc
    .from('agent_messages')
    .insert({
      demo_id,
      agent: 'user',
      role: 'user',
      content,
      metadata: { user_id: user.id },
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data })
}
