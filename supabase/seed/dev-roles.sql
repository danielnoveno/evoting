-- Developer Roles Seed
-- This file contains initial role assignments for development accounts.

-- Defensive schema alignment for databases that were partially migrated before
-- the consolidated migration was introduced. The canonical schema still lives in
-- supabase/migrations/00000000000000_consolidated_migration.sql.
alter table app.admin_registry
    add column if not exists display_name text,
    add column if not exists organization_name text,
    add column if not exists access_scope text not null default 'all',
    add column if not exists status text not null default 'pending',
    add column if not exists wallet_address text,
    add column if not exists activation_token_hash text,
    add column if not exists activation_sent_at timestamptz,
    add column if not exists activation_expires_at timestamptz,
    add column if not exists activation_accepted_at timestamptz;

-- Register Superadmin
insert into app.admin_registry (
    email,
    assigned_role,
    display_name,
    status,
    access_scope
) values (
    'dnw022003@gmail.com',
    'super_admin',
    'Main Developer',
    'active',
    'all'
) on conflict (email) do update set
    assigned_role = 'super_admin',
    display_name = excluded.display_name,
    status = 'active',
    access_scope = 'all';

-- Register Campus Admin
insert into app.admin_registry (
    email,
    assigned_role,
    display_name,
    status,
    access_scope,
    organization_name
) values (
    'novenoow@gmail.com',
    'admin',
    'FTI Admin',
    'active',
    'all',
    'FTI UAJY'
) on conflict (email) do update set
    assigned_role = 'admin',
    display_name = excluded.display_name,
    organization_name = excluded.organization_name,
    status = 'active',
    access_scope = 'all';

-- Register Initial Voter
-- We use admin_registry to pre-register the voter and their wallet.
-- This avoids foreign key errors with auth.users since the student hasn't logged in yet.
insert into app.admin_registry (
    email,
    assigned_role,
    display_name,
    status,
    access_scope,
    wallet_address
) values (
    '220711663@students.uajy.ac.id',
    'voter',
    'Student Voter',
    'active',
    'all',
    '0xB8064e95d190777C16D1795aA872B259df4B8930'
) on conflict (email) do update set
    assigned_role = 'voter',
    display_name = excluded.display_name,
    status = 'active',
    access_scope = 'all',
    wallet_address = '0xB8064e95d190777C16D1795aA872B259df4B8930';

-- Ensure profile roles are correct if they already exist
update app.app_profiles set role = 'super_admin' where email = 'dnw022003@gmail.com';
update app.app_profiles set role = 'admin' where email = 'novenoow@gmail.com';
update app.app_profiles set role = 'voter' where email = '220711663@students.uajy.ac.id';
