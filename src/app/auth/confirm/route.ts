import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { safeRedirectPath } from '@/lib/api'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeRedirectPath(searchParams.get('next'))

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=AuthLinkInvalid', request.url))
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/login?error=AuthLinkInvalid', request.url))
  }

  const { data: { user } } = await supabase.auth.getUser()

  let redirectPath = next
  if (user && next === '/dashboard') {
    const { data: memberships } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)

    const orgIds = (memberships ?? []).map(m => m.org_id)

    const { count } = orgIds.length > 0
      ? await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .in('org_id', orgIds)
          .is('deleted_at', null)
      : { count: 0 }

    if ((count ?? 0) === 0) {
      redirectPath = '/onboarding'
      // Send welcome email to new users
      if (user.email) {
        sendWelcomeEmail(user.email).catch(err => console.error('[auth/confirm] welcome email failed', err))
      }
    }
  }

  const response = NextResponse.redirect(new URL(redirectPath, request.url))

  // Propage uniquement les cookies de session Supabase
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, cookie.value)
    }
  }

  return response
}
