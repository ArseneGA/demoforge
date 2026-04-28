import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/DashboardShell"

export const metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  // Org de l'user
  const { data: member } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .single()

  if (!member) redirect("/onboarding")

  const { data: org } = await supabase
    .from("orgs")
    .select("plan, stripe_customer_id")
    .eq("id", member.org_id)
    .single()

  // Projets
  const { data: projects } = await supabase
    .from("projects")
    .select("id, repo_full_name, branch, scan_status, framework, github_install_id, has_new_commits")
    .eq("org_id", member.org_id)
    .is("deleted_at", null)

  // Démos
  const { data: demos } = await supabase
    .from("demos")
    .select("id, title, status, template_slug, duration_target_s, created_at, updated_at")
    .eq("org_id", member.org_id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(50)

  const firstName = user.email?.split("@")[0] ?? "vous"
  const activeProjects = (projects ?? []).filter(p => p.scan_status === "ready").length

  return (
    <DashboardShell
      firstName={firstName}
      userEmail={user.email ?? ""}
      orgId={member.org_id}
      orgPlan={(org?.plan ?? "free") as "free" | "forge" | "studio" | "atelier"}
      hasStripeCustomer={!!org?.stripe_customer_id}
      projects={projects ?? []}
      demos={demos ?? []}
      activeProjects={activeProjects}
    />
  )
}
