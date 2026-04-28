import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/utils/supabase/service'
import { retrieveProjectContext } from '@/lib/scout/retrieval'
import { getDirectorSystemPrompt } from '@/lib/templates'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface StoryboardStep {
  id: string
  order: number
  route_path: string
  intent: string
  transition_in: 'cut' | 'fade'
  actions: Array<{ type: string; [k: string]: unknown }>
  duration_s: number
  mock_refs: string[]
  annotation_refs: string[]
}

export interface Storyboard {
  demo_id: string
  title: string
  duration_target_s: number
  tone: string
  persona: string
  transition_default: 'cut' | 'fade'
  steps: StoryboardStep[]
}

async function postMessage(
  demoId: string,
  agent: string,
  content: string,
  metadata: Record<string, unknown> = {}
) {
  const svc = createServiceClient()
  await svc.from('agent_messages').insert({
    demo_id: demoId,
    agent,
    role: 'assistant',
    content,
    metadata,
  })
}

export async function runDirector(
  demoId: string,
  projectId: string,
  brief: string,
  templateSlug?: string | null
): Promise<Storyboard> {
  const svc = createServiceClient()

  // Signal de démarrage
  await postMessage(demoId, 'director', '🎬 Brief reçu. Je consulte Scout pour les routes pertinentes…', { status: 'thinking' })

  // Retrieval Scout
  const context = await retrieveProjectContext(projectId, brief)

  const routeList = context.routes.length > 0
    ? context.routes.map(r => `- ${r.path} (${r.source_file})`).join('\n')
    : '- Aucune route détectée (repo peut-être en cours de scan)'

  const screenList = context.screen_specs.length > 0
    ? context.screen_specs.map(s => `- ${s.route_path} → ${s.llm_summary}`).join('\n')
    : ''

  await postMessage(demoId, 'scout', `J'ai parcouru le repo. Voici les pages pertinentes pour ce brief :\n\n${routeList}`, {
    status: 'done',
    routes: context.routes,
  })

  // Récupère le projet pour connaître le titre
  const { data: demo } = await svc.from('demos').select('title, tags').eq('id', demoId).single()

  const tags = (demo?.tags ?? {}) as Record<string, string>
  const persona = tags.persona ?? 'utilisateur type'
  const tone = tags.tone ?? 'pro'
  const durationTarget = parseInt(tags.duration ?? '90')

  const systemPrompt = getDirectorSystemPrompt(templateSlug)

  const userPrompt = `Brief : "${brief}"

Persona cible : ${persona}
Ton souhaité : ${tone}
Durée cible : ${durationTarget}s

Routes disponibles dans le repo :
${routeList}

${screenList ? `Descriptions des écrans :\n${screenList}` : ''}

${context.backend_summary ? `API backend disponible :\n${context.backend_summary.slice(0, 2000)}` : ''}

Génère un storyboard JSON complet selon ce format exact :
{
  "title": "Titre de la démo",
  "duration_target_s": ${durationTarget},
  "tone": "${tone}",
  "persona": "${persona}",
  "transition_default": "cut",
  "steps": [
    {
      "id": "step_01",
      "order": 1,
      "route_path": "/route",
      "intent": "Intention de cette étape pour le spectateur",
      "transition_in": "cut",
      "actions": [
        {"type": "navigate", "to": "/route"},
        {"type": "highlight", "selector": "[data-section=main]"}
      ],
      "duration_s": 10,
      "mock_refs": ["mock_nom"],
      "annotation_refs": ["annot_01"]
    }
  ]
}

Important : utilise uniquement les routes listées ci-dessus. Génère entre 4 et 8 étapes. Réponds UNIQUEMENT avec le JSON, sans markdown.`

  await postMessage(demoId, 'director', 'Excellent. Je construis le storyboard…', { status: 'scripting' })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const rawText = response.content[0]?.type === 'text' ? response.content[0].text : '{}'

  let storyboard: Storyboard
  try {
    const fence = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
    const parsed = JSON.parse(fence ? (fence[1] ?? rawText).trim() : rawText.trim())
    storyboard = {
      demo_id: demoId,
      title: parsed.title ?? demo?.title ?? 'Démo sans titre',
      duration_target_s: parsed.duration_target_s ?? durationTarget,
      tone: parsed.tone ?? tone,
      persona: parsed.persona ?? persona,
      transition_default: parsed.transition_default ?? 'cut',
      steps: (parsed.steps ?? []).map((s: any, i: number) => ({
        id: s.id ?? `step_${String(i + 1).padStart(2, '0')}`,
        order: s.order ?? i + 1,
        route_path: s.route_path ?? '/',
        intent: s.intent ?? '',
        transition_in: s.transition_in ?? 'cut',
        actions: s.actions ?? [],
        duration_s: s.duration_s ?? 10,
        mock_refs: s.mock_refs ?? [],
        annotation_refs: s.annotation_refs ?? [],
      })),
    }
  } catch {
    // Fallback : storyboard minimaliste avec les routes disponibles
    storyboard = {
      demo_id: demoId,
      title: demo?.title ?? 'Démo',
      duration_target_s: durationTarget,
      tone,
      persona,
      transition_default: 'cut',
      steps: context.routes.slice(0, 4).map((r, i) => ({
        id: `step_${String(i + 1).padStart(2, '0')}`,
        order: i + 1,
        route_path: r.path,
        intent: `Étape ${i + 1} — ${r.path}`,
        transition_in: 'cut',
        actions: [{ type: 'navigate', to: r.path }],
        duration_s: 15,
        mock_refs: [],
        annotation_refs: [],
      })),
    }
  }

  // Résumé Director
  const stepSummary = storyboard.steps.map(s => `**${s.id}** · ${s.route_path} — ${s.intent}`).join('\n')
  await postMessage(demoId, 'director',
    `Storyboard prêt — **${storyboard.steps.length} étapes · ~${storyboard.duration_target_s}s**\n\n${stepSummary}`,
    { status: 'storyboard_ready', storyboard }
  )

  return storyboard
}
