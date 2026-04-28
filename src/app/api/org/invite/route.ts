import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireOrgMember, unauthorized, badRequest, forbidden, serverError } from '@/lib/api'
import { randomBytes } from 'crypto'
import { createServiceClient } from '@/utils/supabase/service'
import { sendInvitationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  const { org_id, email, role = 'editor' } = await request.json()
  if (!org_id || !email) return badRequest('org_id and email required')

  const member = await requireOrgMember(supabase, user.id, org_id, 'owner')
  if (!member) return forbidden('Only owners can invite members')

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({ org_id, email, role, token, expires_at: expiresAt, invited_by: user.id })
    .select()
    .single()

  if (error) {
    console.error('[org/invite] create failed', error)
    return serverError('Failed to create invitation')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'
  const inviteUrl = `${appUrl}/accept-invite/${token}`

  // Fetch org name for the email
  const svc = createServiceClient()
  const { data: org } = await svc.from('orgs').select('name').eq('id', org_id).single()

  // Send invitation email (fire and forget)
  sendInvitationEmail(email, org?.name ?? 'DemoForge', inviteUrl, user.email ?? '').catch(err =>
    console.error('[invite] email failed', err)
  )

  return NextResponse.json({
    invitation,
    invite_url: inviteUrl,
  })
}
