create schema if not exists app;
create schema if not exists indexer;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app.app_role as enum ('voter', 'admin', 'super_admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'proposal_status') then
    create type app.proposal_status as enum ('draft', 'submitted', 'approved', 'rejected', 'deployed', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'whitelist_source') then
    create type app.whitelist_source as enum ('manual', 'csv', 'sync');
  end if;

  if not exists (select 1 from pg_type where typname = 'validation_status') then
    create type app.validation_status as enum ('pending', 'valid', 'invalid', 'synced', 'failed');
  end if;

  if not exists (select 1 from pg_type where typname = 'tx_action_type') then
    create type app.tx_action_type as enum (
      'submit_proposal',
      'review_proposal',
      'deploy_space',
      'register_voter',
      'unregister_voter',
      'phase_transition',
      'commit_vote',
      'reveal_vote',
      'suspend_space',
      'unsuspend_space',
      'terminate_space'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'proof_type') then
    create type app.proof_type as enum ('commit_receipt', 'reveal_receipt', 'space_report', 'audit_bundle');
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_channel') then
    create type app.notification_channel as enum ('in_app', 'email', 'webhook');
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_status') then
    create type app.notification_status as enum ('queued', 'sent', 'failed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'sync_health_status') then
    create type indexer.sync_health_status as enum ('ok', 'lagging', 'resyncing', 'degraded');
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

create table if not exists app.app_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  wallet_address text not null unique,
  display_name text,
  email text,
  role app.app_role not null default 'voter',
  role_hint text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint wallet_address_format check (wallet_address ~ '^0x[a-fA-F0-9]{40}$')
);

create table if not exists app.proposal_drafts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references app.app_profiles(id) on delete restrict,
  title text not null,
  description text,
  organization_name text,
  theme_color text not null default '#0F172A',
  rules_text text,
  candidate_count integer not null default 0,
  status app.proposal_status not null default 'draft',
  metadata_version integer not null default 1,
  onchain_proposal_id bigint,
  proposal_tx_hash text,
  review_tx_hash text,
  deployment_tx_hash text,
  deployed_space_id bigint,
  deployed_space_address text,
  commit_start_at timestamptz,
  reveal_start_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint theme_color_hex check (theme_color ~ '^#[A-Fa-f0-9]{6}$'),
  constraint proposal_tx_hash_hex check (proposal_tx_hash is null or proposal_tx_hash ~ '^0x[a-fA-F0-9]{64}$'),
  constraint review_tx_hash_hex check (review_tx_hash is null or review_tx_hash ~ '^0x[a-fA-F0-9]{64}$'),
  constraint deployment_tx_hash_hex check (deployment_tx_hash is null or deployment_tx_hash ~ '^0x[a-fA-F0-9]{64}$'),
  constraint deployed_space_address_hex check (deployed_space_address is null or deployed_space_address ~ '^0x[a-fA-F0-9]{40}$')
);

create table if not exists app.proposal_candidates (
  id uuid primary key default gen_random_uuid(),
  proposal_draft_id uuid not null references app.proposal_drafts(id) on delete cascade,
  candidate_local_id text not null,
  full_name text not null,
  student_id text,
  faculty text,
  bio text,
  vision text,
  mission jsonb not null default '[]'::jsonb,
  avatar_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (proposal_draft_id, candidate_local_id)
);

