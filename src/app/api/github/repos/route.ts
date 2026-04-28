import { NextRequest, NextResponse } from 'next/server'
import { getGitHubApp } from '@/lib/github'
import { requireAuth, requireOrgMember, unauthorized, badRequest, forbidden, notFound, serverError } from '@/lib/api'

export interface GithubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  description: string | null
  default_branch: string
  language: string | null
  updated_at: string | null
  owner: { login: string; type: string }
}

const MAX_PAGES = 10

export async function GET(request: NextRequest) {
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  const orgId = request.nextUrl.searchParams.get('org_id')
  if (!orgId) return badRequest('org_id required')

  const member = await requireOrgMember(supabase, user.id, orgId)
  if (!member) return forbidden()

  const { data: installation } = await supabase
    .from('github_installations')
    .select('github_install_id')
    .eq('org_id', orgId)
    .single()

  if (!installation) {
    return notFound('No GitHub App installation found for this org')
  }

  try {
    const app = getGitHubApp()
    const octokit = await app.getInstallationOctokit(installation.github_install_id)

    const repos: GithubRepo[] = []

    for (let page = 1; page <= MAX_PAGES; page++) {
      const { data } = await octokit.request('GET /installation/repositories', {
        per_page: 100,
        page,
      })

      for (const r of data.repositories) {
        repos.push({
          id: r.id,
          name: r.name,
          full_name: r.full_name,
          private: r.private,
          description: r.description ?? null,
          default_branch: r.default_branch,
          language: r.language ?? null,
          updated_at: r.updated_at ?? null,
          owner: { login: r.owner.login, type: r.owner.type },
        })
      }

      if (data.repositories.length < 100) break
    }

    return NextResponse.json({ repos, installation_id: installation.github_install_id })
  } catch (err) {
    console.error('[github/repos] fetch failed', { orgId, err })
    return serverError('Failed to fetch repos from GitHub')
  }
}
