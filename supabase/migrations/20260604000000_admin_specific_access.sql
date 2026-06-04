-- Migration: Admin Specific Access Control
-- Description: Adds a mapping table for admin to specific election (proposal) access and updates RLS policies.

create table if not exists app.admin_space_access (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null references app.admin_registry(email) on delete cascade,
  proposal_draft_id uuid not null references app.proposal_drafts(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (admin_email, proposal_draft_id)
);

-- Enable RLS
alter table app.admin_space_access enable row level security;

-- Policies for Admin Space Access
create policy "super_admin_manage_all_access"
on app.admin_space_access
for all
using (app.has_role(array['super_admin'::app.app_role]))
with check (app.has_role(array['super_admin'::app.app_role]));

create policy "admin_view_own_access"
on app.admin_space_access
for select
using (
  lower(admin_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

-- Update Proposal Drafts RLS to be more restrictive for Admins with 'specific' scope
drop policy if exists "proposal_drafts_select_owner_or_admin" on app.proposal_drafts;

create policy "proposal_drafts_select_restricted"
on app.proposal_drafts
for select
using (
  -- Super Admin sees everything
  app.has_role(array['super_admin'::app.app_role])
  or (
    -- Admin restricted by scope
    app.has_role(array['admin'::app.app_role])
    and (
      -- Case 1: Admin has 'all' scope
      exists (
        select 1 from app.admin_registry
        where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
          and access_scope = 'all'
          and status != 'inactive'
      )
      -- Case 2: Admin is the owner (creator) of the proposal
      or created_by = app.current_profile_id()
      -- Case 3: Admin is specifically assigned to this proposal
      or exists (
        select 1 from app.admin_space_access
        where lower(admin_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
          and proposal_draft_id = id
      )
    )
  )
);

-- Grant permissions
grant select, insert, update, delete on app.admin_space_access to service_role;
grant select on app.admin_space_access to authenticated;
grant insert, update, delete on app.admin_space_access to authenticated;

-- Index for performance
create index if not exists idx_admin_space_access_email on app.admin_space_access(admin_email);
create index if not exists idx_admin_space_access_proposal on app.admin_space_access(proposal_draft_id);