create table if not exists app.whitelist_import_jobs (
  id uuid primary key default gen_random_uuid(),
  proposal_draft_id uuid not null references app.proposal_drafts(id) on delete cascade,
  created_by uuid not null references app.app_profiles(id) on delete restrict,
  file_path text not null,
  file_name text not null,
  row_count integer not null default 0,
  invalid_count integer not null default 0,
  status app.validation_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists app.proposal_whitelist_entries (
  id uuid primary key default gen_random_uuid(),
  proposal_draft_id uuid not null references app.proposal_drafts(id) on delete cascade,
  import_job_id uuid references app.whitelist_import_jobs(id) on delete set null,
  wallet_address text not null,
  voter_name text,
  source app.whitelist_source not null default 'manual',
  validation_status app.validation_status not null default 'pending',
  sync_status app.validation_status not null default 'pending',
  latest_sync_tx_hash text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint whitelist_wallet_format check (wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
  constraint whitelist_sync_tx_hash_hex check (latest_sync_tx_hash is null or latest_sync_tx_hash ~ '^0x[a-fA-F0-9]{64}$'),
  unique (proposal_draft_id, wallet_address)
);

create table if not exists app.space_metadata_versions (
  id uuid primary key default gen_random_uuid(),
  proposal_draft_id uuid not null references app.proposal_drafts(id) on delete cascade,
  version integer not null,
  metadata_uri text not null,
  content_hash text not null,
  is_final boolean not null default false,
  created_by uuid references app.app_profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (proposal_draft_id, version),
  constraint content_hash_hex check (content_hash ~ '^0x[a-fA-F0-9]{64}$')
);

create table if not exists app.space_registry_map (
  id uuid primary key default gen_random_uuid(),
  proposal_draft_id uuid unique references app.proposal_drafts(id) on delete cascade,
  chain_id bigint not null default 84532,
  onchain_proposal_id bigint,
  space_id bigint,
  registry_address text not null,
  space_address text,
  owner_wallet text not null,
  deployment_tx_hash text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint registry_address_hex check (registry_address ~ '^0x[a-fA-F0-9]{40}$'),
  constraint space_address_hex check (space_address is null or space_address ~ '^0x[a-fA-F0-9]{40}$'),
  constraint owner_wallet_hex check (owner_wallet ~ '^0x[a-fA-F0-9]{40}$'),
  constraint deployment_tx_hash_hex_map check (deployment_tx_hash is null or deployment_tx_hash ~ '^0x[a-fA-F0-9]{64}$')
);

create table if not exists app.tx_audit_log (
  id uuid primary key default gen_random_uuid(),
  space_id bigint,
  proposal_draft_id uuid references app.proposal_drafts(id) on delete set null,
  wallet_address text not null,
  action_type app.tx_action_type not null,
  tx_hash text not null,
  block_number bigint,
  status text not null default 'pending',
  source text not null default 'frontend',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tx_hash, action_type),
  constraint tx_audit_wallet_hex check (wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
  constraint tx_audit_hash_hex check (tx_hash ~ '^0x[a-fA-F0-9]{64}$')
);

create table if not exists app.proof_exports (
  id uuid primary key default gen_random_uuid(),
  space_id bigint,
  owner_profile_id uuid references app.app_profiles(id) on delete set null,
  wallet_address text not null,
  proof_type app.proof_type not null,
  file_path text not null,
  tx_hash text,
  generated_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb,
  constraint proof_wallet_hex check (wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
  constraint proof_tx_hash_hex check (tx_hash is null or tx_hash ~ '^0x[a-fA-F0-9]{64}$')
);

create table if not exists app.ops_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references app.app_profiles(id) on delete set null,
  actor_wallet text,
  action_name text not null,
  entity_type text not null,
  entity_id text not null,
  request_id text,
  before_state jsonb,
  after_state jsonb,
  related_tx_hash text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint ops_audit_wallet_hex check (actor_wallet is null or actor_wallet ~ '^0x[a-fA-F0-9]{40}$'),
  constraint ops_audit_tx_hex check (related_tx_hash is null or related_tx_hash ~ '^0x[a-fA-F0-9]{64}$')
);

create table if not exists app.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  space_id bigint,
  target_profile_id uuid references app.app_profiles(id) on delete set null,
  target_wallet text,
  channel app.notification_channel not null,
  template_key text not null,
  status app.notification_status not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint notification_wallet_hex check (target_wallet is null or target_wallet ~ '^0x[a-fA-F0-9]{40}$')
);

create table if not exists indexer.indexer_sync_status (
  id uuid primary key default gen_random_uuid(),
  chain_id bigint not null default 84532,
  source_key text not null unique,
  latest_indexed_block bigint,
  latest_indexed_block_time timestamptz,
  latest_safe_block bigint,
  head_lag_blocks integer,
  head_lag_seconds integer,
  health_status indexer.sync_health_status not null default 'degraded',
  last_error_message text,
  last_error_at timestamptz,
  last_reorg_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_app_profiles_wallet on app.app_profiles(wallet_address);
create index if not exists idx_proposal_drafts_created_by on app.proposal_drafts(created_by, status);
create index if not exists idx_proposal_candidates_proposal on app.proposal_candidates(proposal_draft_id, sort_order);
create index if not exists idx_whitelist_entries_proposal on app.proposal_whitelist_entries(proposal_draft_id, sync_status);
create index if not exists idx_space_registry_map_space on app.space_registry_map(space_id);
create index if not exists idx_tx_audit_log_space on app.tx_audit_log(space_id, created_at desc);
create index if not exists idx_tx_audit_log_wallet on app.tx_audit_log(wallet_address, created_at desc);
create index if not exists idx_proof_exports_owner on app.proof_exports(owner_profile_id, generated_at desc);
create index if not exists idx_ops_audit_actor on app.ops_audit_log(actor_profile_id, created_at desc);
create index if not exists idx_notification_jobs_status on app.notification_jobs(status, created_at asc);

create trigger set_app_profiles_updated_at
before update on app.app_profiles
for each row execute function app.set_updated_at();

create trigger set_proposal_drafts_updated_at
before update on app.proposal_drafts
for each row execute function app.set_updated_at();

create trigger set_proposal_candidates_updated_at
before update on app.proposal_candidates
for each row execute function app.set_updated_at();

create trigger set_whitelist_import_jobs_updated_at
before update on app.whitelist_import_jobs
for each row execute function app.set_updated_at();

create trigger set_proposal_whitelist_entries_updated_at
before update on app.proposal_whitelist_entries
for each row execute function app.set_updated_at();

create trigger set_space_registry_map_updated_at
before update on app.space_registry_map
for each row execute function app.set_updated_at();

create trigger set_tx_audit_log_updated_at
before update on app.tx_audit_log
for each row execute function app.set_updated_at();

create trigger set_notification_jobs_updated_at
before update on app.notification_jobs
for each row execute function app.set_updated_at();

create trigger set_indexer_sync_status_updated_at
before update on indexer.indexer_sync_status
for each row execute function app.set_updated_at();

create or replace function app.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = app
as $$
  select id from app.app_profiles where user_id = auth.uid() limit 1;
$$;

create or replace function app.current_user_role()
returns app.app_role
language sql
stable
security definer
set search_path = app
as $$
  select role from app.app_profiles where user_id = auth.uid() limit 1;
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

alter table app.app_profiles enable row level security;
alter table app.proposal_drafts enable row level security;
alter table app.proposal_candidates enable row level security;
alter table app.whitelist_import_jobs enable row level security;
alter table app.proposal_whitelist_entries enable row level security;
alter table app.space_metadata_versions enable row level security;
alter table app.space_registry_map enable row level security;
alter table app.tx_audit_log enable row level security;
alter table app.proof_exports enable row level security;
alter table app.ops_audit_log enable row level security;
alter table app.notification_jobs enable row level security;
alter table indexer.indexer_sync_status enable row level security;

create policy "profiles_select_self_or_admin"
on app.app_profiles
for select
using (user_id = auth.uid() or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role]));

