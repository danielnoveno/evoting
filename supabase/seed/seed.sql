-- VoteChain seed data.
-- Jalankan setelah supabase/migrations/00000000000000_consolidated_migration.sql.

insert into indexer.indexer_sync_status (
  source_key,
  chain_id,
  latest_indexed_block,
  latest_safe_block,
  head_lag_blocks,
  head_lag_seconds,
  health_status
)
values (
  'base-sepolia:votechain',
  84532,
  null,
  null,
  null,
  null,
  'degraded'
)
on conflict (source_key) do nothing;

-- Development role registry.
-- Superadmin seed aktif agar ada akun awal yang bisa mengelola undangan.
-- Admin biasa tetap pending agar flow aktivasi email tetap diuji.

insert into app.admin_registry (
  email,
  assigned_role,
  description,
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
  description = excluded.description,
  status = 'active',
  access_scope = 'all';

insert into app.admin_registry (
  email,
  assigned_role,
  description,
  status,
  access_scope,
  organization_name
) values (
  'novenoow@gmail.com',
  'admin',
  'FTI Admin',
  'pending',
  'all',
  'FTI UAJY'
) on conflict (email) do update set
  assigned_role = 'admin',
  description = excluded.description,
  organization_name = excluded.organization_name,
  status = 'pending',
  activation_accepted_at = null,
  access_scope = 'all';

insert into app.admin_registry (
  email,
  assigned_role,
  description,
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
  description = excluded.description,
  status = 'active',
  access_scope = 'all',
  wallet_address = '0xB8064e95d190777C16D1795aA872B259df4B8930';

-- Jika profile lama masih ada, pastikan role tidak lebih tinggi dari status aktivasi.
update app.app_profiles set role = 'super_admin' where email = 'dnw022003@gmail.com';
update app.app_profiles set role = 'voter' where email = 'novenoow@gmail.com' and role = 'admin';
update app.app_profiles set role = 'voter' where email = '220711663@students.uajy.ac.id';
