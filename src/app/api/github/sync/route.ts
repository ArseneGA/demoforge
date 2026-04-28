import { NextRequest, NextResponse } from 'next/server'
import { getGitHubApp } from '@/lib/github'
import { requireAuth, requireOwnerOrg, unauthorized, forbidden, serverError } from '@/lib/api'

// POST /api/github/sync
// Récupère toutes les installations de la GitHub App et persiste celles qui
// correspondent à cet org. Utile quand le callback n'a pas été appelé
// (App déjà installée avant la mise en place du flow).
export async function POST(request: NextRequest) {
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  const member = await requireOwnerOrg(supabase, user.id)
  if (!member) return forbidden('Only org owners can sync GitHub installations')

  try {
    const app = getGitHubApp()

    // Liste toutes les installations de l'App (depuis le JWT de l'App)
    const installations: Array<{
      id: number
      account_login: string
      account_type: string
    }> = []

    for await (const { installation } of app.eachInstallation.iterator()) {
      const account = installation.account as { login?: string; slug?: string; type?: string } | null
      installations.push({
        id: installation.id,
        account_login: account?.login ?? account?.slug ?? 'unknown',
        account_type: account?.type ?? 'User',
      })
    }

    if (installations.length === 0) {
      return NextResponse.json({ error: 'No GitHub App installations found. Install the App first.' }, { status: 404 })
    }

    // Persiste toutes les installations trouvées pour cet org
    const upserted = []
    for (const inst of installations) {
      const { data, error } = await supabase
        .from('github_installations')
        .upsert({
          org_id: member.org_id,
          github_install_id: inst.id,
          github_account_login: inst.account_login,
          github_account_type: inst.account_type,
        }, { onConflict: 'org_id,github_install_id' })
        .select()
        .single()

      if (!error && data) upserted.push(data)
    }

    return NextResponse.json({ synced: upserted.length, installations: upserted })
  } catch (err) {
    console.error('[github/sync] failed', err)
    return serverError('Failed to sync GitHub installations')
  }
}
