-- =============================================================================
-- VoteChain — Testing Seed (2 Bagian)
-- =============================================================================
--
-- BAGIAN 1: Voter + Activation Tokens (langsung jalan, gak butuh auth.users)
--   Jalankan: npx supabase db query --linked --file "supabase/seed/testing-fast-flow.sql"
--   Output: 15 voter aktif + 15 link aktivasi di NOTICE
--
-- BAGIAN 2: Proposal + Kandidat + Whitelist (butuh 3 akun sudah login)
--   Prasyarat: SuperAdmin, Admin, Voter sudah login minimal 1x
--   Jalankan setelah Bagian 1 + 3 akun login
--
-- CATATAN:
--   - ALLOW_TEST_VOTER_EMAILS=true di environment Supabase/Vercel
--   - Voter harus KLIK LINK AKTIVASI, bukan buka /hubungkan-dompet langsung
--   - Link aktivasi ada di output NOTICE (grep LINK)
-- =============================================================================

-- ─── 1. Seed 14 Voter Aktif ─────────────────────────────────────────────────

insert into app.master_voters (nim, full_name, email, prodi, fakultas, angkatan, wallet_address, status) values
  ('220711670', 'Voter 1',  'voter1@votein.biz.id',   'Informatika', 'FTI', '2022', '0xcdcbf9fec94d752b3534b35e89017002f53bd4da', 'active'),
  ('220711671', 'Voter 2',  'voter2@votein.biz.id',   'Informatika', 'FTI', '2022', '0x52feb17a37777242cf125a8e41d2bf7a81eb16b5', 'active'),
  ('220711672', 'Voter 3',  'voter3@votein.biz.id',   'Informatika', 'FTI', '2022', '0x736dca418049bd122e122afc98634e80e4be9218', 'active'),
  ('220711673', 'Voter 4',  'voter4@votein.biz.id',   'Informatika', 'FTI', '2022', '0x68e629a856dde25d16191dab0754b650fdbeb9a9', 'active'),
  ('220711674', 'Voter 5',  'voter5@votein.biz.id',   'Informatika', 'FTI', '2022', '0x5cb88982fcb5db2bba68fe388b61cc47732bf24a', 'active'),
  ('220711676', 'Voter 7',  'voter7@votein.biz.id',   'Informatika', 'FTI', '2023', '0xc10b7785d2c50fd962344d3a7b96b499eeb39908', 'active'),
  ('220711677', 'Voter 8',  'voter8@votein.biz.id',   'Informatika', 'FTI', '2023', '0x6508c524e7e5d2edf7a4bbfc02458c31a458d714', 'active'),
  ('220711678', 'Voter 9',  'voter9@votein.biz.id',   'Informatika', 'FTI', '2023', '0x0d1c559c1f461e96e977c682bb0a61293cd40232', 'active'),
  ('220711679', 'Voter 10', 'voter10@votein.biz.id',  'Informatika', 'FTI', '2023', '0xbf45faa0926f18aadbeb8910d97663bff65dd47a', 'active'),
  ('220711680', 'Voter 11', 'voter11@votein.biz.id',  'Informatika', 'FTI', '2023', '0xe00894e793a21549a86a0065005a293dfd89ce8f', 'active'),
  ('220711681', 'Voter 12', 'voter12@votein.biz.id',  'Informatika', 'FTI', '2023', '0xaf69d5e091376e9a2df17186a7371a4806737e9f', 'active'),
  ('220711682', 'Voter 13', 'voter13@votein.biz.id',  'Informatika', 'FTI', '2023', '0x796a4775d4e46892f875b3d68211e78eed584249', 'active'),
  ('220711683', 'Voter 14', 'voter14@votein.biz.id',  'Informatika', 'FTI', '2023', '0x0ac23d1547c5771c325b0a68807a14840db9b7a4', 'active')
on conflict (nim) do update set
  full_name   = excluded.full_name,
  email       = excluded.email,
  prodi       = excluded.prodi,
  fakultas    = excluded.fakultas,
  angkatan    = excluded.angkatan,
  wallet_address = excluded.wallet_address,
  status      = excluded.status;

-- ─── 1b. Seed Voter Tambahan (Daniel — akun pengembang) ─────────────────────
-- Email login: hipopotamuss04@gmail.com (Magic Link)
-- Email student: 220711663@students.uajy.ac.id
-- Claim endpoint cocokkan activation_tokens.email = master_voters.email,
-- jadi email di master_voters = hipopotamuss04@gmail.com.

insert into app.master_voters (nim, full_name, email, prodi, fakultas, angkatan, wallet_address, status) values
  ('2207116630', 'Daniel Noveno Windanu', 'hipopotamuss04@gmail.com', 'Informatika', 'FTI', '2022', '0xBE7032df280F40DE4Be397e12B7F894718658A2d', 'active')
