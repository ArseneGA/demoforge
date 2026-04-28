import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { EditorShell } from "@/components/editor/EditorShell"

export const metadata = { title: "Storyboard" }

export default async function StoryboardPage({
  searchParams,
}: {
  searchParams: Promise<{ demo_id?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const demoId = params.demo_id
  if (!demoId) redirect("/dashboard")

  const { data: member } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .single()
  if (!member) redirect("/onboarding")

  const { data: demo } = await supabase
    .from("demos")
    .select("id, title, status, project_id")
    .eq("id", demoId)
    .single()
  if (!demo) redirect("/dashboard")

  const { data: project } = await supabase
    .from("projects")
    .select("repo_full_name, branch, framework")
    .eq("id", demo.project_id)
    .single()

  const { data: steps } = await supabase
    .from("steps")
    .select("id, order_index, route_path, intent, actions, duration_s, transition_in")
    .eq("demo_id", demoId)
    .order("order_index", { ascending: true })

  const stepIds = (steps ?? []).map(s => s.id)
  let annotations: any[] = []
  if (stepIds.length > 0) {
    const { data } = await supabase
      .from("annotations")
      .select("id, step_id, target_selector, position, text, trigger_at_ms, duration_ms, style")
      .in("step_id", stepIds)
    annotations = data ?? []
  }

  const { data: mocks } = await supabase
    .from("mocks")
    .select("id, endpoint_method, endpoint_path, latency_ms")
    .eq("demo_id", demoId)

  return (
    <EditorShell
      demo={{ id: demo.id, title: demo.title, status: demo.status, project_id: demo.project_id }}
      project={project ?? { repo_full_name: "—", branch: "main", framework: null }}
      steps={steps ?? []}
      annotations={annotations}
      mocks={mocks ?? []}
      orgId={member.org_id}
    />
  )
}