create policy "profiles_insert_self"
on app.app_profiles
for insert
with check (user_id = auth.uid());

create policy "profiles_update_self_or_admin"
on app.app_profiles
for update
using (user_id = auth.uid() or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role]))
with check (user_id = auth.uid() or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role]));

create policy "proposal_drafts_select_owner_or_admin"
on app.proposal_drafts
for select
using (
  created_by = app.current_profile_id()
  or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
);

create policy "proposal_drafts_insert_admin"
on app.proposal_drafts
for insert
with check (
  created_by = app.current_profile_id()
  and app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
);

create policy "proposal_drafts_update_owner_or_admin"
on app.proposal_drafts
for update
using (
  created_by = app.current_profile_id()
  or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
)
with check (
  created_by = app.current_profile_id()
  or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
);

create policy "proposal_candidates_manage_parent_owner_or_admin"
on app.proposal_candidates
for all
using (
  exists (
    select 1
    from app.proposal_drafts d
    where d.id = proposal_draft_id
      and (
        d.created_by = app.current_profile_id()
        or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
      )
  )
)
with check (
  exists (
    select 1
    from app.proposal_drafts d
    where d.id = proposal_draft_id
      and (
        d.created_by = app.current_profile_id()
        or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
      )
  )
);

create policy "whitelist_jobs_manage_parent_owner_or_admin"
on app.whitelist_import_jobs
for all
using (
  exists (
    select 1
    from app.proposal_drafts d
    where d.id = proposal_draft_id
      and (
        d.created_by = app.current_profile_id()
        or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
      )
  )
)
with check (
  created_by = app.current_profile_id()
  and exists (
    select 1
    from app.proposal_drafts d
    where d.id = proposal_draft_id
      and (
        d.created_by = app.current_profile_id()
        or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
      )
  )
);

