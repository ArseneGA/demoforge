# 05 — Modèle de données

> Statut : 🟢 v1
> Cible : Supabase Postgres (15+) + pgvector + RLS

## Décisions actées

| Sujet | Décision |
|---|---|
| Embeddings | **Voyage AI `voyage-3`** (1024d) |
| IDs | `uuid v4` (`gen_random_uuid()`) |
| Soft delete | Sur `orgs`, `projects`, `demos` uniquement. Reste cascade hard. |
| Snapshot Scout/démo | Hybride : `commit_sha` sur la démo, pas de copie d'artefacts |
| Multi-thèmes | Par démo uniquement au MVP |
| `agent_messages` | Historique illimité au MVP |
| Stripe | V1.5 (MVP gratuit / waitlist) — `stripe_customer_id` reste sur `orgs` pour préparer |
| Templates | En **code** (`/lib/templates/*.ts`), pas de table `templates` au MVP |

## Conventions

- **IDs** : `uuid` (`gen_random_uuid()`) — simple, supporté natif Supabase
- **Timestamps** : `created_at`, `updated_at` (`timestamptz`, default `now()`)
- **Soft delete** : `deleted_at timestamptz null` sur les entités utilisateur (orgs, projects, demos). Pas de soft delete sur les artefacts (routes, mocks…) → cascade hard.
- **JSONB** systématique pour les structures variables (storyboard, screen_specs, design_tokens)
- **RLS activée** sur toutes les tables exposées au client. Service role pour Inngest jobs.

---

## Schéma — vue d'ensemble

```
auth.users (Supabase)
    │
    ├──< org_members >── orgs ───< invitations
    │                       │
    │                       ├───< github_installations (1:1 ou 1:N)
    │                       │
    │                       └───< projects ────┬──< routes
    │                                          │
    │                                          ├──< design_tokens
    │                                          ├──< screen_specs
    │                                          ├──< data_models
    │                                          ├──< api_endpoints
    │                                          ├──< code_chunks (pgvector)
    │                                          │
    │                                          └──< demos ────┬──< steps
    │                                                          │
    │                                                          ├──< mocks
    │                                                          ├──< annotations
    │                                                          ├──< themes
    │                                                          ├──< assets
    │                                                          ├──< agent_messages
    │                                                          ├──< share_links ──< demo_views
    │                                                          └──< jobs (Inngest)
    │
    └── (RLS via org_members)

templates (global, pas d'org)
```

---

## Tables — détail

### `orgs`
```sql
create table orgs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- ex: "acme-corp"
  name text not null,
  plan text not null default 'free',   -- 'free' | 'forge' | 'studio' | 'atelier'
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
```

### `org_members`
```sql
create type org_role as enum ('owner', 'editor', 'viewer');

create table org_members (
  org_id uuid references orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role org_role not null default 'editor',
  created_at timestamptz default now(),
  primary key (org_id, user_id)
);
```

### `invitations`
```sql
create table invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  email text not null,
  role org_role not null default 'editor',
  token text unique not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  invited_by uuid references auth.users(id),
  created_at timestamptz default now()
);
```

### `github_installations`
```sql
create table github_installations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  github_install_id bigint not null,           -- depuis GitHub API
  github_account_login text not null,           -- "acme-corp"
  github_account_type text not null,            -- "Organization" | "User"
  created_at timestamptz default now(),
  unique (org_id, github_install_id)
);
```

### `projects`
```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  github_install_id uuid references github_installations(id),
  repo_full_name text not null,                 -- "acme/stratus-app"
  branch text not null default 'main',
  commit_sha text,                               -- dernier commit scanné
  package_path text,                             -- pour monorepos: "apps/web"
  framework text,                                -- 'next-app' | 'next-pages' | 'react-vite' | 'react-cra'
  ui_lib text,                                   -- 'shadcn' | 'mui' | 'chakra' | ...
  language text,                                 -- 'typescript' | 'javascript'
  scan_status text not null default 'pending',  -- 'pending' | 'scanning' | 'ready' | 'failed' | 'unsupported'
  scan_error text,
  scanned_at timestamptz,
  loc_count int,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique (org_id, repo_full_name, branch, package_path)
);

create index on projects (org_id) where deleted_at is null;
```

### `routes`
```sql
create table routes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  path text not null,                            -- "/dashboard"
  source_file text not null,                     -- "app/dashboard/page.tsx"
  params jsonb default '[]'::jsonb,              -- [{name, type}]
  components jsonb default '[]'::jsonb,          -- top-level components used
  is_dynamic boolean default false,
  created_at timestamptz default now()
);

create index on routes (project_id);
```

