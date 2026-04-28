import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/utils/supabase/service'
import type { Storyboard } from './director'
import { getTemplate } from '@/lib/templates'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function postMessage(demoId: string, content: string, metadata: Record<string, unknown> = {}) {
  const svc = createServiceClient()
  await svc.from('agent_messages').insert({
    demo_id: demoId, agent: 'narrator', role: 'assistant', content, metadata,
  })
}

export async function runNarrator(
  demoId: string,
  storyboard: Storyboard,
  templateSlug?: string | null
): Promise<void> {
  const svc = createServiceClient()

  await postMessage(demoId, 'Je pose les annotations contextuelles sur chaque étape…', { status: 'annotating' })

  const template = templateSlug ? getTemplate(templateSlug) : null
  const playbookContext = template
    ? `Playbook "${template.name}" : ${template.narrator_playbook.map(b => `${b.position}: "${b.pattern}"`).join(', ')}`
    : 'Playbook libre : met en valeur les bénéfices clés pour le spectateur.'

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: `Tu es Narrator, l'agent d'annotations de DemoForge.
Tu génères des bulles textuelles courtes (max 80 chars) qui guident le spectateur.
Max 3 annotations par étape. Style : "info", "highlight", ou "warning".
Réponds UNIQUEMENT avec un JSON valide.`,
    messages: [{
      role: 'user',
      content: `Génère les annotations pour ce storyboard.

${playbookContext}

Persona : ${storyboard.persona}
Ton : ${storyboard.tone}

Étapes :
${storyboard.steps.map(s => `- ${s.id} (${s.route_path}) : ${s.intent}`).join('\n')}

Format :
{
  "annotations": [
    {
      "id": "annot_01",
      "step_id": "step_01",
      "target_selector": "[data-section=main]",
      "position": "top-right",
      "text": "Texte court max 80 chars",
      "trigger_at_ms": 2000,
      "duration_ms": 3000,
      "style": "info"
    }
  ]
}`,
    }],
  })

  const rawText = response.content[0]?.type === 'text' ? response.content[0].text : '{}'

  let annotData: { annotations?: any[] } = {}
  try {
    const fence = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
    annotData = JSON.parse(fence ? (fence[1] ?? rawText).trim() : rawText.trim())
  } catch {
    annotData = { annotations: [] }
  }

  const annotations = annotData.annotations ?? []

  // Persiste les annotations
  if (annotations.length > 0) {
    // Récupère les step IDs depuis la DB pour les associer correctement
    const { data: steps } = await svc
      .from('steps')
      .select('id, order_index')
      .eq('demo_id', demoId)

    for (const annot of annotations) {
      // Trouve le step correspondant par son id textuel (step_01, step_02, etc.)
      const stepOrder = parseInt((annot.step_id ?? 'step_01').replace('step_', ''))
      const step = (steps ?? []).find(s => s.order_index === stepOrder)

      if (step) {
        await svc.from('annotations').insert({
          step_id: step.id,
          target_selector: annot.target_selector ?? null,
          position: annot.position ?? 'top-right',
          text: (annot.text ?? '').slice(0, 80),
          trigger_at_ms: annot.trigger_at_ms ?? 1500,
          duration_ms: annot.duration_ms ?? 3000,
          style: annot.style ?? 'info',
        })
      }
    }
  }

  await postMessage(demoId,
    `**${annotations.length} annotation(s) posée(s)** sur le storyboard.\n\nLa démo est prête à être prévisualisée. Ouvre le storyboard pour ajuster les timings ou ajouter des étapes.`,
    { status: 'done', annotations_count: annotations.length }
  )

  // Message récap Director
  const demoSteps = storyboard.steps.length
  await svc.from('agent_messages').insert({
    demo_id: demoId,
    agent: 'director',
    role: 'assistant',
    content: `✅ **Démo prête** — ${demoSteps} étapes · ~${storyboard.duration_target_s}s · ${annotations.length} annotation(s)\n\nOuvre le storyboard pour prévisualiser et présenter.`,
    metadata: { status: 'complete' },
  })
}
