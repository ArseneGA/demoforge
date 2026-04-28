import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/accept-invite/${token}`)
  }

  // Récupère l'invitation
  const { data: invite } = await supabase
    .from('invitations')
    .select('id, org_id, email, role, expires_at, accepted_at, orgs(name, slug)')
    .eq('token', token)
    .single()

  if (!invite) {
    return <InviteError message="Invitation introuvable ou déjà utilisée." />
  }

  if (invite.accepted_at) {
    return <InviteError message="Cette invitation a déjà été acceptée." />
  }

  if (new Date(invite.expires_at) < new Date()) {
    return <InviteError message="Cette invitation a expiré (valide 7 jours)." />
  }

  // Accepte l'invitation : ajoute le user à l'org
  const { error } = await supabase
    .from('org_members')
    .upsert({ org_id: invite.org_id, user_id: user.id, role: invite.role })

  if (error) {
    return <InviteError message="Erreur lors de l'acceptation. Réessayez." />
  }

  // Marque l'invitation comme acceptée
  await supabase
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  redirect('/dashboard')
}

function InviteError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center px-6">
        <div className="font-mono text-[11px] uppercase tracking-[.08em] mb-3" style={{ color: 'var(--brand)' }}>
          Invitation
        </div>
        <h1 className="text-[24px] font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Lien invalide
        </h1>
        <p className="text-[14px]" style={{ color: 'var(--text-sec)' }}>{message}</p>
        <a
          href="/dashboard"
          className="inline-block mt-6 px-5 py-2.5 rounded-xl text-[13px] font-medium text-white"
          style={{ background: 'var(--brand)' }}
        >
          Aller au dashboard
        </a>
      </div>
    </div>
  )
}
