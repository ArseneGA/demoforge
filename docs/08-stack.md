# 08 — Stack technique

> Statut : 🟢 v1
> Stack arrêté pour l'MVP V1.

## Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────────┐
│                          UTILISATEUR                              │
└──────────────────────────────────┬───────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND  ·  Next.js 15 App Router  ·  déployé sur Vercel        │
│  - React Server Components + client islands                       │
│  - shadcn/ui + Tailwind                                           │
│  - Supabase JS client (auth, queries, realtime, storage)          │
│  - MSW (Mock Service Worker) pour le runtime des démos jouées     │
└────────────┬──────────────────────────────────────┬──────────────┘
             │                                      │
             ▼                                      ▼
┌──────────────────────────┐      ┌──────────────────────────────────┐
│  SUPABASE                │      │  INNGEST  (jobs longs)            │
│  - Postgres 15 + pgvector│      │  - scan repo                       │
│  - Auth (email + Google) │      │  - run agents (4 agents pipeline) │
│  - Realtime (chat agents)│◄─────│  - render vidéo (V2)               │
│  - Storage (assets)      │      │  écrit progress dans Supabase     │
│  - RLS sur tout          │      └──────┬──────────────┬─────────────┘
└──────────────────────────┘             │              │
                                          ▼              ▼
                              ┌──────────────────┐  ┌────────────────┐
                              │  ANTHROPIC       │  │  GITHUB API    │
                              │  Claude Sonnet 4.6│  │  (App OAuth)   │
                              │  pour 4 agents   │  │  tarball repo  │
                              └──────────────────┘  └────────────────┘
                                          │
                                          ▼
                              ┌──────────────────┐
                              │  VOYAGE AI       │
                              │  voyage-3        │
                              │  embeddings code │
                              └──────────────────┘
