import { inngest } from './client'
import { createServiceClient } from '@/utils/supabase/service'
import { runScan } from '@/lib/scout'
import { runDirector } from '@/lib/agents/director'
import { runFaker } from '@/lib/agents/faker'
import { runNarrator } from '@/lib/agents/narrator'

// ─── scout/scan.repo ─────────────────────────────────────
export const scanRepo = inngest.createFunction(
  {
    id: 'scout-scan-repo',
    name: 'Scout — Scan repo',
    retries: 1,
    triggers: [{ event: 'scout/scan.repo' }],
  },
  async ({ event, step }) => {
    const { project_id, org_id, job_id, repo_full_name, branch, github_install_id } = event.data
    const svc = createServiceClient()

    await step.run('start-job', async () => {
      if (job_id) {
        await svc.from('jobs').update({
          status: 'running',
          started_at: new Date().toISOString(),
          progress: 2,
        }).eq('id', job_id)
      }
      await svc.from('projects').update({ scan_status: 'scanning' }).eq('id', project_id)
    })

    await step.run('scout-scan', async () => {
      await runScan(
        { project_id, org_id, job_id, repo_full_name, branch, github_install_id_uuid: github_install_id },
        async (progress, message) => {
          if (job_id) await svc.from('jobs').update({ progress }).eq('id', job_id)
          console.log(`[Scout] ${progress}% — ${message}`)
        }
      )
    })

    await step.run('complete-job', async () => {
      if (job_id) {
        await svc.from('jobs').update({
          status: 'success', progress: 100,
          completed_at: new Date().toISOString(),
        }).eq('id', job_id)
      }
    })

    return { project_id, status: 'ready', repo: repo_full_name }
  }
)

// ─── agents/run ──────────────────────────────────────────
// Director → Faker ‖ Narrator (Sprint 3 — real implementation)
export const runAgents = inngest.createFunction(
  {
    id: 'agents-run',
    name: 'Agents — Run (Director + Faker + Narrator)',
    retries: 1,
    triggers: [{ event: 'agents/run' }],
  },
  async ({ event, step }) => {
    const { demo_id, org_id, project_id, brief, template_slug } = event.data
    const svc = createServiceClient()

    // Crée le job pour le tracking
    const { data: job } = await svc
      .from('jobs')
      .insert({ org_id, demo_id, kind: 'agents', status: 'running', started_at: new Date().toISOString() })
      .select()
      .single()

    // Vérifie qu'il n'y a pas déjà un message de démarrage (idempotent en cas de retry)
    const { count } = await svc
      .from('agent_messages')
      .select('*', { count: 'exact', head: true })
      .eq('demo_id', demo_id)
      .eq('agent', 'system')

    if ((count ?? 0) === 0) {
      await svc.from('agent_messages').insert({
        demo_id,
        agent: 'system',
        role: 'assistant',
        content: '4 agents engagés — Scout, Director, Faker, Narrator.',
        metadata: { status: 'starting' },
      })
    }

    // ─── Step 1: Director génère le storyboard
    const storyboard = await step.run('director', async () => {
      return await runDirector(demo_id, project_id, brief, template_slug)
    })

    // Persiste le storyboard dans la démo + crée les steps en DB
    await step.run('persist-storyboard', async () => {
      await svc.from('demos').update({
        storyboard,
        status: 'ready',
        duration_target_s: storyboard.duration_target_s,
        title: storyboard.title,
      }).eq('id', demo_id)

      // Crée les steps en DB pour l'éditeur
      for (const s of storyboard.steps) {
        await svc.from('steps').upsert({
          demo_id,
          order_index: s.order,
          route_path: s.route_path,
          intent: s.intent,
          transition_in: s.transition_in,
          actions: s.actions,
          duration_s: s.duration_s,
        }, { onConflict: 'demo_id,order_index' } as never)
      }
    })

    // ─── Step 2: Faker + Narrator en parallèle
    const backendSummary = ''  // already retrieved by Director via retrieveProjectContext

    await step.run('faker-narrator-parallel', async () => {
      await Promise.all([
        runFaker(demo_id, project_id, storyboard, backendSummary),
        runNarrator(demo_id, storyboard, template_slug),
      ])
    })

    // Marque le job comme terminé
    await step.run('complete', async () => {
      if (job?.id) {
        await svc.from('jobs').update({
          status: 'success',
          progress: 100,
          completed_at: new Date().toISOString(),
        }).eq('id', job.id)
      }
    })

    return { demo_id, steps: storyboard.steps.length, status: 'ready' }
  }
)
