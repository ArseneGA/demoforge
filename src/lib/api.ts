import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export type OrgRole = 'owner' | 'editor' | 'viewer'

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function forbidden(msg = 'Insufficient permissions') {
  return NextResponse.json({ error: msg }, { status: 403 })
}

export function notFound(msg = 'Not found') {
  return NextResponse.json({ error: msg }, { status: 404 })
}

export function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 })
}

export function serverError(msg = 'Internal server error') {
  return NextResponse.json({ error: msg }, { status: 500 })
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'
}

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { user, supabase }
}

export async function requireOrgMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  orgId: string,
  minRole: OrgRole = 'viewer'
) {
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single()

  if (!member) return null

  const hierarchy: OrgRole[] = ['viewer', 'editor', 'owner']
  const memberIdx = hierarchy.indexOf(member.role as OrgRole)
  const requiredIdx = hierarchy.indexOf(minRole)

  if (memberIdx < requiredIdx) return null

  return member
}

export async function requireOwnerOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: member } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', userId)
    .eq('role', 'owner')
    .single()

  return member
}

const SAFE_REDIRECT_PATHS = ['/dashboard', '/onboarding', '/chat', '/storyboard']

export function safeRedirectPath(next: string | null | undefined): string {
  if (!next) return '/dashboard'
  if (SAFE_REDIRECT_PATHS.some(p => next.startsWith(p))) return next
  return '/dashboard'
}
