-- =============================================================================
-- VoteChain — Seed 14 Voter (email saja, belum ada wallet)
-- =============================================================================
-- Jalankan: npx supabase db query --linked --file "supabase/seed/seed-voters-only.sql"
--
-- Yang dilakukan:
--   1. Insert 14 voter ke master_voters (status=pending, tanpa wallet)
--   2. Generate activation token per voter
--   3. Tampilkan link aktivasi sebagai tabel
--
-- Setelah ini:
--   1. Share link aktivasi ke voter
--   2. Voter klik link → Magic Link login → connect wallet → wallet baru dibuat
--   3. Status otomatis berubah ke 'active' setelah claim token
-- =============================================================================

-- ─── 1. Insert 14 Voter (tanpa wallet) ──────────────────────────────────────

INSERT INTO app.master_voters (nim, full_name, email, prodi, fakultas, angkatan, wallet_address, status) VALUES
  ('220711670', 'Voter 1',  'voter1@votein.biz.id',   'Informatika', 'FTI', '2022', NULL, 'pending'),
  ('220711671', 'Voter 2',  'voter2@votein.biz.id',   'Informatika', 'FTI', '2022', NULL, 'pending'),
  ('220711672', 'Voter 3',  'voter3@votein.biz.id',   'Informatika', 'FTI', '2022', NULL, 'pending'),
  ('220711673', 'Voter 4',  'voter4@votein.biz.id',   'Informatika', 'FTI', '2022', NULL, 'pending'),
  ('220711674', 'Voter 5',  'voter5@votein.biz.id',   'Informatika', 'FTI', '2022', NULL, 'pending'),
  ('220711676', 'Voter 7',  'voter7@votein.biz.id',   'Informatika', 'FTI', '2023', NULL, 'pending'),
  ('220711677', 'Voter 8',  'voter8@votein.biz.id',   'Informatika', 'FTI', '2023', NULL, 'pending'),
  ('220711678', 'Voter 9',  'voter9@votein.biz.id',   'Informatika', 'FTI', '2023', NULL, 'pending'),
  ('220711679', 'Voter 10', 'voter10@votein.biz.id',  'Informatika', 'FTI', '2023', NULL, 'pending'),
  ('220711680', 'Voter 11', 'voter11@votein.biz.id',  'Informatika', 'FTI', '2023', NULL, 'pending'),
  ('220711681', 'Voter 12', 'voter12@votein.biz.id',  'Informatika', 'FTI', '2023', NULL, 'pending'),
  ('220711682', 'Voter 13', 'voter13@votein.biz.id',  'Informatika', 'FTI', '2023', NULL, 'pending'),
  ('220711683', 'Voter 14', 'voter14@votein.biz.id',  'Informatika', 'FTI', '2023', NULL, 'pending')
ON CONFLICT (nim) DO UPDATE SET
  full_name      = excluded.full_name,
  email          = excluded.email,
  prodi          = excluded.prodi,
  fakultas       = excluded.fakultas,
  angkatan       = excluded.angkatan,
  wallet_address = NULL,
  status         = 'pending';

-- ─── 2. Generate Activation Tokens ──────────────────────────────────────────

DELETE FROM app.activation_tokens
WHERE email LIKE '%@votein.biz.id' AND status = 'pending';

WITH voters AS (
  SELECT email, full_name
  FROM app.master_voters
  WHERE status = 'pending'
    AND email LIKE '%@votein.biz.id'
  ORDER BY email
),
tokens AS (
  SELECT v.email, v.full_name,
    replace(replace(replace(encode(gen_random_bytes(32), 'base64'), '+', '-'), '/', '_'), '=', '') AS clean_token
  FROM voters v
),
ins AS (
  INSERT INTO app.activation_tokens (token_hash, email, role, status, expires_at)
  SELECT encode(digest(clean_token, 'sha256'), 'hex'), email, 'voter', 'pending', now() + interval '7 days'
  FROM tokens
  RETURNING 1
)
SELECT full_name AS "Nama", email AS "Email",
  'https://votein-evoting.vercel.app/auth/aktivasi-voter?token=' || clean_token AS "Link Aktivasi"
FROM tokens ORDER BY email;