```

---

## Frontend

### Framework
- **Next.js 15** (App Router strict, Pages Router proscrit pour le code DemoForge)
- **TypeScript strict** activé
- **React 19**
- **Node 20+** runtime

### UI
- **shadcn/ui** + **Radix Primitives** + **Tailwind CSS 4**
- Tokens design DemoForge depuis `df-tokens.css` existant (à porter en variables CSS / Tailwind theme)
- **Plus Jakarta Sans** + **Geist** + **Geist Mono** (fonts existantes dans les templates)
- **lucide-react** pour les icons (les SVG inline des templates seront remplacés)

### State / data fetching
- **React Server Components** par défaut
- **Supabase JS** (`@supabase/ssr` pour SSR, `@supabase/supabase-js` côté client)
- **TanStack Query** pour les data fetches client (cache + retries)
- **Zustand** pour le state UI éditeur (storyboard, sélection étape, drag n drop)

### Runtime des démos jouées
- **MSW** (Mock Service Worker) initialisé avec les handlers de la démo
- **Player** custom qui interprète le storyboard (séquence d'actions sur les écrans)
- Écrans rendus comme **mini-app React** générée à la volée depuis `screen_specs` + `themes` + `assets`

### Validation
- **Zod** pour tous les schémas (storyboard, mocks, API contracts)

---

## Backend / API

Tout via Next.js Route Handlers (`app/api/**/route.ts`) sur Vercel Functions.

### Auth
- **Supabase Auth** (email magic link + Google OAuth)
- Middleware Next.js pour les routes protégées
- Session JWT propagée côté serveur via `@supabase/ssr`

### GitHub
- **GitHub App** (Octokit `@octokit/app`)
- Permissions minimum : `Contents: Read`, `Metadata: Read`
- Webhook installation pour gérer install/uninstall (pas de webhook push au MVP, on scanne à la demande)

### Jobs longs (scan repo, agents)
- **Inngest** (`inngest` SDK Next.js)
- Free tier (50k steps/mois) suffit MVP
- Handler unique : `app/api/inngest/route.ts`
- Functions Inngest :
  - `scan.repo` (clone tarball → parse AST → embeddings → écrit dans Postgres)
  - `agents.run` (Director → Faker ‖ Narrator)
  - `agents.iterate` (relance partielle si user édite via chat)

### Embeddings
- **Voyage AI** (`voyage-3`, 1024d)
- SDK : appel REST direct (pas de SDK officiel mature côté Node, on utilise `fetch`)

### LLM
- **Anthropic Claude Sonnet 4.6** (`claude-sonnet-4-6`) par défaut pour les 4 agents
- **Claude Opus 4.7** (`claude-opus-4-7`) optionnel pour Director si on constate que la qualité Sonnet manque
- SDK officiel `@anthropic-ai/sdk`
- **Prompt caching activé** sur les contextes répétés (storyboard, screen_specs, brief)
- **Tool use** pour Director qui appelle Scout (retrieval)
- **Streaming** activé pour le chat live

---

## Base de données

- **Supabase Postgres 15**
- **pgvector** activé pour `code_chunks.embedding`
- **RLS activée** sur toutes les tables exposées au client (cf. doc 05)
- **Migrations** versionnées dans `supabase/migrations/*.sql`
- CLI : `supabase` (local dev avec Docker) + `supabase db push` (prod)

---

## Storage

- **Supabase Storage** (3 buckets : `assets` public, `scan-artifacts` private, `exports` private V2)
- Signed URLs pour les assets publics dans les démos
- Quota par Org : 2 Go au MVP (renforcé en V1.5 par plan Stripe)

---

## Realtime

- **Supabase Realtime** (Postgres CDC)
- Channels souscrits par le client :
  - `agent_messages:demo_id=eq.{id}` (chat des 4 agents en live)
  - `jobs:demo_id=eq.{id}` (progress du scan / agents)
  - `demos:id=eq.{id}` (changement de status)

---

## Observabilité

| Outil | Usage | Plan |
|---|---|---|
| **Vercel Analytics** | Web vitals, audience landing | Free Vercel |
| **Sentry** | Errors front + back | Free tier (5k events/mois) |
| **Inngest Dashboard** | Jobs status, runs, retries | Inclus Inngest free |
| **Supabase Dashboard** | Logs DB, RLS audit, storage | Inclus Supabase |
| **PostHog** (V1.5) | Product analytics, funnel | Free tier |

---

## Dev / outils

- **Bun** pour le dev local (rapide, build JS, runner)
- **Biome** pour lint + format (remplace ESLint + Prettier, plus rapide)
- **TypeScript strict** + `noUncheckedIndexedAccess`
- **pnpm** ou **bun** comme package manager (à trancher au moment du `init`)
- **Vitest** pour unit tests
- **Playwright** pour E2E (et plus tard l'export vidéo V2)

---

## CI / CD

- **GitHub Actions** :
  - PR : lint + typecheck + tests + build preview Vercel auto
  - main : deploy Vercel prod
- **Vercel preview deployments** sur chaque PR avec env de preview Supabase (branche DB)
- **Migrations Supabase** appliquées via CI avec `supabase db push` (clé service role en secret)

---

## Environnements

| Env | URL | Supabase | Vercel |
|---|---|---|---|
| **Local** | `localhost:3000` | Supabase local (Docker) | `next dev` |
| **Preview** | `*.demoforge-preview.vercel.app` | Branche Supabase | Auto sur PR |
| **Staging** | `staging.demoforge.app` | Projet Supabase staging | Branch `staging` |
| **Prod** | `demoforge.app` | Projet Supabase prod | Branch `main` |

---

## Coûts mensuels estimés (MVP, ~50 orgs actives)

| Service | Plan | Coût /mois |
|---|---|---|
| Vercel | Hobby (puis Pro à >100 orgs) | 0 → 20 $ |
| Supabase | Free → Pro | 0 → 25 $ |
| Inngest | Free (50k steps) | 0 |
| Anthropic Claude | Usage-based | ~80-150 € (variable) |
| Voyage AI | Usage-based | ~10-30 € |
| Sentry | Free | 0 |
| GitHub | Free | 0 |
| **Total estimé** | | **~110-225 €/mois** au démarrage |

→ Facilement absorbé par 5-10 abonnés à 29-149 €/mois.

---

## Variables d'env (`.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # côté serveur uniquement

# Anthropic
ANTHROPIC_API_KEY=

# Voyage AI
VOYAGE_API_KEY=

# GitHub App
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=             # PEM, base64
GITHUB_APP_CLIENT_ID=
GITHUB_APP_CLIENT_SECRET=
GITHUB_APP_WEBHOOK_SECRET=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Misc
NEXT_PUBLIC_APP_URL=https://demoforge.app
```

---

## Décisions stack récap

| Sujet | Choix |
|---|---|
| Framework | Next.js 15 (App Router strict) |
| Hosting | Vercel |
| DB / Auth / Realtime / Storage | Supabase |
| Jobs longs | Inngest |
| LLM | Anthropic Claude Sonnet 4.6 (Opus 4.7 optionnel) |
| Embeddings | Voyage AI `voyage-3` (1024d) |
| Mocks runtime | MSW (Mock Service Worker) |
| UI | shadcn/ui + Tailwind 4 |
| Lint/format | Biome |
| Tests | Vitest + Playwright |
| Type system | TypeScript strict |
