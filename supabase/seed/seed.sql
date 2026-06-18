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
  'Organisasi Hima test',
  'pending',
  'all',
  'HIMAFORKA-test'
) on conflict (email) do update set
  assigned_role = 'admin',
  description = excluded.description,
  organization_name = excluded.organization_name,
  status = 'pending',
  activation_accepted_at = null,
  access_scope = 'all';

-- Voter uji sengaja tidak dibuat aktif di app_profiles/admin_registry.
-- Gunakan menu Superadmin → Data Voter → Kirim Email Aktivasi untuk membuat token aktivasi voter.

-- Jika profile lama masih ada, pastikan role tidak lebih tinggi dari status aktivasi.
update app.app_profiles set role = 'super_admin' where email = 'dnw022003@gmail.com';
update app.app_profiles set role = 'voter' where email = 'novenoow@gmail.com' and role = 'admin';
delete from app.app_profiles where email = '220711663@students.uajy.ac.id';

-- Master Voters: HIMAFORKA (Informatika)
insert into app.master_voters (nim, full_name, email, prodi, fakultas, angkatan, wallet_address, status) values
('2207116630', 'Daniel Noveno Windanu', '220711663@students.uajy.ac.id', 'Informatika', 'FTI', '2022', null, 'pending'),
('2207116631', 'Alexander Prasetyo', '2207116631@students.uajy.ac.id', 'Informatika', 'FTI', '2022', null, 'active'),
('2207116632', 'Maria Consiglia', '2207116632@students.uajy.ac.id', 'Informatika', 'FTI', '2022', null, 'active'),
('2207116633', 'Budi Santoso', '2207116633@students.uajy.ac.id', 'Informatika', 'FTI', '2022', null, 'active'),
('2207116634', 'Rina Wijaya', '2207116634@students.uajy.ac.id', 'Informatika', 'FTI', '2022', null, 'active'),
('2307116640', 'Christoper Reno', '2307116640@students.uajy.ac.id', 'Informatika', 'FTI', '2023', null, 'active'),
('2307116641', 'Sarah Putri', '2307116641@students.uajy.ac.id', 'Informatika', 'FTI', '2023', null, 'active'),
('2307116642', 'Kevin Anggara', '2307116642@students.uajy.ac.id', 'Informatika', 'FTI', '2023', null, 'active'),
('2307116643', 'Angela Florencia', '2307116643@students.uajy.ac.id', 'Informatika', 'FTI', '2023', null, 'active'),
('2307116644', 'David Chen', '2307116644@students.uajy.ac.id', 'Informatika', 'FTI', '2023', null, 'active')
on conflict (nim) do nothing;

-- Pastikan voter uji tetap belum aktif meskipun seed dijalankan ulang tanpa reset penuh.
update app.master_voters
set wallet_address = null,
    status = 'pending'
where nim = '2207116630';

-- Master Voters: PEMILRA (multi-prodi)
insert into app.master_voters (nim, full_name, email, prodi, fakultas, angkatan, wallet_address, status) values
('2207126010', 'Rizky Pratama', '2207126010@students.uajy.ac.id', 'Sistem Informasi', 'FTI', '2022', null, 'active'),
('2207126011', 'Dewi Anggraeni', '2207126011@students.uajy.ac.id', 'Sistem Informasi', 'FTI', '2022', null, 'active'),
('2207126012', 'Fajar Nugroho', '2207126012@students.uajy.ac.id', 'Sistem Informasi', 'FTI', '2022', null, 'active'),
('2307126020', 'Lestari Budiman', '2307126020@students.uajy.ac.id', 'Sistem Informasi', 'FTI', '2023', null, 'active'),
('2307126021', 'Yoga Saputra', '2307126021@students.uajy.ac.id', 'Sistem Informasi', 'FTI', '2023', null, 'active'),
('2207136010', 'Hendra Kurniawan', '2207136010@students.uajy.ac.id', 'Teknik Industri', 'FTI', '2022', null, 'active'),
('2207136011', 'Putri Ayu Lestari', '2207136011@students.uajy.ac.id', 'Teknik Industri', 'FTI', '2022', null, 'active'),
('2307136020', 'Andi Cahyono', '2307136020@students.uajy.ac.id', 'Teknik Industri', 'FTI', '2023', null, 'active'),
('2307136021', 'Maya Sari', '2307136021@students.uajy.ac.id', 'Teknik Industri', 'FTI', '2023', null, 'active'),
('2207146010', 'Rudi Hartono', '2207146010@students.uajy.ac.id', 'Arsitektur', 'FTI', '2022', null, 'active'),
('2307146020', 'Sinta Dewi', '2307146020@students.uajy.ac.id', 'Arsitektur', 'FTI', '2023', null, 'active'),
('2207156010', 'Bambang Setiadi', '2207156010@students.uajy.ac.id', 'Teknik Sipil', 'FTI', '2022', null, 'active'),
('2307156020', 'Eko Prasetyo', '2307156020@students.uajy.ac.id', 'Teknik Sipil', 'FTI', '2023', null, 'active')
on conflict (nim) do nothing;
