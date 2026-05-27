create schema if not exists app;

do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'app'::regnamespace and typname = 'app_role') then
    create type app.app_role as enum ('voter', 'admin', 'super_admin');
  end if;
end $$;

create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function app.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = app
as $$
  select id from app.app_profiles where user_id = auth.uid() limit 1;
$$;

create or replace function app.has_role(roles app.app_role[])
returns boolean
language sql
stable
security definer
set search_path = app
as $$
  select exists (
    select 1
    from app.app_profiles
    where user_id = auth.uid()
      and role = any(roles)
  );
$$;

create table if not exists app.admin_registry (
  email text primary key,
  assigned_role app.app_role not null default 'admin',
  display_name text,
  organization_name text,
  access_scope text not null default 'all',
  status text not null default 'pending',
  description text,
  created_by uuid references app.app_profiles(id) on delete set null,
  updated_by uuid references app.app_profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint admin_registry_email_format check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  constraint admin_registry_scope_check check (access_scope in ('all', 'specific')),
  constraint admin_registry_status_check check (status in ('pending', 'active', 'inactive')),
  constraint admin_registry_role_check check (assigned_role in ('admin'::app.app_role, 'super_admin'::app.app_role))
);

drop trigger if exists set_admin_registry_updated_at on app.admin_registry;
create trigger set_admin_registry_updated_at
before update on app.admin_registry
for each row execute function app.set_updated_at();

alter table app.admin_registry enable row level security;

create or replace function app.role_for_email(input_email text)
returns app.app_role
language sql
stable
security definer
set search_path = app
as $$
  select coalesce((
    select assigned_role
    from app.admin_registry
    where lower(email) = lower(coalesce(input_email, ''))
      and status in ('pending', 'active')
      and assigned_role in ('admin'::app.app_role, 'super_admin'::app.app_role)
    limit 1
  ), 'voter'::app.app_role);
$$;

drop policy if exists "profiles_insert_self" on app.app_profiles;
drop policy if exists "profiles_update_self_or_admin" on app.app_profiles;
drop policy if exists "profiles_update_self_or_superadmin" on app.app_profiles;

create policy "profiles_insert_self"
on app.app_profiles
for insert
with check (
  user_id = auth.uid()
  and role = app.role_for_email(email)
);

create policy "profiles_update_self_or_superadmin"
on app.app_profiles
for update
using (
  user_id = auth.uid()
  or app.has_role(array['super_admin'::app.app_role])
)
with check (
  (
    user_id = auth.uid()
    and role = app.role_for_email(email)
  )
  or app.has_role(array['super_admin'::app.app_role])
);

drop policy if exists "admin_registry_select_self_or_superadmin" on app.admin_registry;
drop policy if exists "admin_registry_insert_superadmin" on app.admin_registry;
drop policy if exists "admin_registry_update_superadmin" on app.admin_registry;
drop policy if exists "admin_registry_delete_superadmin" on app.admin_registry;

create policy "admin_registry_select_self_or_superadmin"
on app.admin_registry
for select
using (
  app.has_role(array['super_admin'::app.app_role])
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy "admin_registry_insert_superadmin"
on app.admin_registry
for insert
with check (app.has_role(array['super_admin'::app.app_role]));

create policy "admin_registry_update_superadmin"
on app.admin_registry
for update
using (app.has_role(array['super_admin'::app.app_role]))
with check (app.has_role(array['super_admin'::app.app_role]));

create policy "admin_registry_delete_superadmin"
on app.admin_registry
for delete
using (app.has_role(array['super_admin'::app.app_role]));