### `design_tokens`
```sql
create table design_tokens (
  project_id uuid primary key references projects(id) on delete cascade,
  colors jsonb not null default '{}'::jsonb,     -- {primary, accent, bg, fg, ...}
  typography jsonb not null default '{}'::jsonb, -- {sans, mono, sizes, ...}
  spacing jsonb default '{}'::jsonb,
  radius jsonb default '{}'::jsonb,
  logo_url text,                                  -- Supabase Storage signed URL
  favicon_url text,
  source_files jsonb default '[]'::jsonb,        -- d'où on a extrait
  updated_at timestamptz default now()
);
```

### `screen_specs`
```sql
create table screen_specs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  route_id uuid references routes(id) on delete cascade,
  layout text,                                    -- 'sidebar' | 'topnav' | 'centered' | 'split'
  sections jsonb not null default '[]'::jsonb,   -- [{type, props, children}]
  data_shapes jsonb default '[]'::jsonb,         -- ce que l'écran consomme
  llm_summary text,                               -- description en langage naturel
  updated_at timestamptz default now()
);
```

### `data_models`
```sql
create table data_models (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  entity_name text not null,                     -- "User", "Audience", "Order"
  fields jsonb not null,                          -- [{name, type, required, ...}]
  source text,                                    -- 'prisma' | 'zod' | 'typescript' | 'inferred'
  source_file text,
  unique (project_id, entity_name)
);
```

### `api_endpoints`
```sql
create table api_endpoints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  method text not null,                           -- 'GET' | 'POST' | ...
  path text not null,                             -- "/api/audiences"
  body_shape jsonb,
  response_shape jsonb,
  source_file text,
  description text,                                -- généré pour le backend-summary.md
  unique (project_id, method, path)
);
```

### `code_chunks` — pgvector pour retrieval Scout

```sql
create extension if not exists vector;

create table code_chunks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  source_file text not null,
  start_line int,
  end_line int,
  content text not null,
  kind text,                                      -- 'component' | 'route' | 'api' | 'type' | 'hook'
  embedding vector(1024),                         -- Voyage AI voyage-3 (1024d)
  created_at timestamptz default now()
);

create index on code_chunks using hnsw (embedding vector_cosine_ops);
create index on code_chunks (project_id);
```

> **À trancher** : provider embeddings (Voyage 1024d recommandé par Anthropic, ou OpenAI 1536d). Si on change la dim plus tard, migration nécessaire.

### `demos`
```sql
create table demos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  brief text,                                     -- prompt initial user
  tags jsonb default '{}'::jsonb,                 -- {format, persona, duration, tone}
  template_slug text,                              -- 'feature-launch' | 'onboarding' | 'pitch' | null
  duplicated_from uuid references demos(id),     -- si dupliquée
  duration_target_s int,
  storyboard jsonb default '{}'::jsonb,           -- doc complet (cf. doc 04)
  status text not null default 'draft',           -- 'draft' | 'ready' | 'published' | 'archived'
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index on demos (org_id) where deleted_at is null;
create index on demos (project_id);
```

### `steps`
```sql
create table steps (
  id uuid primary key default gen_random_uuid(),
  demo_id uuid references demos(id) on delete cascade,
  order_index int not null,
  route_path text not null,
  intent text,
  transition_in text default 'cut',               -- 'cut' | 'fade'
  actions jsonb not null default '[]'::jsonb,     -- liste d'actions (cf. doc 04)
  duration_s int,
  created_at timestamptz default now(),
  unique (demo_id, order_index)
);

create index on steps (demo_id);
```

### `mocks`
```sql
create table mocks (
  id uuid primary key default gen_random_uuid(),
  demo_id uuid references demos(id) on delete cascade,
  endpoint_method text not null,
  endpoint_path text not null,
  latency_ms int default 200,
  response_body jsonb not null,
  scope_step_ids uuid[] default '{}',             -- étapes où ce mock est actif
  created_at timestamptz default now()
);

create index on mocks (demo_id);
```

### `annotations`
```sql
create table annotations (
  id uuid primary key default gen_random_uuid(),
  step_id uuid references steps(id) on delete cascade,
  target_selector text,
  position text default 'top-right',              -- top-left|top-right|bottom-left|bottom-right
  text text not null,
  trigger_at_ms int default 1000,
  duration_ms int default 3000,
  style text default 'info',                       -- 'info' | 'highlight' | 'warning'
  created_at timestamptz default now()
);

create index on annotations (step_id);
```

### `themes`
```sql
create table themes (
  id uuid primary key default gen_random_uuid(),
  demo_id uuid references demos(id) on delete cascade,
  slug text not null,                              -- 'default' | 'dark' | 'brand-client-x'
  is_default boolean default false,
  tokens_override jsonb default '{}'::jsonb,      -- override partiel ou total des design_tokens
  logo_asset_id uuid,
  created_at timestamptz default now(),
  unique (demo_id, slug)
);
```

