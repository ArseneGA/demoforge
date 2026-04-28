import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/utils/supabase/service'
import type { Storyboard } from './director'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function postMessage(demoId: string, content: string, metadata: Record<string, unknown> = {}) {
  const svc = createServiceClient()
  await svc.from('agent_messages').insert({
    demo_id: demoId, agent: 'faker', role: 'assistant', content, metadata,
  })
}

export async function runFaker(
  demoId: string,
  projectId: string,
  storyboard: Storyboard,
  backendSummary: string
): Promise<void> {
  const svc = createServiceClient()

  await postMessage(demoId, 'Je génère les données factices cohérentes pour chaque étape…', { status: 'generating' })

  // Récupère les endpoints API et data models
  const { data: endpoints } = await svc
    .from('api_endpoints')
    .select('method, path, response_shape, description')
    .eq('project_id', projectId)
    .limit(30)

  const { data: dataModels } = await svc
    .from('data_models')
    .select('entity_name, fields')
    .eq('project_id', projectId)
    .limit(20)

  const promptContext = `Storyboard :
${storyboard.steps.map(s => `- Étape ${s.order} : ${s.route_path} — ${s.intent} (refs mocks: ${s.mock_refs.join(', ') || 'aucune'})`).join('\n')}

Persona : ${storyboard.persona}
Ton : ${storyboard.tone}

${endpoints && endpoints.length > 0 ? `Endpoints API disponibles :
${endpoints.map(e => `${e.method} ${e.path} — ${e.description ?? ''}`).join('\n')}` : ''}

${dataModels && dataModels.length > 0 ? `Modèles de données :
${dataModels.map(m => `${m.entity_name}: ${JSON.stringify(m.fields).slice(0, 100)}`).join('\n')}` : ''}

${backendSummary ? `Résumé backend :\n${backendSummary.slice(0, 1000)}` : ''}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: `Tu es Faker, l'agent de génération de données mockées pour DemoForge.
Tu génères des fixtures réalistes, cohérentes entre elles, adaptées au persona.
Réponds UNIQUEMENT avec un JSON valide : { "mocks": [...], "fixtures": {...} }`,
    messages: [{
      role: 'user',
      content: `Génère les mocks API et fixtures de données pour ce storyboard.
Pour chaque étape ayant des mock_refs, crée les réponses API correspondantes.
Les données doivent être cohérentes avec le persona "${storyboard.persona}" et le ton "${storyboard.tone}".

${promptContext}

Format de sortie :
{
  "mocks": [
    {
      "id": "mock_id_ici",
      "endpoint": "GET /api/...",
      "latency_ms": 200,
      "response": {...},
      "scope_steps": ["step_01", "step_02"]
    }
  ],
  "fixtures": {
    "users": [{"name": "...", "email": "..."}],
    "main_entity": [...]
  }
}`,
    }],
  })

  const rawText = response.content[0]?.type === 'text' ? response.content[0].text : '{}'

  let mocksData: { mocks?: any[]; fixtures?: Record<string, any> } = {}
  try {
    const fence = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
    mocksData = JSON.parse(fence ? (fence[1] ?? rawText).trim() : rawText.trim())
  } catch {
    mocksData = { mocks: [], fixtures: {} }
  }

  const mocks = mocksData.mocks ?? []

  // Persiste les mocks en base
  if (mocks.length > 0) {
    for (const mock of mocks) {
      const [method, ...pathParts] = (mock.endpoint ?? 'GET /').split(' ')
      const path = pathParts.join(' ') || '/'
      await svc.from('mocks').insert({
        demo_id: demoId,
        endpoint_method: method ?? 'GET',
        endpoint_path: path,
        latency_ms: mock.latency_ms ?? 200,
        response_body: mock.response ?? {},
        scope_step_ids: [],
      })
    }
  }

  const mockSummary = mocks.length > 0
    ? mocks.map((m: any) => `\`${m.endpoint}\` · ${m.latency_ms ?? 200}ms`).join('\n')
    : 'Données fictives générées (aucun endpoint API détecté)'

  await postMessage(demoId,
    `**${mocks.length} mocks API générés** — données cohérentes pour le persona "${storyboard.persona}"\n\n${mockSummary}`,
    { status: 'done', mocks_count: mocks.length }
  )
}