on conflict (nim) do update set
  full_name      = excluded.full_name,
  email          = excluded.email,
  prodi          = excluded.prodi,
  fakultas       = excluded.fakultas,
  angkatan       = excluded.angkatan,
  wallet_address = excluded.wallet_address,
  status         = excluded.status;

-- ─── 2. Generate Activation Tokens ──────────────────────────────────────────
-- Token format: random 32 bytes → base64url (43 chars)
-- Hash: SHA-256(token) → hex
-- Claim endpoint will hash submitted token and match against token_hash.

do $$
declare
  v_now timestamptz := now();
  v_expires timestamptz := v_now + interval '7 days';
  v_origin text := coalesce(
    current_setting('app.settings.site_url', true),
    'https://votein-evoting.vercel.app'
  );

  v_voter record;
  v_token_raw text;
  v_token_hash text;
  v_activation_link text;
  v_count integer := 0;
begin
  -- Loop semua voter aktif (termasuk Gmail)
  for v_voter in
    select email, full_name
    from app.master_voters
    where status = 'active'
      and email is not null
    order by email
  loop
    -- Generate random token (32 bytes → base64url without padding)
    v_token_raw := encode(gen_random_bytes(32), 'base64');
    -- Convert standard base64 to base64url: replace + with -, / with _, remove =
    v_token_raw := replace(replace(replace(v_token_raw, '+', '-'), '/', '_'), '=', '');
    -- Compute SHA-256 hash (matches Node.js crypto.createHash('sha256').update(token).digest('hex'))
    v_token_hash := encode(digest(v_token_raw, 'sha256'), 'hex');

    -- Insert activation token
    insert into app.activation_tokens (
      token_hash, email, role, wallet_address, status, expires_at
    ) values (
      v_token_hash, v_voter.email, 'voter', null, 'pending', v_expires
    )
    on conflict (token_hash) do nothing;

    -- Build activation link and print it
    v_activation_link := v_origin || '/auth/aktivasi-voter?token=' || v_token_raw;
    v_count := v_count + 1;

    raise notice 'VOTER_ACTIVATION|%|%|%', v_voter.email, v_voter.full_name, v_activation_link;
  end loop;

  raise notice '─── % activation token siap. Cari link di atas (grep VOTER_ACTIVATION). ───', v_count;
  raise notice '─── Prasyarat: ALLOW_TEST_VOTER_EMAILS=true di environment Supabase/Vercel. ───';
end $$;

-- =============================================================================
-- BAGIAN 2: Proposal Seed (BAB IV/V/VI Evidence)
-- =============================================================================
-- PRASYARAT WAJIB: 3 akun ini sudah login minimal 1x supaya auth.users ada:
--   - dnw022003@gmail.com (SuperAdmin)
--   - novenoow@gmail.com (Admin)
--   - 220711663@students.uajy.ac.id (Voter)
-- Kalau belum login, akan muncul error.
-- =============================================================================