### `assets`
```sql
create table assets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  demo_id uuid references demos(id) on delete cascade,  -- nullable: asset d'org sinon
  storage_path text not null,                            -- supabase storage key
  filename text not null,
  mime_type text,
  size_bytes bigint,
  kind text,                                              -- 'logo' | 'image' | 'screenshot' | 'video'
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now()
);
```

### `agent_messages` (chat Realtime)

```sql
create table agent_messages (
  id uuid primary key default gen_random_uuid(),
  demo_id uuid references demos(id) on delete cascade,
  agent text not null,                            -- 'user' | 'scout' | 'director' | 'faker' | 'narrator' | 'system'
  role text not null,                             -- 'user' | 'assistant' | 'tool'
  content text,
  tool_calls jsonb,                                -- si tool use Anthropic
  tool_results jsonb,
  metadata jsonb default '{}'::jsonb,             -- progress, status, references
  created_at timestamptz default now()
);

create index on agent_messages (demo_id, created_at);
```

→ Realtime activé sur cette table : le client souscrit `demo_id=eq.X` et voit les messages en live.

### `share_links`
```sql
create type share_visibility as enum ('public', 'password', 'team');

create table share_links (
  id uuid primary key default gen_random_uuid(),
  demo_id uuid references demos(id) on delete cascade,
  token text unique not null,                     -- short token pour URL /d/{token}
  visibility share_visibility not null,
  password_hash text,                              -- bcrypt si visibility='password'
  theme_slug text,                                 -- thème à appliquer
  expires_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index on share_links (demo_id);
```

### `demo_views` (analytics)

```sql
create table demo_views (
  id uuid primary key default gen_random_uuid(),
  share_link_id uuid references share_links(id) on delete cascade,
  demo_id uuid references demos(id) on delete cascade,
  session_id text,                                 -- cookie côté viewer
  duration_ms int,
  ended_at_step_index int,
  ip_country text,
  user_agent_device text,                          -- 'desktop' | 'mobile' | 'tablet'
  started_at timestamptz default now()
);

create index on demo_views (demo_id, started_at);
```

### `jobs` (état des jobs Inngest pour UI progress)

```sql
create table jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  project_id uuid references projects(id),
  demo_id uuid references demos(id),
  inngest_run_id text unique,
  kind text not null,                              -- 'scan' | 'agents' | 'render-video'
  status text not null default 'queued',          -- 'queued' | 'running' | 'success' | 'failed'
  progress int default 0,                          -- 0..100
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create index on jobs (demo_id);
create index on jobs (project_id);
```

### Templates : pas de table au MVP

Les 3-4 templates sont définis en **code** dans `/lib/templates/*.ts` :
```
lib/templates/
├── feature-launch.ts     # director prompt + narrator playbook + default steps
├── onboarding.ts
├── pitch.ts
└── index.ts              # registry exporté
```

Migration vers une table `templates` quand on voudra que les users créent leurs propres templates (V2).

---

## Row-Level Security (RLS)

### Principe
- Toutes les tables `*_id → orgs(id)` filtrent par `org_id IN (select org_id from org_members where user_id = auth.uid())`
- `share_links` + `demo_views` accessibles publiquement en lecture par token (vue publique d'une démo partagée)
- `agent_messages`, `mocks`, `steps`, `annotations` filtrent via `demo_id → demos.org_id`
- `templates` lecture publique pour tous les users authentifiés

### Exemple de policy

```sql
-- demos: read uniquement pour les membres de l'org
create policy "demos_read_org_members"
on demos for select
using (
  org_id in (
    select org_id from org_members where user_id = auth.uid()
  )
  and deleted_at is null
);

-- demos: write uniquement pour editor + owner
create policy "demos_write_editors"
on demos for insert
with check (
  org_id in (
    select org_id from org_members
    where user_id = auth.uid() and role in ('owner', 'editor')
  )
);
```

→ Policies complètes générées en V0 du SQL exécutable (doc séparé `migrations/`).

---

## Storage Supabase

**Buckets** :
- `assets` (public-readable via signed URLs) : logos, images, screenshots uploadés par user
- `scan-artifacts` (private) : `backend-summary.md`, snapshots d'arbo de repos
- `exports` (private, V2) : MP4 vidéo générés

---

## Prochaine étape

Génération du SQL de migration Supabase v0 (fichier `supabase/migrations/20260427000000_init.sql`) prêt à exécuter via `supabase db push`. À faire quand on lance le code.
