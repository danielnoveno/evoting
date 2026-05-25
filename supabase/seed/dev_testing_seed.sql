-- ============================================================
-- DEVELOPER TESTING SEED
-- ============================================================
-- OPSI A (GOD MODE): Buat user baru dari nol tanpa perlu login.
-- OPSI B (DYNAMIC): Pakai user yang sudah ada (sudah pernah login).
-- Jalankan salah satu blok di bawah ini di SQL Editor Supabase.
-- ============================================================


-- ============================================================
-- OPSI A — GOD MODE: BUAT USER & PROFIL DARI NOL
-- ============================================================
-- Cocok dipakai saat user belum terdaftar sama sekali.
-- Jalankan blok ini jika login pertama belum dilakukan.
-- ============================================================

-- 1. HAPUS DATA LAMA BIAR BERSIH
DELETE FROM app.app_profiles WHERE email = '220711663@students.uajy.ac.id';
DELETE FROM auth.users       WHERE email = '220711663@students.uajy.ac.id';

-- 2. PAKSA BUAT USER DAN PROFIL (GOD MODE)
DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
BEGIN
  -- Insert ke Tabel Autentikasi
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, is_super_admin
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    '220711663@students.uajy.ac.id',
    crypt('PasswordBaru123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Dev User"}',
    now(), now(), '', '', '', false
  );

  -- Insert ke Tabel Profil Aplikasi sebagai Super Admin
  INSERT INTO app.app_profiles (user_id, wallet_address, display_name, email, role, role_hint)
  VALUES (
    v_user_id,
    '0x1234567890123456789012345678901234567890',
    'Dev Super Admin',
    '220711663@students.uajy.ac.id',
    'super_admin',
    'Developer God Mode'
  );

  RAISE NOTICE '[GOD MODE] User dan profil berhasil dibuat dengan ID: %', v_user_id;
END $$;


-- ============================================================
-- OPSI B — DYNAMIC: PAKAI USER YANG SUDAH ADA
-- ============================================================
-- Cocok dipakai jika sudah pernah login ke aplikasi sekali.
-- Uncomment blok di bawah ini jika ingin menggunakan Opsi B.
-- ============================================================

/*
DO $$
DECLARE
    target_email TEXT := '220711663@students.uajy.ac.id';
    v_user_id UUID;
BEGIN
    -- 1. Ambil User ID asli dari tabel auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = target_email;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User dengan email % tidak ditemukan di tabel auth.users. Silakan LOGIN dulu di aplikasi web Anda.', target_email;
    END IF;

    -- 2. Berikan Role Super Admin ke Profil Anda
    INSERT INTO app.app_profiles (user_id, wallet_address, display_name, email, role, role_hint)
    VALUES (
        v_user_id,
        '0x1234567890123456789012345678901234567890',
        'Dev Super Admin',
        target_email,
        'super_admin',
        'Developer God Mode'
    )
    ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

    -- 3. Masukkan Data Proposal Testing
    INSERT INTO app.proposal_drafts (id, created_by, title, organization_name, description, candidate_count, status, commit_start_at, reveal_start_at, ended_at)
    VALUES
      (
        'prop-draft-001',
        v_user_id,
        'Pemilihan Ketua BEM 2024',
        'Universitas Atma Jaya Yogyakarta',
        'Pemilihan pimpinan mahasiswa tingkat universitas berbasis blockchain.',
        2,
        'draft',
        now() + interval '1 day',
        now() + interval '8 days',
        now() + interval '10 days'
      ),
      (
        'prop-deployed-003',
        v_user_id,
        'HMPS Informatika',
        'HMPS Informatika',
        'Pemilihan ketua himpunan program studi.',
        2,
        'deployed',
        now() - interval '10 days',
        now() - interval '3 days',
        now() + interval '2 days'
      )
    ON CONFLICT (id) DO NOTHING;

    -- 4. Tambah Kandidat untuk pemilihan yang sudah deployed
    INSERT INTO app.proposal_candidates (proposal_draft_id, candidate_local_id, full_name, student_id, faculty, vision, sort_order)
    VALUES
      ('prop-deployed-003', 'candidate-1', 'Budi Santoso', '200710123', 'FTI', 'Inovasi Blockchain.', 0),
      ('prop-deployed-003', 'candidate-2', 'Siti Aminah', '200710456', 'FTI', 'Transparansi Digital.', 1)
    ON CONFLICT (proposal_draft_id, candidate_local_id) DO NOTHING;

    -- 5. Tambah Mapping Registry (Agar muncul di UI Pemilih)
    INSERT INTO app.space_registry_map (proposal_draft_id, chain_id, onchain_proposal_id, space_id, registry_address, space_address, owner_wallet)
    VALUES (
        'prop-deployed-003',
        84532,
        1,
        1,
        '0xa91568d64d24d42Ec1Cd10C20B2F9D8d341250D0',
        '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        '0x1234567890123456789012345678901234567890'
    )
    ON CONFLICT (proposal_draft_id) DO NOTHING;

    -- 6. Tambah Log Audit Palsu
    INSERT INTO app.tx_audit_log (wallet_address, action_type, tx_hash, block_number, status, metadata)
    VALUES
      ('0xAbC...', 'commit_vote', '0xhash1...', 21551000, 'confirmed', '{"space": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"}'),
      ('0xDef...', 'reveal_vote', '0xhash2...', 21551500, 'confirmed', '{"candidateId": 1, "space": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"}')
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE '[DYNAMIC] Seed berhasil dieksekusi untuk user: %', target_email;
END $$;
*/