do $$
declare
  v_now timestamptz := now();
  v_commit_start timestamptz := v_now + interval '2 minutes';
  v_reveal_start timestamptz := v_now + interval '12 minutes';
  v_ended_at timestamptz := v_now + interval '17 minutes';

  v_superadmin_user_id uuid;
  v_admin_user_id uuid;
  v_voter_user_id uuid;
  v_superadmin_profile_id uuid;
  v_admin_profile_id uuid;
  v_voter_profile_id uuid;
  v_voter_wallet text;
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

  select lower(p.wallet_address)
  into v_voter_wallet
  from app.app_profiles p
  where p.user_id = v_voter_user_id;

  if v_voter_wallet is null then
    raise exception 'Wallet aktivasi voter belum ada di app_profiles. Login/aktivasi sebagai voter dan sambungkan dompet aktivasi, baru jalankan seed testing.';
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
    (v_voter_user_id, v_voter_wallet, 'Daniel Noveno Windanu', '220711663@students.uajy.ac.id', 'voter', 'Pemilih terdaftar')
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
    (v_voter_user_id, v_voter_wallet)
  on conflict (user_id) do update set
    wallet_address = excluded.wallet_address,
    updated_at = timezone('utc', now());

  insert into app.master_voters (nim, full_name, email, prodi, fakultas, angkatan, wallet_address, status)
  values
    -- Keep the same NIM as seed.sql/activation flow to avoid duplicate voter rows.
    ('2207116630', 'Daniel Noveno Windanu', '220711663@students.uajy.ac.id', 'Informatika', 'FTI', '2022', v_voter_wallet, 'active'),
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
    'Data uji BAB IV/V/VI untuk alur pengajuan proposal, review SuperAdmin, whitelist, commit, reveal, hasil, dan audit.',
    'HIMAFORKA FTI UAJY',
    'FTI',
    '#0F172A',
    'Satu wallet terdaftar hanya boleh melakukan satu commit dan satu reveal. Commit phase: 10 menit, Reveal phase: 5 menit.',
    3,
    'submitted',
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
    'Data uji pembanding untuk daftar proposal yang menunggu review SuperAdmin.',
    'HIMAFORKA FTI UAJY',
    'FTI',
    '#0F172A',
    'Satu pemilih hanya dapat memilih satu kandidat pada periode yang tersedia.',
    2,
    'submitted',
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
    'submitted',
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
    (v_main_proposal_id, v_voter_wallet, 'Daniel Noveno Windanu', 'manual', 'valid', 'pending'),
    (v_main_proposal_id, '0x0000000000000000000000000000000000001001', 'Alexander Prasetyo', 'manual', 'valid', 'pending'),
    (v_main_proposal_id, '0x0000000000000000000000000000000000001002', 'Maria Consiglia', 'manual', 'valid', 'pending'),
    (v_main_proposal_id, '0x0000000000000000000000000000000000001003', 'Budi Santoso', 'manual', 'valid', 'pending'),
    (v_main_proposal_id, '0x0000000000000000000000000000000000001004', 'Rina Wijaya', 'manual', 'valid', 'pending'),
    (v_main_proposal_id, '0x0000000000000000000000000000000000001005', 'Christoper Reno', 'manual', 'valid', 'pending'),
    (v_main_proposal_id, '0x0000000000000000000000000000000000001006', 'Sarah Putri', 'manual', 'valid', 'pending'),
    (v_main_proposal_id, '0x0000000000000000000000000000000000001007', 'Kevin Anggara', 'manual', 'valid', 'pending'),
    (v_main_proposal_id, '0x0000000000000000000000000000000000001008', 'Angela Florencia', 'manual', 'valid', 'pending'),
    (v_main_proposal_id, '0x0000000000000000000000000000000000001009', 'David Chen', 'manual', 'valid', 'pending'),

    (v_control_proposal_id, v_voter_wallet, 'Daniel Noveno Windanu', 'manual', 'valid', 'pending'),
    (v_control_proposal_id, '0x0000000000000000000000000000000000001001', 'Alexander Prasetyo', 'manual', 'valid', 'pending'),
    (v_control_proposal_id, '0x0000000000000000000000000000000000001002', 'Maria Consiglia', 'manual', 'valid', 'pending'),

    (v_boundary_proposal_id, v_voter_wallet, 'Daniel Noveno Windanu', 'manual', 'valid', 'pending')
  on conflict (proposal_draft_id, wallet_address) do update set
    voter_name = excluded.voter_name,
    source = excluded.source,
    validation_status = excluded.validation_status,
    sync_status = excluded.sync_status;

  insert into app.notification_jobs (target_profile_id, channel, template_key, status, payload)
  values
    (v_superadmin_profile_id, 'in_app', 'testing_proposals_ready', 'queued', jsonb_build_object(
      'title', 'Proposal uji menunggu review',
      'description', 'Seed testing menyiapkan proposal submitted. SuperAdmin perlu menyetujui sebelum deploy Base Sepolia.',
      'type', 'info',
      'link', '/superadmin'
    )),
    (v_voter_profile_id, 'in_app', 'testing_voter_ready', 'queued', jsonb_build_object(
      'title', 'Data pemilih uji tersedia',
      'description', 'Wallet Anda sudah masuk whitelist proposal utama untuk skenario pengujian.',
      'type', 'info',
      'link', '/pemilihan'
    ));

  raise notice 'VoteChain testing seed ready. commit_start=% (10 min window), reveal_start=% (5 min window), ended_at=%. Proposal status is submitted/menunggu review.',
    v_commit_start, v_reveal_start, v_ended_at;
end $$;

-- ─── 4. Verification ────────────────────────────────────────────────────────

-- Cek master_voters
-- select nim, full_name, email, wallet_address, status
-- from app.master_voters
-- where status = 'active'
-- order by email;

-- Cek activation_tokens
-- select email, token_hash, status, expires_at
-- from app.activation_tokens
-- where status = 'pending'
-- order by email;

-- Cek proposal
-- select title, status, commit_start_at, reveal_start_at, ended_at, deployed_space_address, deployment_tx_hash
-- from app.proposal_drafts
-- where title in (
--   'Pemilihan Ketua HIMAFORKA FTI UAJY 2026',
--   'Pemilihan Koordinator Divisi Akademik HIMAFORKA 2026',
--   'Pemilihan Ketua Kelompok Studi Keamanan Siber HIMAFORKA 2026'
-- )
-- order by created_at desc;
