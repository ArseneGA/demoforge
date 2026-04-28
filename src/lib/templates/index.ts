export interface Template {
  slug: string
  name: string
  description: string
  director_system_prompt: string
  narrator_playbook: Array<{ position: string; style: string; pattern: string }>
  default_duration_s: number
  default_steps: number
}

const FEATURE_LAUNCH: Template = {
  slug: 'feature-launch',
  name: 'Feature launch',
  description: 'Mise en avant d\'une nouvelle feature pour landing page ou social.',
  default_duration_s: 90,
  default_steps: 6,
  director_system_prompt: `Tu scripts une démo produit de type "Feature launch" : présentation d'une nouvelle fonctionnalité.
Structure suggérée : 1. Problème actuel → 2. Découverte feature → 3. Démonstration action → 4. Résultat visible → 5. KPI impacté → 6. CTA.
Chaque étape = une route, une action, une intention claire. Durée cible : 90s.`,
  narrator_playbook: [
    { position: 'step_first', style: 'highlight', pattern: 'Sans {feature_name}, {pain_point}.' },
    { position: 'step_demo', style: 'info', pattern: '{benefit} en {action}.' },
    { position: 'step_kpi', style: 'highlight', pattern: '+{metric} — exactement ce que {persona} veut montrer.' },
    { position: 'step_last', style: 'info', pattern: 'Disponible maintenant pour {persona}.' },
  ],
}

const ONBOARDING: Template = {
  slug: 'onboarding',
  name: 'Onboarding produit',
  description: 'Parcours guidé pour un nouveau client : de l\'inscription au premier succès.',
  default_duration_s: 120,
  default_steps: 5,
  director_system_prompt: `Tu scripts une démo d'onboarding produit : montre comment un nouvel utilisateur découvre le produit et atteint son premier succès.
Structure suggérée : 1. Signup/Login → 2. Setup initial → 3. Première action clé → 4. Résultat visible → 5. Étape suivante suggérée.
Rend le parcours fluide, sans friction. Durée cible : 2min.`,
  narrator_playbook: [
    { position: 'step_first', style: 'info', pattern: 'Bienvenue ! {persona} arrive pour la première fois.' },
    { position: 'step_setup', style: 'info', pattern: 'En {time}, le workspace est prêt.' },
    { position: 'step_demo', style: 'highlight', pattern: 'Premier succès : {achievement}.' },
    { position: 'step_last', style: 'info', pattern: 'C\'est parti — {next_step} en un clic.' },
  ],
}

const PITCH: Template = {
  slug: 'pitch',
  name: 'Pitch investisseur',
  description: 'Vue d\'ensemble produit avec narrative business pour convaincre.',
  default_duration_s: 180,
  default_steps: 6,
  director_system_prompt: `Tu scripts un pitch produit pour des investisseurs ou des décideurs.
Structure suggérée : 1. Problème marché → 2. Solution (homepage/landing) → 3. Produit en action (feature clé) → 4. Données / traction → 5. Différenciation → 6. Vision.
Chaque étape doit renforcer la narrative business. Durée cible : 3min.`,
  narrator_playbook: [
    { position: 'step_problem', style: 'highlight', pattern: '{market_size} de marché. Aujourd\'hui, {pain}.' },
    { position: 'step_solution', style: 'info', pattern: '{product_name} résout {pain} en {how}.' },
    { position: 'step_traction', style: 'highlight', pattern: '{metric} — {growth_story}.' },
    { position: 'step_last', style: 'info', pattern: '{vision} — on cherche à {goal}.' },
  ],
}

const SALES_DEMO: Template = {
  slug: 'sales-demo',
  name: 'Démo commerciale',
  description: 'Démo personnalisée par persona pour un rendez-vous commercial.',
  default_duration_s: 90,
  default_steps: 5,
  director_system_prompt: `Tu scripts une démo commerciale personnalisée pour un prospect spécifique.
Structure suggérée : 1. Ancrage dans leur contexte (dashboard ou homepage) → 2. Problème qu'ils reconnaissent → 3. Feature clé qui résout leur pain → 4. ROI visible → 5. CTA naturel.
Adapte le vocabulaire au persona et au secteur. Durée cible : 90s.`,
  narrator_playbook: [
    { position: 'step_first', style: 'info', pattern: 'Voici comment {persona} utilise {product}.' },
    { position: 'step_problem', style: 'highlight', pattern: '{persona} gagne {time_saved} sur {task}.' },
    { position: 'step_last', style: 'info', pattern: 'Prêt à démarrer — essai sans CB.' },
  ],
}

export const TEMPLATES: Template[] = [FEATURE_LAUNCH, ONBOARDING, PITCH, SALES_DEMO]

export function getTemplate(slug: string): Template | undefined {
  return TEMPLATES.find(t => t.slug === slug)
}

export function getDirectorSystemPrompt(templateSlug?: string | null): string {
  const base = `Tu es Director, un agent de DemoForge spécialisé dans la création de storyboards de démos SaaS.
Tu travailles à partir du contexte d'un repo GitHub (routes, écrans, design tokens).
Tu génères un parcours d'étapes précis, scripté, jouable par un acteur humain ou automatiquement.

Règles fondamentales :
- Chaque étape = une route, une intention claire, une liste d'actions précises
- Les actions disponibles : navigate, click, type, scroll, hover, highlight, wait, mockResponse, dragAndDrop, keyPress, formSubmit
- Durées réalistes : 5-25s par étape selon la complexité
- Données factices cohérentes (référence les mock IDs que Faker va créer)
- Pas de backend réel — tout sera mocké par MSW
- Langage français, vocabulaire produit adapté au persona`

  const template = templateSlug ? getTemplate(templateSlug) : null
  if (template) return `${base}\n\n${template.director_system_prompt}`
  return base
}
