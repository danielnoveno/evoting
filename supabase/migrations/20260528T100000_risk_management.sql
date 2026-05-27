-- Migration: Risk Management Schema
-- Description: Adds tables for risk alerts and blocked entities for superadmin monitoring.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'risk_tone') then
    create type app.risk_tone as enum ('danger', 'warning', 'info');
  end if;

  if not exists (select 1 from pg_type where typname = 'risk_status') then
    create type app.risk_status as enum ('active', 'resolved', 'blocked');
  end if;
end $$;

create table if not exists app.risk_alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  actor_label text not null, -- e.g., 'IP Aktor', 'Wallet Address', 'ID Ruang'
  actor_value text not null,
  tone app.risk_tone not null default 'warning',
  status app.risk_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists app.blocked_entities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null, -- 'ip', 'wallet', 'space'
  entity_value text not null,
  reason text,
  blocked_by uuid references app.app_profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  unique (entity_type, entity_value)
);

-- Enable RLS
alter table app.risk_alerts enable row level security;
alter table app.blocked_entities enable row level security;

-- Policies for Super Admin
create policy "super_admin_all_risk_alerts"
on app.risk_alerts
for all
using (app.has_role(array['super_admin'::app.app_role]))
with check (app.has_role(array['super_admin'::app.app_role]));

create policy "super_admin_all_blocked_entities"
on app.blocked_entities
for all
using (app.has_role(array['super_admin'::app.app_role]))
with check (app.has_role(array['super_admin'::app.app_role]));

-- Trigger for updated_at
create trigger set_risk_alerts_updated_at
before update on app.risk_alerts
for each row execute function app.set_updated_at();

-- Indexes
create index if not exists idx_risk_alerts_status on app.risk_alerts(status, created_at desc);
create index if not exists idx_blocked_entities_value on app.blocked_entities(entity_value);
