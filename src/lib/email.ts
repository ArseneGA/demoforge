import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'DemoForge <noreply@demoforge.app>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'

// ─── Welcome email ────────────────────────────────────────
export async function sendWelcomeEmail(to: string) {
  if (!process.env.RESEND_API_KEY) return
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Bienvenue sur DemoForge 🎬',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0e0d11;background:#fff">
        <h1 style="font-size:22px;font-weight:700;margin-bottom:8px">Bienvenue sur DemoForge</h1>
        <p style="color:#666;margin-bottom:24px">Votre repo est connecté. Voici 3 tips pour créer votre première démo en 30 minutes :</p>
        <ol style="padding-left:20px;color:#333;line-height:2">
          <li><strong>Briefez Director</strong> — décrivez votre cible et la durée souhaitée</li>
          <li><strong>Vérifiez le storyboard</strong> — ajustez les étapes, durées et annotations</li>
          <li><strong>Partagez le lien</strong> — copiez l'URL depuis "Partager" dans l'éditeur</li>
        </ol>
        <a href="${APP_URL}/chat" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Créer ma première démo →
        </a>
        <p style="margin-top:32px;font-size:12px;color:#999">DemoForge · <a href="${APP_URL}" style="color:#7c3aed">demoforge.app</a></p>
      </div>
    `,
  })
}

// ─── Invitation email ─────────────────────────────────────
export async function sendInvitationEmail(to: string, orgName: string, inviteUrl: string, inviterEmail: string) {
  if (!process.env.RESEND_API_KEY) return
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${inviterEmail} vous invite sur DemoForge`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0e0d11;background:#fff">
        <h1 style="font-size:22px;font-weight:700;margin-bottom:8px">Vous avez été invité</h1>
        <p style="color:#666;margin-bottom:8px">
          <strong>${inviterEmail}</strong> vous invite à rejoindre l'organisation <strong>${orgName}</strong> sur DemoForge.
        </p>
        <p style="color:#666;margin-bottom:24px">
          DemoForge transforme votre repo GitHub en démos SaaS scriptées et jouables, en 30 minutes.
        </p>
        <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Accepter l'invitation →
        </a>
        <p style="margin-top:24px;font-size:12px;color:#999">Ce lien expire dans 3 jours.</p>
        <p style="margin-top:16px;font-size:12px;color:#999">DemoForge · <a href="${APP_URL}" style="color:#7c3aed">demoforge.app</a></p>
      </div>
    `,
  })
}

// ─── Re-scan notification ─────────────────────────────────
export async function sendRescanEmail(to: string, repoFullName: string, branch: string) {
  if (!process.env.RESEND_API_KEY) return
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Nouveaux commits sur ${repoFullName} — re-scanner ?`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0e0d11;background:#fff">
        <h1 style="font-size:22px;font-weight:700;margin-bottom:8px">Nouveaux commits détectés</h1>
        <p style="color:#666;margin-bottom:8px">
          De nouveaux commits ont été poussés sur <strong>${repoFullName}</strong> (branche <code>${branch}</code>).
        </p>
        <p style="color:#666;margin-bottom:24px">
          Vos démos existantes peuvent être désynchronisées. Re-scannez pour les mettre à jour.
        </p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Aller au dashboard →
        </a>
        <p style="margin-top:32px;font-size:12px;color:#999">DemoForge · <a href="${APP_URL}" style="color:#7c3aed">demoforge.app</a></p>
      </div>
    `,
  })
}
