-- ============================================================
-- DemoForge — RLS Policies v0
-- Ref: docs/05-data-model.md §RLS
-- ============================================================

-- Enable RLS on all tables
alter table orgs enable row level security;
alter table org_members enable row level security;
alter table invitations enable row level security;
alter table github_installations enable row level security;
alter table projects enable row level security;
alter table routes enable row level security;
alter table design_tokens enable row level security;
alter table screen_specs enable row level security;
alter table data_models enable row level security;
alter table api_endpoints enable row level security;
alter table code_chunks enable row level security;
alter table demos enable row level security;
alter table steps enable row level security;
alter table mocks enable row level security;
alter table annotations enable row level security;
alter table themes enable row level security;
alter table assets enable row level security;
alter table agent_messages enable row level security;
alter table jobs enable row level security;
alter table share_links enable row level security;
alter table demo_views enable row level security;

-- ============================================================
-- Helper: user's org IDs
-- ============================================================

create or replace function public.user_org_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select org_id from org_members where user_id = auth.uid()
$$;

create or replace function public.user_editor_org_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select org_id from org_members
  where user_id = auth.uid() and role in ('owner', 'editor')
$$;

-- ============================================================
-- ORGS
-- ============================================================

create policy "orgs_select" on orgs for select
  using (id in (select public.user_org_ids()) and deleted_at is null);

create policy "orgs_update" on orgs for update
  using (id in (
    select org_id from org_members
    where user_id = auth.uid() and role = 'owner'
  ));

-- ============================================================
-- ORG_MEMBERS
-- ============================================================

create policy "org_members_select" on org_members for select
  using (org_id in (select public.user_org_ids()));

create policy "org_members_insert" on org_members for insert
  with check (org_id in (
    select org_id from org_members
    where user_id = auth.uid() and role = 'owner'
  ));

create policy "org_members_delete" on org_members for delete
  using (org_id in (
    select org_id from org_members
    where user_id = auth.uid() and role = 'owner'
  ));

-- ============================================================
-- INVITATIONS
-- ============================================================

create policy "invitations_select" on invitations for select
  using (org_id in (select public.user_org_ids()));

create policy "invitations_insert" on invitations for insert
  with check (org_id in (select public.user_editor_org_ids()));

-- ============================================================
-- GITHUB_INSTALLATIONS
-- ============================================================

create policy "github_installations_select" on github_installations for select
  using (org_id in (select public.user_org_ids()));

create policy "github_installations_insert" on github_installations for insert
  with check (org_id in (
    select org_id from org_members
    where user_id = auth.uid() and role = 'owner'
  ));

-- ============================================================
-- PROJECTS
-- ============================================================

create policy "projects_select" on projects for select
  using (org_id in (select public.user_org_ids()) and deleted_at is null);

create policy "projects_insert" on projects for insert
  with check (org_id in (select public.user_editor_org_ids()));

create policy "projects_update" on projects for update
  using (org_id in (select public.user_editor_org_ids()));

-- ============================================================
-- SCOUT ARTIFACTS (via project → org)
-- ============================================================

create policy "routes_select" on routes for select
  using (project_id in (
    select id from projects where org_id in (select public.user_org_ids()) and deleted_at is null
  ));

create policy "design_tokens_select" on design_tokens for select
  using (project_id in (
    select id from projects where org_id in (select public.user_org_ids()) and deleted_at is null
  ));

create policy "screen_specs_select" on screen_specs for select
  using (project_id in (
    select id from projects where org_id in (select public.user_org_ids()) and deleted_at is null
  ));

create policy "data_models_select" on data_models for select
  using (project_id in (
    select id from projects where org_id in (select public.user_org_ids()) and deleted_at is null
  ));

create policy "api_endpoints_select" on api_endpoints for select
  using (project_id in (
    select id from projects where org_id in (select public.user_org_ids()) and deleted_at is null
  ));

