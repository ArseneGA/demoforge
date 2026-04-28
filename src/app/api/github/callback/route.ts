import { NextRequest, NextResponse } from 'next/server'
import { getGitHubApp } from '@/lib/github'
import { requireAuth, requireOrgMember, getAppUrl } from '@/lib/api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const installationId = searchParams.get('installation_id')
  const stateParam = searchParams.get('state')
  const appUrl = getAppUrl()

  if (!installationId || !stateParam) {
    return NextResponse.redirect(`${appUrl}/onboarding?error=github_callback_invalid`)
  }

  if (!Number.isSafeInteger(Number(installationId))) {
    return NextResponse.redirect(`${appUrl}/onboarding?error=github_callback_invalid`)
  }

  let orgId: string
  try {
    const decoded = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf-8'))
    orgId = decoded.org_id
    if (!orgId || typeof orgId !== 'string') throw new Error()
  } catch {
    return NextResponse.redirect(`${appUrl}/onboarding?error=github_state_invalid`)
  }

  const { user, supabase } = await requireAuth()
  if (!user) return NextResponse.redirect(`${appUrl}/login`)

  const member = await requireOrgMember(supabase, user.id, orgId, 'owner')
  if (!member) return NextResponse.redirect(`${appUrl}/onboarding?error=github_not_owner`)

  try {
    const app = getGitHubApp()
    const octokit = await app.getInstallationOctokit(Number(installationId))
    const { data: installation } = await octokit.request('GET /app/installations/{installation_id}', {
      installation_id: Number(installationId),
    })

    const account = installation.account as { login?: string; slug?: string; type?: string } | null
    const accountLogin = account?.login ?? account?.slug ?? 'unknown'
    const accountType = account?.type ?? 'User'

    const { error } = await supabase
      .from('github_installations')
      .upsert({
        org_id: orgId,
        github_install_id: Number(installationId),
        github_account_login: accountLogin,
        github_account_type: accountType,
      }, { onConflict: 'org_id,github_install_id' })

    if (error) throw error

    return NextResponse.redirect(`${appUrl}/onboarding?step=2&installed=true`)
  } catch (err) {
    console.error('[github/callback] install failed', { orgId, installationId, err })
    return NextResponse.redirect(`${appUrl}/onboarding?error=github_install_failed`)
  }
}
