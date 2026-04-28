# 04 — Les 4 agents

> Statut : 🟢 v1

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                       BRIEF UTILISATEUR                      │
│         "Démo de la feature X pour persona Y, 90s"          │
└────────────────────────────────┬─────────────────────────────┘
                                 │
                ┌────────────────┴───────────────┐
                ▼                                ▼
        ┌──────────────┐              ┌──────────────────┐
        │   SCOUT      │              │  CONTEXT REPO    │
        │ lit le code  │◄─────────────│  (déjà scanné    │
        │ → routes,    │   pgvector   │   à l'onboarding)│
        │   tokens,    │              └──────────────────┘
        │   composants │
        └──────┬───────┘
               │ artifacts (routes pertinentes, design tokens, structure des écrans, MD backend)
               ▼
        ┌──────────────┐
        │   DIRECTOR   │  ← chef d'orchestre, pas de superviseur au-dessus
        │  storyboard  │
        │  streamé     │
        │  étape×étape │
        └──┬───────┬───┘
           │       │
       ┌───┘       └────┐
       ▼                ▼
  ┌─────────┐      ┌──────────┐
  │ FAKER   │      │ NARRATOR │
  │ mocks   │      │ annot.   │
  │ MSW +   │      │ texte    │
  │ data    │      │ (V2: TTS)│
  └────┬────┘      └────┬─────┘
       └────────┬───────┘
                ▼
        ┌──────────────┐
        │  STORYBOARD  │
        │     final    │
        └──────────────┘
```

**Pipeline strict** au MVP : Scout (one-shot à l'onboarding + retrieval par démo) → Director (sur brief) → Faker ‖ Narrator (en parallèle, pilotés par Director). Pas de challenging inter-agents au MVP.

---

## SCOUT — lit le code

### Rôle
Indexer le repo une fois (à l'onboarding) puis fournir, à chaque démo, les artefacts pertinents pour le brief.

### Périmètre de scan (décision MVP)

**Frontend complet** + **scan léger backend** pour générer des MD descriptifs.

**Frontend** (rendu fidèle) :
- `/src`, `/app`, `/pages`, `/components`, `/styles`
- Configs : `tailwind.config.{js,ts}`, `postcss.config.*`, `next.config.*`, `package.json`
- Types/schemas : `types/`, `*.d.ts`, `schema.prisma` (si trouvé)

**Backend** (MD descriptifs pour Faker) :
- `/api`, `/server`, `/routes`, `/controllers`, `/handlers`
- Fichiers Next.js API routes (`pages/api/*`, `app/api/**/route.ts`)
- Schémas Zod / Yup / Prisma trouvés
- Output : `backend-summary.md` par projet → décrit chaque endpoint en langage naturel + shape

→ Faker reçoit ce MD comme contexte pour produire des mocks fidèles à la sémantique réelle (un endpoint `POST /audiences/segment` avec un body Zod précis sera mocké en respectant les contraintes).

### Monorepos (MVP)
**Supportés** via dropdown : Scout détecte `turbo.json`, `nx.json`, `pnpm-workspace.yaml`, `lerna.json`. L'user choisit **un package** à scanner. V2 : multi-package.

### Limite de taille
**500k LOC** au MVP. Si dépassé : message d'erreur + suggestion de scanner un sous-dossier.

### Inputs
- Tarball repo via GitHub API (`GET /repos/{owner}/{repo}/tarball/{ref}`)
- Branche tracked

### Outputs persistés (à l'issue du scan onboarding)

| Artefact | Format | Stockage |
|---|---|---|
| **Routes / sitemap** | JSON `{path, file, components, params}` | Postgres `routes` |
| **Design tokens** | JSON `{colors, fonts, radius, spacing, logo_url}` | Postgres `design_tokens` |
| **Structure d'écran** par route | JSON `{layout, sections, components, data_shapes}` | Postgres `screen_specs` |
| **Lib UI détectée** | enum (`shadcn` / `mui` / `chakra` / `mantine` / `tailwind-raw` / `custom`) | Postgres `projects.ui_lib` |
| **Modèles de données** inférés | JSON (entities + fields) | Postgres `data_models` |
| **Endpoints API détectés** | JSON `{method, path, body_shape, response_shape}` | Postgres `api_endpoints` |
| **Backend summary MD** | markdown | Supabase Storage `backend-summary.md` |
| **Embeddings code** | vecteur | Postgres `pgvector` |

### Outputs runtime (par démo)
À la requête de Director, Scout retourne le **top K** d'éléments pertinents pour le brief (similarité vectorielle + reranking).

### Stack technique
- **Babel** + **@typescript-eslint/parser** pour AST TS/TSX
- Adapters par framework : Next.js (Pages + App), CRA, Vite + React Router
- Détection tokens : parsing Tailwind config + CSS vars + theme files
- **Claude Sonnet 4.6** pour synthèse des screen_specs et data_models
- **Voyage AI** ou **OpenAI** pour embeddings (à trancher dans la stack technique)

---

## DIRECTOR — script du parcours

### Rôle
Chef d'orchestre. Reçoit le brief, demande à Scout les artefacts pertinents, produit un storyboard streamé étape par étape avec validation interactive.

### Mode chat (MVP) — streaming étape par étape

```
User: "Démo Audiences segmentées, persona e-commerce mode, 90s"

Director:
  → "OK, je vois 6 étapes pertinentes basées sur tes routes.
     Étape 1/6 : Dashboard pour ancrer dans le produit.
     Route: /dashboard. Action: navigate + highlight KPI CA.
     Tu valides ?"
  
User: "ok suivant"

Director:
  → "Étape 2/6 : Création d'audience.
     Route: /audiences/new. Action: type filtre 'panier > 100€'.
     Faker génèrera 12 482 utilisateurs matchés.
     Tu valides ?"

...
```

L'user valide / corrige / skippe par messages. Plus engageant qu'un dump d'un coup, plus rapide qu'une co-écriture mot-à-mot.

### Vocabulaire d'actions (MVP)

| Action | Description | Exemple |
|---|---|---|
| `navigate(to)` | Change de route | `navigate('/dashboard')` |
| `click(selector)` | Clic | `click('[data-cta=create]')` |
| `type(selector, text)` | Tape du texte | `type('input[name=email]', 'marie@acme.com')` |
| `scroll(to)` | Scroll | `scroll('#audiences-table')` |
| `hover(selector)` | Survol | `hover('[data-tooltip]')` |
| `highlight(selector)` | Pulse/encadre | `highlight('[data-kpi=ca]')` |
| `wait(ms)` | Pause | `wait(1500)` |
| `mockResponse(endpoint, latency_ms)` | Sert mock | `mockResponse('/api/audiences', 240)` |
| `dragAndDrop(from, to)` | Drag & drop | `dragAndDrop('#item-1', '#zone-2')` |
| `keyPress(keys)` | Raccourci clavier | `keyPress('Cmd+K')` |
| `formSubmit(selector)` | Soumet form | `formSubmit('form#audience-create')` |

→ Couvre les patterns SaaS classiques. V2 : `recordVoiceOver`, `branch` (parcours alternatifs).

### Transitions entre étapes (MVP)
**Cut + fade**. Cut par défaut, fade optionnel via `transition: 'fade'` sur l'étape. Slide / zoom en V2.

### Output : Storyboard

```jsonc
{
  "demo_id": "uuid",
  "title": "Audiences segmentées — landing e-commerce",
  "duration_target_s": 90,
  "tone": "pro",
  "persona": "e-commerce mode FR",
  "transition_default": "cut",
  "steps": [
    {
      "id": "step_01",
      "order": 1,
      "route": "/dashboard",
      "intent": "Ancrer dans le produit, voir les KPIs",
      "transition_in": "cut",
      "actions": [
        { "type": "navigate", "to": "/dashboard" },
        { "type": "wait", "ms": 1500 },
        { "type": "highlight", "selector": "[data-kpi=ca]" }
      ],
      "duration_s": 8,
      "mock_refs": ["mock_dashboard_kpis"],
      "annotation_refs": ["annot_01"]
    }
  ]
}
```

---

## FAKER — mocks de données et API

### Rôle
Pour chaque étape, générer les **données mockées cohérentes** affichées et les **réponses API simulées** servies par MSW pendant la démo.

### Inputs
- Storyboard de Director
- `data_models`, `api_endpoints`, `backend-summary.md` extraits par Scout
- Persona du brief
- Locale (FR par défaut)

### Outputs (figés par défaut)

```jsonc
{
  "mocks": [
    {
      "id": "mock_dashboard_kpis",
      "endpoint": "GET /api/kpis?period=30d",
      "latency_ms": 240,
      "response": {
        "ca_total": 184230,
        "orders": 1842,
        "aov": 100.02,
        "conversion_rate": 2.3
      },
      "scope_steps": ["step_01", "step_02"]
    }
  ],
  "data_fixtures": {
    "users": [/* personas cohérents inter-étapes */],
    "audiences": [/* audiences cohérentes pour la persona e-com */]
  }
}
```

### Volumes par défaut
**5-10 lignes** par table/liste (compact, démo lisible). **Configurable par étape** dans l'inspecteur du storyboard.

### Cohérence cross-step (critique)
- Le user "Marie Cuvelier" reste cohérent sur tous les écrans
- Sommes / agrégats consistants
- Faker génère un **persona pool** au début, puis pioche dedans étape par étape

### Mocks figés (décision MVP)
Une fois générés, les mocks sont **figés** dans `mocks` (table Postgres). Bouton "Régénérer les données" dans l'éditeur pour les invalider et relancer Faker.

→ Garantit reproductibilité, pas de surprise au "Présenter", démos partageables stables.

### Implémentation runtime — MSW (Mock Service Worker)

Au démarrage de la démo dans le browser :
1. Le client charge le storyboard + le bundle de mocks
2. **MSW** est initialisé avec les handlers correspondant aux endpoints du repo
3. Les `fetch` du frontend sont interceptés et servis depuis `mocks[].response`
4. Latences `latency_ms` simulées pour réalisme

→ Élégant, debuggable (DevTools voient les requêtes), pas de mini-server par démo, pas d'infra à provisionner.

---

## NARRATOR — annotations textuelles

### Rôle
Pour chaque étape, produire les annotations contextuelles (bulles à l'écran) qui mettent en avant l'intention de la démo.

### Voix-off : V2 strict
**Pas au MVP.** La voix-off est un chantier à part (TTS, sync timing, mux audio sur l'export vidéo). On l'attaque avec l'export MP4 en V1.5/V2.

### Inputs
- Storyboard de Director
- Persona + ton du brief
- **Playbook** du template utilisé (si applicable)

### Système hybride : template par défaut + overridable

Chaque template (Onboarding, Feature launch, Pitch) a un **playbook** d'annotations type :

```yaml
# playbooks/feature-launch.yaml
beats:
  - position: "step_first"
    style: "highlight"
    pattern: "Le problème : {pain}"
  - position: "step_demo"
    style: "info"
    pattern: "{benefice} en {nb_clics} clic{s}"
  - position: "step_last"
    style: "info"
    pattern: "Disponible dès maintenant pour {persona}"
```

Narrator suit le playbook par défaut, mais l'user peut override en chat ou dans l'inspecteur.

### Output

```jsonc
{
  "annotations": [
    {
      "id": "annot_01",
      "step_id": "step_01",
      "target_selector": "[data-kpi=ca]",
      "position": "top-right",
      "text": "Vue d'ensemble en temps réel",
      "trigger_at_ms": 2500,
      "duration_ms": 3000,
      "style": "info"
    }
  ]
}
```

### Limites
- Max **3 annotations par étape** au MVP (évite la pollution visuelle)
- 80 caractères max par annotation

---

## Communication inter-agents

### Modèle (MVP simple, pipeline strict)

Tous les agents écrivent dans la table **`agent_messages`** (Supabase Realtime push au client).

Pas de challenging inter-agents au MVP. Pipeline :
1. User poste un message
2. Inngest déclenche `runAgents` :
   - Director lit le brief, **stream sa réflexion** dans `agent_messages`
   - Director appelle Scout (tool call) pour récupérer le contexte
   - Director génère le storyboard étape par étape (avec validation user en chat)
   - **En parallèle final** : Faker génère les mocks · Narrator génère les annotations
   - Storyboard final écrit dans `demos.storyboard`

### Pas de 5ème agent superviseur (MVP)
Director joue le rôle d'orchestrateur. On ajoute un superviseur uniquement si on constate des problèmes de cohérence en V2.

---

## Coûts LLM estimés

Par démo (90s, 6 étapes, brief moyen) :
- Scout (retrieval) : ~5k tokens
- Director : ~15k input + 8k output (× ~3 itérations chat = 45k+24k)
- Faker : ~10k input + 12k output
- Narrator : ~5k input + 3k output

Total typique ≈ 65k input + 39k output → **~1,50 € à 2 € par démo livrée** (Claude Sonnet 4.6).

→ Confortable pour un pricing à 29-149 €/mois.

---

## Récap décisions MVP

| Sujet | Décision |
|---|---|
| Périmètre scan | Frontend complet + backend en MD descriptif |
| Monorepos | Supportés via dropdown package |
| Taille repo max | 500k LOC |
| Frameworks | React (CRA/Vite) + Next.js (Pages/App) |
| Mode chat Director | Streamé étape par étape, validation interactive |
| Vocabulaire actions | 11 actions (cf. tableau) |
| Transitions | Cut + fade |
| Mocks | Figés par défaut, bouton "Régénérer" |
| Volumes data | 5-10 lignes défaut, configurable par étape |
| Runtime mocks | MSW (Mock Service Worker) |
| Voix-off | V2 strict |
| Style annotations | Template playbook + overridable |
| Max annotations/étape | 3 |
| Challenging inter-agents | Pas au MVP |
| Superviseur 5ème agent | Pas au MVP |
