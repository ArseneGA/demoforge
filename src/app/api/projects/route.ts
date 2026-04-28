import { NextRequest, NextResponse } from 'next/server'
import { inngest } from '@/inngest/client'
import { createServiceClient } from '@/utils/supabase/service'
import { requireAuth, requireOrgMember, unauthorized, badRequest, forbidden, serverError } from '@/lib/api'

export async function POST(request: NextRequest) {
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  const body = await request.json()
  const { org_id, github_install_id, repo_full_name, branch, package_path } = body

  if (!org_id || !github_install_id || !repo_full_name || !branch) {
    return badRequest('Missing required fields: org_id, github_install_id, repo_full_name, branch')
  }

  const member = await requireOrgMember(supabase, user.id, org_id, 'editor')
  if (!member) return forbidden()

  // Service client pour bypasser RLS sur les tables sans policy INSERT (projects, jobs)
  const svc = createServiceClient()

  // Check if project already exists (avoids upsert conflict with partial index)
  const { data: existing } = await svc
    .from('projects')
    .select('id')
    .eq('org_id', org_id)
    .eq('repo_full_name', repo_full_name)
    .eq('branch', branch)
    .is('package_path', package_path ?? null)
    .is('deleted_at', null)
    .maybeSingle()

  let project: { id: string } | null = null

  if (existing) {
    const { data, error } = await svc
      .from('projects')
      .update({ scan_status: 'pending', github_install_id })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) { console.error('[projects/POST] update failed', error); return serverError('Failed to update project') }
    project = data
  } else {
    const { data, error } = await svc
      .from('projects')
      .insert({ org_id, github_install_id, repo_full_name, branch, package_path: package_path ?? null, scan_status: 'pending' })
      .select()
      .single()
    if (error) { console.error('[projects/POST] create failed', error); return serverError('Failed to create project') }
    project = data
  }

  if (!project) return serverError('Failed to get project')

  const { data: job, error: jobError } = await svc
    .from('jobs')
    .insert({ org_id, project_id: project.id, kind: 'scan', status: 'queued' })
    .select()
    .single()

  if (jobError || !job) {
    console.error('[projects/POST] job create failed', jobError)
    return serverError('Failed to create scan job')
  }

  await inngest.send({
    name: 'scout/scan.repo',
    data: {
      project_id: project.id,
      org_id,
      job_id: job.id,
      repo_full_name,
      branch,
      package_path: package_path ?? null,
      github_install_id,
    },
  })

  return NextResponse.json({ project, job })
}

export async function GET(request: NextRequest) {
  const { user, supabase } = await requireAuth()
  if (!user) return unauthorized()

  const orgId = request.nextUrl.searchParams.get('org_id')
  if (!orgId) return badRequest('org_id required')

  const member = await requireOrgMember(supabase, user.id, orgId)
  if (!member) return forbidden()

  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, repo_full_name, branch, framework, ui_lib, scan_status, scanned_at, loc_count, github_installations(github_account_login)')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return serverError('Failed to fetch projects')

  return NextResponse.json({ projects })
}
