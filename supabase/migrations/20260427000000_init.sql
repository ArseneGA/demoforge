-- ============================================================
-- DemoForge — Migration v0 · init schema
-- Ref: docs/05-data-model.md
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ============================================================
-- ENUMS
-- ============================================================

create type org_role as enum ('owner', 'editor', 'viewer');
create type share_visibility as enum ('public', 'password', 'team');

-- ============================================================
-- CORE: Orgs & Members
-- ============================================================

create table orgs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  plan text not null default 'free',  -- 'free' | 'forge' | 'studio' | 'atelier'
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table org_members (
  org_id uuid references orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role org_role not null default 'editor',
  created_at timestamptz default now(),
  primary key (org_id, user_id)
);

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

-- ============================================================
-- GITHUB
-- ============================================================

create table github_installations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  github_install_id bigint not null,
  github_account_login text not null,
  github_account_type text not null,  -- 'Organization' | 'User'
  created_at timestamptz default now(),
  unique (org_id, github_install_id)
);

-- ============================================================
-- PROJECTS (one per repo+branch)
-- ============================================================

create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  github_install_id uuid references github_installations(id),
  repo_full_name text not null,
  branch text not null default 'main',
  commit_sha text,
  package_path text,
  framework text,       -- 'next-app' | 'next-pages' | 'react-vite' | 'react-cra'
  ui_lib text,          -- 'shadcn' | 'mui' | 'chakra' | 'mantine' | 'tailwind-raw' | 'custom'
  language text,        -- 'typescript' | 'javascript'
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

-- ============================================================
-- SCOUT ARTIFACTS
-- ============================================================

create table routes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  path text not null,
  source_file text not null,
  params jsonb default '[]'::jsonb,
  components jsonb default '[]'::jsonb,
  is_dynamic boolean default false,
  created_at timestamptz default now()
);

create index on routes (project_id);

create table design_tokens (
  project_id uuid primary key references projects(id) on delete cascade,
  colors jsonb not null default '{}'::jsonb,
  typography jsonb not null default '{}'::jsonb,
  spacing jsonb default '{}'::jsonb,
  radius jsonb default '{}'::jsonb,
  logo_url text,
  favicon_url text,
  source_files jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

create table screen_specs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  route_id uuid references routes(id) on delete cascade,
  layout text,  -- 'sidebar' | 'topnav' | 'centered' | 'split'
  sections jsonb not null default '[]'::jsonb,
  data_shapes jsonb default '[]'::jsonb,
  llm_summary text,
  updated_at timestamptz default now()
);

create table data_models (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  entity_name text not null,
  fields jsonb not null,
  source text,       -- 'prisma' | 'zod' | 'typescript' | 'inferred'
  source_file text,
  unique (project_id, entity_name)
);

create table api_endpoints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  method text not null,
  path text not null,
  body_shape jsonb,
  response_shape jsonb,
  source_file text,
  description text,
  unique (project_id, method, path)
);

create table code_chunks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  source_file text not null,
  start_line int,
  end_line int,
  content text not null,
  kind text,  -- 'component' | 'route' | 'api' | 'type' | 'hook'
  embedding vector(1024),  -- Voyage AI voyage-3
  created_at timestamptz default now()
);

create index on code_chunks using hnsw (embedding vector_cosine_ops);
create index on code_chunks (project_id);

-- ============================================================
-- DEMOS & STORYBOARD
-- ============================================================

create table demos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  brief text,
  tags jsonb default '{}'::jsonb,
  template_slug text,
  duplicated_from uuid references demos(id),
  duration_target_s int,
  storyboard jsonb default '{}'::jsonb,
  status text not null default 'draft',  -- 'draft' | 'ready' | 'published' | 'archived'
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index on demos (org_id) where deleted_at is null;
create index on demos (project_id);

create table steps (
  id uuid primary key default gen_random_uuid(),
  demo_id uuid references demos(id) on delete cascade,
  order_index int not null,
  route_path text not null,
  intent text,
  transition_in text default 'cut',  -- 'cut' | 'fade'
  actions jsonb not null default '[]'::jsonb,
  duration_s int,
  created_at timestamptz default now(),
  unique (demo_id, order_index)
);

create index on steps (demo_id);

create table mocks (
  id uuid primary key default gen_random_uuid(),
  demo_id uuid references demos(id) on delete cascade,
  endpoint_method text not null,
  endpoint_path text not null,
  latency_ms int default 200,
  response_body jsonb not null,
  scope_step_ids uuid[] default '{}',
  created_at timestamptz default now()
);

create index on mocks (demo_id);

create table annotations (
  id uuid primary key default gen_random_uuid(),
  step_id uuid references steps(id) on delete cascade,
  target_selector text,
  position text default 'top-right',
  text text not null,
  trigger_at_ms int default 1000,
  duration_ms int default 3000,
  style text default 'info',  -- 'info' | 'highlight' | 'warning'
  created_at timestamptz default now()
);

create index on annotations (step_id);

-- ============================================================
-- THEMES & ASSETS
-- ============================================================

create table themes (
  id uuid primary key default gen_random_uuid(),
  demo_id uuid references demos(id) on delete cascade,
  slug text not null,
  is_default boolean default false,
  tokens_override jsonb default '{}'::jsonb,
  logo_asset_id uuid,
  created_at timestamptz default now(),
  unique (demo_id, slug)
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  demo_id uuid references demos(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  mime_type text,
  size_bytes bigint,
  kind text,  -- 'logo' | 'image' | 'screenshot' | 'video'
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ============================================================
-- CHAT & JOBS
-- ============================================================

create table agent_messages (
  id uuid primary key default gen_random_uuid(),
  demo_id uuid references demos(id) on delete cascade,
  agent text not null,     -- 'user' | 'scout' | 'director' | 'faker' | 'narrator' | 'system'
  role text not null,      -- 'user' | 'assistant' | 'tool'
  content text,
  tool_calls jsonb,
  tool_results jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index on agent_messages (demo_id, created_at);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  project_id uuid references projects(id),
  demo_id uuid references demos(id),
  inngest_run_id text unique,
  kind text not null,       -- 'scan' | 'agents' | 'render-video'
  status text not null default 'queued',  -- 'queued' | 'running' | 'success' | 'failed'
  progress int default 0,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create index on jobs (demo_id);
create index on jobs (project_id);

-- ============================================================
-- SHARING & ANALYTICS
-- ============================================================

create table share_links (
  id uuid primary key default gen_random_uuid(),
  demo_id uuid references demos(id) on delete cascade,
  token text unique not null,
  visibility share_visibility not null,
  password_hash text,
  theme_slug text,
  expires_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index on share_links (demo_id);

create table demo_views (
  id uuid primary key default gen_random_uuid(),
  share_link_id uuid references share_links(id) on delete cascade,
  demo_id uuid references demos(id) on delete cascade,
  session_id text,
  duration_ms int,
  ended_at_step_index int,
  ip_country text,
  user_agent_device text,
  started_at timestamptz default now()
);

create index on demo_views (demo_id, started_at);

-- ============================================================
-- Enable Realtime on agent_messages (chat live)
-- ============================================================

alter publication supabase_realtime add table agent_messages;
alter publication supabase_realtime add table jobs;
alter publication supabase_realtime add table demos;
