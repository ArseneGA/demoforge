import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/utils/supabase/service'
import { sendRescanEmail } from '@/lib/email'

function verifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret) {
    console.error('[github/webhook] GITHUB_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const body = await request.text()
  const sig = request.headers.get('x-hub-signature-256')
  const event = request.headers.get('x-github-event')

  if (!verifySignature(body, sig, secret)) {
    console.warn('[github/webhook] invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Only handle push events
  if (event !== 'push') {
    return NextResponse.json({ received: true, skipped: true })
  }

  let payload: {
    ref?: string
    after?: string
    repository?: { full_name?: string }
    head_commit?: { id?: string; message?: string }
  }
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const repoFullName = payload.repository?.full_name
  const ref = payload.ref // e.g. "refs/heads/main"
  const newCommitSha = payload.after ?? payload.head_commit?.id

  if (!repoFullName || !ref || !newCommitSha) {
    return NextResponse.json({ received: true, skipped: true })
  }

  // Extract branch name from ref (refs/heads/main → main)
  const branch = ref.replace(/^refs\/heads\//, '')

  const svc = createServiceClient()

  // Find all projects tracking this repo + branch
  const { data: projects } = await svc
    .from('projects')
    .select('id, commit_sha, org_id')
    .eq('repo_full_name', repoFullName)
    .eq('branch', branch)
    .eq('scan_status', 'ready')
    .is('deleted_at', null)

  if (!projects || projects.length === 0) {
    console.log(`[github/webhook] no tracked projects for ${repoFullName}@${branch}`)
    return NextResponse.json({ received: true, affected: 0 })
  }

  // Mark projects as having new commits
  const ids = projects.map(p => p.id)
  await svc
    .from('projects')
    .update({ has_new_commits: true, commit_sha: newCommitSha })
    .in('id', ids)

  console.log(`[github/webhook] push on ${repoFullName}@${branch} → ${ids.length} project(s) marked stale`)

  // Notify org owners by email
  for (const project of projects) {
    const { data: members } = await svc
      .from('org_members')
      .select('user_id')
      .eq('org_id', project.org_id)
      .eq('role', 'owner')
    const ownerIds = (members ?? []).map(m => m.user_id)
    if (ownerIds.length > 0) {
      const { data: users } = await svc.auth.admin.listUsers()
      const emails = (users?.users ?? [])
        .filter(u => ownerIds.includes(u.id) && u.email)
        .map(u => u.email!)
      for (const email of emails) {
        sendRescanEmail(email, repoFullName, branch).catch(err =>
          console.error('[webhook] rescan email failed', err)
        )
      }
    }
  }

  return NextResponse.json({ received: true, affected: ids.length })
}
