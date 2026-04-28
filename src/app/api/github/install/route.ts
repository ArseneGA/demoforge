import { NextRequest, NextResponse } from 'next/server'
import { getGitHubOAuthUrl } from '@/lib/github'
import { requireAuth, requireOwnerOrg, unauthorized, forbidden, serverError } from '@/lib/api'
import { randomBytes } from 'crypto'

export async function GET(_request: NextRequest) {
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  const member = await requireOwnerOrg(supabase, user.id)
  if (!member) return forbidden('Only org owners can connect GitHub.')

  const state = Buffer.from(JSON.stringify({
    org_id: member.org_id,
    nonce: randomBytes(16).toString('hex'),
  })).toString('base64url')

  try {
    return NextResponse.redirect(getGitHubOAuthUrl(state))
  } catch {
    return serverError('GitHub App not configured. Set GITHUB_APP_SLUG in .env.local')
  }
}
