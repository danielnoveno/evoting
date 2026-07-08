-- VoteChain fast testing seed for BAB IV/V/VI evidence collection.
-- Run after the three test accounts have logged in at least once so auth.users exists.
-- This seed prepares OFF-CHAIN proposal data only; it does not claim Base Sepolia deployment.

do $$
declare
  v_now timestamptz := now();
  v_commit_start timestamptz := v_now + interval '5 minutes';
  v_reveal_start timestamptz := v_now + interval '10 minutes';
  v_ended_at timestamptz := v_now + interval '11 minutes';

  v_superadmin_user_id uuid;
  v_admin_user_id uuid;
  v_voter_user_id uuid;
  v_superadmin_profile_id uuid;
  v_admin_profile_id uuid;
  v_voter_profile_id uuid;
  v_main_proposal_id uuid;
  v_control_proposal_id uuid;
  v_boundary_proposal_id uuid;

  v_titles text[] := array[
    'Pemilihan Ketua HIMAFORKA FTI UAJY 2026',
    'Pemilihan Koordinator Divisi Akademik HIMAFORKA 2026',
    'Pemilihan Ketua Kelompok Studi Keamanan Siber HIMAFORKA 2026'
  ];
begin
  select id into v_superadmin_user_id from auth.users where lower(email) = 'dnw022003@gmail.com' limit 1;
  select id into v_admin_user_id from auth.users where lower(email) = 'novenoow@gmail.com' limit 1;
  select id into v_voter_user_id from auth.users where lower(email) = '220711663@students.uajy.ac.id' limit 1;

  if v_superadmin_user_id is null or v_admin_user_id is null or v_voter_user_id is null then
    raise exception 'Login dulu dengan akun SuperAdmin, Admin, dan Voter supaya auth.users ada. Missing: superadmin=%, admin=%, voter=%',
      v_superadmin_user_id is null,
      v_admin_user_id is null,
      v_voter_user_id is null;
  end if;

  -- Idempotent cleanup for this testing scenario only.
  delete from app.proposal_drafts where title = any(v_titles);
  delete from app.user_wallets where user_id in (v_superadmin_user_id, v_admin_user_id, v_voter_user_id);

  insert into app.admin_registry (email, assigned_role, organization_name, access_scope, status, description, wallet_address, faculty, activation_accepted_at)
  values
    ('dnw022003@gmail.com', 'super_admin', 'VoteChain Testing', 'all', 'active', 'Akun SuperAdmin pengujian skripsi', '0xF41b1a84FF93C6074fD76860EA1351e2A7197004', 'FTI', v_now),
    ('novenoow@gmail.com', 'admin', 'HIMAFORKA FTI UAJY', 'specific', 'active', 'Akun Admin pembuat proposal pengujian', '0x1599bbE21aBeBee96183317bf77059fC2452E1a4', 'FTI', v_now)
  on conflict (email) do update set
    assigned_role = excluded.assigned_role,
    organization_name = excluded.organization_name,
    access_scope = excluded.access_scope,
    status = excluded.status,
    description = excluded.description,
    wallet_address = excluded.wallet_address,
    faculty = excluded.faculty,
    activation_accepted_at = excluded.activation_accepted_at;

  insert into app.app_profiles (user_id, wallet_address, display_name, email, role, role_hint)
  values
    (v_superadmin_user_id, '0xF41b1a84FF93C6074fD76860EA1351e2A7197004', 'SuperAdmin VoteChain', 'dnw022003@gmail.com', 'super_admin', 'Pengelola sistem dan deploy proposal'),
    (v_admin_user_id, '0x1599bbE21aBeBee96183317bf77059fC2452E1a4', 'Admin HIMAFORKA', 'novenoow@gmail.com', 'admin', 'Pembuat proposal pemilihan'),
    (v_voter_user_id, '0xB8064e95d190777C16D1795aA872B259df4B8930', 'Daniel Noveno Windanu', '220711663@students.uajy.ac.id', 'voter', 'Pemilih terdaftar')
  on conflict (user_id) do update set
    wallet_address = excluded.wallet_address,
    display_name = excluded.display_name,
    email = excluded.email,
    role = excluded.role,
    role_hint = excluded.role_hint;

  select id into v_superadmin_profile_id from app.app_profiles where user_id = v_superadmin_user_id;
  select id into v_admin_profile_id from app.app_profiles where user_id = v_admin_user_id;
  select id into v_voter_profile_id from app.app_profiles where user_id = v_voter_user_id;

  insert into app.user_wallets (user_id, wallet_address)
  values
    (v_superadmin_user_id, '0xF41b1a84FF93C6074fD76860EA1351e2A7197004'),
    (v_admin_user_id, '0x1599bbE21aBeBee96183317bf77059fC2452E1a4'),
    (v_voter_user_id, '0xB8064e95d190777C16D1795aA872B259df4B8930')
  on conflict (user_id) do update set
    wallet_address = excluded.wallet_address,
    updated_at = timezone('utc', now());

  insert into app.master_voters (nim, full_name, email, prodi, fakultas, angkatan, wallet_address, status)
  values
    ('220711663', 'Daniel Noveno Windanu', '220711663@students.uajy.ac.id', 'Informatika', 'FTI', '2022', '0xB8064e95d190777C16D1795aA872B259df4B8930', 'active'),
    ('220711664', 'Alexander Prasetyo', 'alexander.prasetyo@students.uajy.ac.id', 'Informatika', 'FTI', '2022', '0x0000000000000000000000000000000000001001', 'active'),
    ('220711665', 'Maria Consiglia', 'maria.consiglia@students.uajy.ac.id', 'Informatika', 'FTI', '2022', '0x0000000000000000000000000000000000001002', 'active'),
    ('220711666', 'Budi Santoso', 'budi.santoso@students.uajy.ac.id', 'Informatika', 'FTI', '2022', '0x0000000000000000000000000000000000001003', 'active'),
    ('220711667', 'Rina Wijaya', 'rina.wijaya@students.uajy.ac.id', 'Informatika', 'FTI', '2022', '0x0000000000000000000000000000000000001004', 'active'),
    ('230711668', 'Christoper Reno', 'christoper.reno@students.uajy.ac.id', 'Informatika', 'FTI', '2023', '0x0000000000000000000000000000000000001005', 'active'),
    ('230711669', 'Sarah Putri', 'sarah.putri@students.uajy.ac.id', 'Informatika', 'FTI', '2023', '0x0000000000000000000000000000000000001006', 'active'),
    ('230711670', 'Kevin Anggara', 'kevin.anggara@students.uajy.ac.id', 'Informatika', 'FTI', '2023', '0x0000000000000000000000000000000000001007', 'active'),
    ('230711671', 'Angela Florencia', 'angela.florencia@students.uajy.ac.id', 'Informatika', 'FTI', '2023', '0x0000000000000000000000000000000000001008', 'active'),
    ('230711672', 'David Chen', 'david.chen@students.uajy.ac.id', 'Informatika', 'FTI', '2023', '0x0000000000000000000000000000000000001009', 'active')
  on conflict (nim) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    prodi = excluded.prodi,
    fakultas = excluded.fakultas,
    angkatan = excluded.angkatan,
    wallet_address = excluded.wallet_address,
    status = excluded.status;

  insert into app.proposal_drafts (
    created_by, title, description, organization_name, faculty, theme_color, rules_text,
    candidate_count, status, registration_start_at, commit_start_at, reveal_start_at, ended_at
  ) values (
    v_admin_profile_id,
    'Pemilihan Ketua HIMAFORKA FTI UAJY 2026',
    'Data uji BAB IV/V/VI untuk alur proposal, whitelist, commit, reveal, hasil, dan audit. Proposal ini belum deployed on-chain.',
    'HIMAFORKA FTI UAJY',
    'FTI',
    '#0F172A',
    'Satu wallet terdaftar hanya boleh melakukan satu commit dan satu reveal. Periode waktu dipercepat untuk kebutuhan pengujian lokal.',
    3,
    'approved',
    v_now,
    v_commit_start,
    v_reveal_start,
    v_ended_at
  ) returning id into v_main_proposal_id;

  insert into app.proposal_drafts (
    created_by, title, description, organization_name, faculty, theme_color, rules_text,
    candidate_count, status, registration_start_at, commit_start_at, reveal_start_at, ended_at
  ) values (
    v_admin_profile_id,
    'Pemilihan Koordinator Divisi Akademik HIMAFORKA 2026',
    'Data uji pembanding untuk daftar proposal siap deploy oleh SuperAdmin.',
    'HIMAFORKA FTI UAJY',
    'FTI',
    '#0F172A',
    'Satu pemilih hanya dapat memilih satu kandidat pada periode yang tersedia.',
    2,
    'approved',
    v_now,
    v_commit_start,
    v_reveal_start,
    v_ended_at
  ) returning id into v_control_proposal_id;

  insert into app.proposal_drafts (
    created_by, title, description, organization_name, faculty, theme_color, rules_text,
    candidate_count, status, registration_start_at, commit_start_at, reveal_start_at, ended_at
  ) values (
    v_admin_profile_id,
    'Pemilihan Ketua Kelompok Studi Keamanan Siber HIMAFORKA 2026',
    'Data uji boundary untuk membandingkan pemilih whitelist dan non-whitelist.',
    'HIMAFORKA FTI UAJY',
    'FTI',
    '#0F172A',
    'Hanya wallet yang tercatat pada whitelist proposal yang berhak mengikuti pemilihan.',
    2,
    'approved',
    v_now,
    v_commit_start,
    v_reveal_start,
    v_ended_at
  ) returning id into v_boundary_proposal_id;

  insert into app.admin_space_access (admin_email, proposal_draft_id)
  values
    ('novenoow@gmail.com', v_main_proposal_id),
    ('novenoow@gmail.com', v_control_proposal_id),
    ('novenoow@gmail.com', v_boundary_proposal_id)
  on conflict (admin_email, proposal_draft_id) do nothing;

  insert into app.proposal_candidates (proposal_draft_id, candidate_local_id, full_name, student_id, faculty, bio, vision, mission, sort_order)
  values
    (v_main_proposal_id, 'candidate-1', 'Alexander Prasetyo', '220711664', 'FTI / Informatika', 'Calon ketua dengan fokus penguatan kegiatan akademik dan kaderisasi.', 'Mewujudkan HIMAFORKA yang aktif, inklusif, dan terpercaya.', '["Meningkatkan program akademik", "Memperkuat komunikasi anggota", "Mendorong transparansi kegiatan"]'::jsonb, 1),
    (v_main_proposal_id, 'candidate-2', 'Maria Consiglia', '220711665', 'FTI / Informatika', 'Calon ketua dengan fokus kolaborasi dan pengembangan minat bakat.', 'Membangun HIMAFORKA sebagai ruang tumbuh mahasiswa Informatika.', '["Menyediakan forum aspirasi", "Mengembangkan komunitas belajar", "Memperluas kolaborasi eksternal"]'::jsonb, 2),
    (v_main_proposal_id, 'candidate-3', 'Budi Santoso', '220711666', 'FTI / Informatika', 'Calon ketua dengan fokus tata kelola organisasi.', 'Menjadikan HIMAFORKA tertib administrasi dan responsif terhadap anggota.', '["Merapikan dokumentasi", "Meningkatkan layanan anggota", "Menguatkan evaluasi program kerja"]'::jsonb, 3),

    (v_control_proposal_id, 'candidate-1', 'Rina Wijaya', '220711667', 'FTI / Informatika', 'Kandidat koordinator akademik.', 'Meningkatkan budaya belajar bersama.', '["Kelas diskusi rutin", "Bank materi", "Mentoring lintas angkatan"]'::jsonb, 1),
    (v_control_proposal_id, 'candidate-2', 'Christoper Reno', '230711668', 'FTI / Informatika', 'Kandidat koordinator akademik.', 'Mendorong kegiatan akademik yang praktis dan terukur.', '["Workshop teknis", "Kelompok belajar", "Evaluasi kegiatan"]'::jsonb, 2),

    (v_boundary_proposal_id, 'candidate-1', 'Sarah Putri', '230711669', 'FTI / Informatika', 'Kandidat kelompok studi keamanan siber.', 'Membangun budaya keamanan digital mahasiswa.', '["Diskusi keamanan", "Simulasi CTF", "Materi literasi keamanan"]'::jsonb, 1),
    (v_boundary_proposal_id, 'candidate-2', 'Kevin Anggara', '230711670', 'FTI / Informatika', 'Kandidat kelompok studi keamanan siber.', 'Meningkatkan kemampuan praktik keamanan aplikasi.', '["Praktikum web security", "Review studi kasus", "Kolaborasi proyek"]'::jsonb, 2);

  insert into app.proposal_whitelist_entries (proposal_draft_id, wallet_address, voter_name, source, validation_status, sync_status)
  values
    (v_main_proposal_id, '0xB8064e95d190777C16D1795aA872B259df4B8930', 'Daniel Noveno Windanu', 'manual', 'valid', 'pending'),
    (v_main_proposal_id, '0x0000000000000000000000000000000000001001', 'Alexander Prasetyo', 'manual', 'valid', 'pending'),
    (v_main_proposal_id, '0x0000000000000000000000000000000000001002', 'Maria Consiglia', 'manual', 'valid', 'pending'),
    (v_main_proposal_id, '0x0000000000000000000000000000000000001003', 'Budi Santoso', 'manual', 'valid', 'pending'),
    (v_main_proposal_id, '0x0000000000000000000000000000000000001004', 'Rina Wijaya', 'manual', 'valid', 'pending'),
    (v_main_proposal_id, '0x0000000000000000000000000000000000001005', 'Christoper Reno', 'manual', 'valid', 'pending'),
    (v_main_proposal_id, '0x0000000000000000000000000000000000001006', 'Sarah Putri', 'manual', 'valid', 'pending'),
    (v_main_proposal_id, '0x0000000000000000000000000000000000001007', 'Kevin Anggara', 'manual', 'valid', 'pending'),
    (v_main_proposal_id, '0x0000000000000000000000000000000000001008', 'Angela Florencia', 'manual', 'valid', 'pending'),
    (v_main_proposal_id, '0x0000000000000000000000000000000000001009', 'David Chen', 'manual', 'valid', 'pending'),

    (v_control_proposal_id, '0xB8064e95d190777C16D1795aA872B259df4B8930', 'Daniel Noveno Windanu', 'manual', 'valid', 'pending'),
    (v_control_proposal_id, '0x0000000000000000000000000000000000001001', 'Alexander Prasetyo', 'manual', 'valid', 'pending'),
    (v_control_proposal_id, '0x0000000000000000000000000000000000001002', 'Maria Consiglia', 'manual', 'valid', 'pending'),

    (v_boundary_proposal_id, '0xB8064e95d190777C16D1795aA872B259df4B8930', 'Daniel Noveno Windanu', 'manual', 'valid', 'pending')
  on conflict (proposal_draft_id, wallet_address) do update set
    voter_name = excluded.voter_name,
    source = excluded.source,
    validation_status = excluded.validation_status,
    sync_status = excluded.sync_status;

  insert into app.notification_jobs (target_profile_id, channel, template_key, status, payload)
  values
    (v_superadmin_profile_id, 'in_app', 'testing_proposals_ready', 'queued', jsonb_build_object(
      'title', 'Proposal uji siap deploy',
      'description', 'Seed testing menyiapkan proposal approved. Deploy hanya jika transaksi Base Sepolia benar-benar dilakukan.',
      'type', 'info',
      'link', '/superadmin'
    )),
    (v_voter_profile_id, 'in_app', 'testing_voter_ready', 'queued', jsonb_build_object(
      'title', 'Data pemilih uji tersedia',
      'description', 'Wallet Anda sudah masuk whitelist proposal utama untuk skenario pengujian.',
      'type', 'info',
      'link', '/pemilihan'
    ));

  raise notice 'VoteChain testing seed ready. commit_start=%, reveal_start=%, ended_at=%. Proposal status remains approved/off-chain.',
    v_commit_start, v_reveal_start, v_ended_at;
end $$;

-- Quick verification query:
-- select title, status, commit_start_at, reveal_start_at, ended_at, deployed_space_address, deployment_tx_hash
-- from app.proposal_drafts
-- where title in (
--   'Pemilihan Ketua HIMAFORKA FTI UAJY 2026',
--   'Pemilihan Koordinator Divisi Akademik HIMAFORKA 2026',
--   'Pemilihan Ketua Kelompok Studi Keamanan Siber HIMAFORKA 2026'
-- )
-- order by created_at desc;
