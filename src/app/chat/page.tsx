import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { ChatShell } from "@/components/chat/ChatShell"

export const metadata = { title: "Chat — Scripter la démo" }

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ demo_id?: string; project_id?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: member } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single()

  if (!member) redirect("/onboarding")

  // Projets scannés disponibles
  const { data: projects } = await supabase
    .from("projects")
    .select("id, repo_full_name, branch, framework")
    .eq("org_id", member.org_id)
    .eq("scan_status", "ready")
    .is("deleted_at", null)

  const params = await searchParams
  const demoId = params.demo_id ?? null
  const projectId = params.project_id ?? projects?.[0]?.id ?? null

  // Démos récentes (sidebar)
  const { data: recentDemos } = await supabase
    .from("demos")
    .select("id, title, status")
    .eq("org_id", member.org_id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(12)

  // Charge les messages existants si demo_id fourni
  let existingMessages: any[] = []
  let existingDemo: any = null
  if (demoId) {
    const [{ data: msgs }, { data: demo }] = await Promise.all([
      supabase
        .from("agent_messages")
        .select("id, agent, role, content, metadata, created_at")
        .eq("demo_id", demoId)
        .order("created_at", { ascending: true }),
      supabase
        .from("demos")
        .select("id, title, status, project_id")
        .eq("id", demoId)
        .single(),
    ])
    existingMessages = msgs ?? []
    existingDemo = demo
  }

  const firstName = user.email?.split("@")[0] ?? "vous"

  return (
    <ChatShell
      orgId={member.org_id}
      userId={user.id}
      firstName={firstName}
      projects={projects ?? []}
      initialProjectId={existingDemo?.project_id ?? projectId}
      initialDemoId={demoId}
      initialMessages={existingMessages}
      initialDemo={existingDemo}
      recentDemos={recentDemos ?? []}
    />
  )
}
