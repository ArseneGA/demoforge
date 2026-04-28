-- ============================================================
-- DemoForge — Storage v0
-- ============================================================

-- Create buckets
insert into storage.buckets (id, name, public)
values 
  ('assets', 'assets', true),
  ('scan-artifacts', 'scan-artifacts', false),
  ('exports', 'exports', false)
on conflict (id) do nothing;

-- Enable RLS
-- (Note: storage.objects already has RLS enabled by default in Supabase)

-- Assets (Public)
create policy "Public Access to Assets"
  on storage.objects for select
  using ( bucket_id = 'assets' );

create policy "Auth Insert to Assets"
  on storage.objects for insert
  with check ( bucket_id = 'assets' and auth.role() = 'authenticated' );

-- Scan Artifacts (Private)
create policy "Auth Access to Scan Artifacts"
  on storage.objects for all
  using ( bucket_id = 'scan-artifacts' and auth.role() = 'authenticated' );

-- Exports (Private)
create policy "Auth Access to Exports"
  on storage.objects for all
  using ( bucket_id = 'exports' and auth.role() = 'authenticated' );
