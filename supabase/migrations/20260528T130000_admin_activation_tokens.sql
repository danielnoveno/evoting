alter table app.admin_registry
  add column if not exists wallet_address text,
  add column if not exists activation_token_hash text,
  add column if not exists activation_sent_at timestamptz,
  add column if not exists activation_expires_at timestamptz,
  add column if not exists activation_accepted_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'admin_registry_wallet_format'
  ) then
    alter table app.admin_registry
      add constraint admin_registry_wallet_format
      check (wallet_address is null or wallet_address ~ '^0x[a-fA-F0-9]{40}$');
  end if;
end $$;

create unique index if not exists admin_registry_activation_token_hash_idx
on app.admin_registry (activation_token_hash)
where activation_token_hash is not null;

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
      and (
        (assigned_role = 'admin'::app.app_role and status in ('pending', 'active'))
        or (assigned_role = 'super_admin'::app.app_role and status = 'active')
      )
      and assigned_role in ('admin'::app.app_role, 'super_admin'::app.app_role)
    limit 1
  ), 'voter'::app.app_role);
$$;
