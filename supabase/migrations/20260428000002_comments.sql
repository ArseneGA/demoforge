create table comments (
  id uuid primary key default gen_random_uuid(),
  demo_id uuid references demos(id) on delete cascade not null,
  step_id uuid references steps(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text not null,
  content text not null,
  created_at timestamptz default now()
);

create index on comments (demo_id, created_at);
create index on comments (step_id);

alter table comments enable row level security;

create policy "comments_select" on comments for select
  using (demo_id in (
    select id from demos where org_id in (select public.user_org_ids()) and deleted_at is null
  ));

create policy "comments_insert" on comments for insert
  with check (demo_id in (
    select id from demos where org_id in (select public.user_editor_org_ids()) and deleted_at is null
  ));

create policy "comments_delete" on comments for delete
  using (user_id = auth.uid());
