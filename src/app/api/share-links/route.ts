import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { requireAuth, requireOrgMember, unauthorized, forbidden, badRequest, serverError } from '@/lib/api'

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

export async function POST(request: NextRequest) {
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  const body = await request.json()
  const { demo_id, org_id, visibility = 'public' } = body
  if (!demo_id || !org_id) return badRequest('demo_id and org_id required')

  const member = await requireOrgMember(supabase, user.id, org_id, 'editor')
  if (!member) return forbidden()

  const svc = createServiceClient()

  // Check if a public link already exists for this demo
  const { data: existing } = await svc
    .from('share_links')
    .select('id, token')
    .eq('demo_id', demo_id)
    .eq('visibility', visibility)
    .is('expires_at', null)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ token: existing.token })
  }

  const token = generateToken()
  const { data, error } = await svc
    .from('share_links')
    .insert({ demo_id, token, visibility, created_by: user.id })
    .select('token')
    .single()

  if (error || !data) return serverError('Failed to create share link')

  // Mark demo as published
  await svc.from('demos').update({ status: 'published' }).eq('id', demo_id)

  return NextResponse.json({ token: data.token })
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return badRequest('token required')

  const svc = createServiceClient()
  const { data: link } = await svc
    .from('share_links')
    .select('id, demo_id, visibility, expires_at')
    .eq('token', token)
    .single()

  if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 })
  }
  if (link.visibility !== 'public') {
    return NextResponse.json({ error: 'Auth required' }, { status: 401 })
  }

  return NextResponse.json({ link_id: link.id, demo_id: link.demo_id })
}