create policy "whitelist_entries_manage_parent_owner_or_admin"
on app.proposal_whitelist_entries
for all
using (
  exists (
    select 1
    from app.proposal_drafts d
    where d.id = proposal_draft_id
      and (
        d.created_by = app.current_profile_id()
        or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
      )
  )
)
with check (
  exists (
    select 1
    from app.proposal_drafts d
    where d.id = proposal_draft_id
      and (
        d.created_by = app.current_profile_id()
        or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
      )
  )
);

create policy "metadata_versions_select_owner_or_admin"
on app.space_metadata_versions
for select
using (
  exists (
    select 1
    from app.proposal_drafts d
    where d.id = proposal_draft_id
      and (
        d.created_by = app.current_profile_id()
        or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
      )
  )
);

create policy "metadata_versions_insert_admin"
on app.space_metadata_versions
for insert
with check (
  exists (
    select 1
    from app.proposal_drafts d
    where d.id = proposal_draft_id
      and (
        d.created_by = app.current_profile_id()
        or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
      )
  )
);

create policy "space_registry_map_select_owner_or_admin"
on app.space_registry_map
for select
using (
  exists (
    select 1
    from app.proposal_drafts d
    where d.id = proposal_draft_id
      and (
        d.created_by = app.current_profile_id()
        or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
      )
  )
);

create policy "tx_audit_log_select_owner_or_admin"
on app.tx_audit_log
for select
using (
  wallet_address in (
    select wallet_address from app.app_profiles where user_id = auth.uid()
  )
  or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
);

create policy "tx_audit_log_insert_owner_or_admin"
on app.tx_audit_log
for insert
with check (
  wallet_address in (
    select wallet_address from app.app_profiles where user_id = auth.uid()
  )
  or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
);

create policy "proof_exports_select_owner_or_admin"
on app.proof_exports
for select
using (
  owner_profile_id = app.current_profile_id()
  or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
);

create policy "proof_exports_insert_owner_or_admin"
on app.proof_exports
for insert
with check (
  owner_profile_id = app.current_profile_id()
  or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
);

create policy "ops_audit_log_select_admin_only"
on app.ops_audit_log
for select
using (app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role]));

create policy "notification_jobs_select_target_or_admin"
on app.notification_jobs
for select
using (
  target_profile_id = app.current_profile_id()
  or target_wallet in (select wallet_address from app.app_profiles where user_id = auth.uid())
  or app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role])
);

create policy "indexer_sync_status_select_authenticated"
on indexer.indexer_sync_status
for select
using (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('space-metadata', 'space-metadata', false, 52428800, array['application/json']),
  ('proof-exports', 'proof-exports', false, 52428800, array['application/json', 'application/pdf'])
on conflict (id) do nothing;
