import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { WizardShell } from "@/components/onboarding/WizardShell"

export const metadata = { title: "Connecter votre code" }

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; installed?: string; error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Org de l'user
  const { data: member } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .single()

  if (!member) redirect("/login")

  // Installation GitHub existante ?
  const { data: installation } = await supabase
    .from("github_installations")
    .select("id, github_install_id, github_account_login")
    .eq("org_id", member.org_id)
    .maybeSingle()

  // Projet déjà créé ?
  const { data: project } = await supabase
    .from("projects")
    .select("id, repo_full_name, branch, scan_status, framework")
    .eq("org_id", member.org_id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .maybeSingle()

  const params = await searchParams
  const initialStep = params.step ? Number(params.step) : installation ? 2 : 1
  const error = params.error ?? null

  return (
    <div className="flex flex-col" style={{ height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <WizardShell
        orgId={member.org_id}
        isOwner={member.role === "owner"}
        installation={installation ?? null}
        existingProject={project ?? null}
        initialStep={initialStep}
        error={error}
      />
    </div>
  )
}
