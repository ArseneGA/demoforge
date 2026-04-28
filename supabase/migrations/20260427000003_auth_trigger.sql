-- ============================================================
-- DemoForge — Org auto-creation on user signup
-- ============================================================

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_org_id uuid;
  user_email_prefix text;
begin
  -- Extract prefix from email (before @) to use as default slug/name
  user_email_prefix := split_part(new.email, '@', 1);

  -- Create a new personal organization for the user
  insert into public.orgs (slug, name, plan)
  values (
    user_email_prefix || '-' || substr(md5(random()::text), 1, 6),
    'Org de ' || user_email_prefix,
    'free'
  )
  returning id into new_org_id;

  -- Add the user as the owner of this new organization
  insert into public.org_members (org_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  return new;
end;
$$;

-- Trigger on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