create policy "code_chunks_select" on code_chunks for select
  using (project_id in (
    select id from projects where org_id in (select public.user_org_ids()) and deleted_at is null
  ));

-- ============================================================
-- DEMOS
-- ============================================================

create policy "demos_select" on demos for select
  using (org_id in (select public.user_org_ids()) and deleted_at is null);

create policy "demos_insert" on demos for insert
  with check (org_id in (select public.user_editor_org_ids()));

create policy "demos_update" on demos for update
  using (org_id in (select public.user_editor_org_ids()));

-- ============================================================
-- STEPS, MOCKS, ANNOTATIONS (via demo → org)
-- ============================================================

create policy "steps_select" on steps for select
  using (demo_id in (
    select id from demos where org_id in (select public.user_org_ids()) and deleted_at is null
  ));

create policy "steps_insert" on steps for insert
  with check (demo_id in (
    select id from demos where org_id in (select public.user_editor_org_ids()) and deleted_at is null
  ));

create policy "steps_update" on steps for update
  using (demo_id in (
    select id from demos where org_id in (select public.user_editor_org_ids()) and deleted_at is null
  ));

create policy "steps_delete" on steps for delete
  using (demo_id in (
    select id from demos where org_id in (select public.user_editor_org_ids()) and deleted_at is null
  ));

create policy "mocks_select" on mocks for select
  using (demo_id in (
    select id from demos where org_id in (select public.user_org_ids()) and deleted_at is null
  ));

create policy "mocks_all" on mocks for all
  using (demo_id in (
    select id from demos where org_id in (select public.user_editor_org_ids()) and deleted_at is null
  ));

create policy "annotations_select" on annotations for select
  using (step_id in (
    select s.id from steps s
    join demos d on s.demo_id = d.id
    where d.org_id in (select public.user_org_ids()) and d.deleted_at is null
  ));

create policy "annotations_all" on annotations for all
  using (step_id in (
    select s.id from steps s
    join demos d on s.demo_id = d.id
    where d.org_id in (select public.user_editor_org_ids()) and d.deleted_at is null
  ));

-- ============================================================
-- THEMES & ASSETS
-- ============================================================

create policy "themes_select" on themes for select
  using (demo_id in (
    select id from demos where org_id in (select public.user_org_ids()) and deleted_at is null
  ));

create policy "themes_all" on themes for all
  using (demo_id in (
    select id from demos where org_id in (select public.user_editor_org_ids()) and deleted_at is null
  ));

create policy "assets_select" on assets for select
  using (org_id in (select public.user_org_ids()));

create policy "assets_insert" on assets for insert
  with check (org_id in (select public.user_editor_org_ids()));

-- ============================================================
-- AGENT MESSAGES & JOBS
-- ============================================================

create policy "agent_messages_select" on agent_messages for select
  using (demo_id in (
    select id from demos where org_id in (select public.user_org_ids()) and deleted_at is null
  ));

create policy "agent_messages_insert" on agent_messages for insert
  with check (demo_id in (
    select id from demos where org_id in (select public.user_editor_org_ids()) and deleted_at is null
  ));

create policy "jobs_select" on jobs for select
  using (org_id in (select public.user_org_ids()));

-- ============================================================
-- SHARING — public access by token
-- ============================================================

create policy "share_links_select_owner" on share_links for select
  using (demo_id in (
    select id from demos where org_id in (select public.user_org_ids()) and deleted_at is null
  ));

create policy "share_links_insert" on share_links for insert
  with check (demo_id in (
    select id from demos where org_id in (select public.user_editor_org_ids()) and deleted_at is null
  ));

-- Public read by token (for viewers)
create policy "share_links_public_read" on share_links for select
  using (visibility = 'public');

-- Demo views: anyone can insert (analytics)
create policy "demo_views_insert" on demo_views for insert
  with check (true);

create policy "demo_views_select" on demo_views for select
  using (demo_id in (
    select id from demos where org_id in (select public.user_org_ids()) and deleted_at is null
  ));
