-- =============================================================================
-- VoteChain — Generate Activation Tokens (SELECT output)
-- =============================================================================
-- Jalankan di Supabase Dashboard → SQL Editor
-- Hasil langsung muncul sebagai tabel
-- =============================================================================

-- Hapus token lama yang belum dipakai
DELETE FROM app.activation_tokens
WHERE email LIKE '%@votein.biz.id'
  AND status = 'pending';

-- Generate token baru + tampilkan sebagai tabel
WITH voters AS (
  SELECT email, full_name
  FROM app.master_voters
  WHERE status = 'active'
    AND email IS NOT NULL
    AND email LIKE '%@votein.biz.id'
  ORDER BY email
),
tokens AS (
  SELECT
    v.email,
    v.full_name,
    encode(gen_random_bytes(32), 'base64') AS raw_token
  FROM voters v
),
hashed AS (
  SELECT
    email,
    full_name,
    raw_token,
    replace(replace(replace(raw_token, '+', '-'), '/', '_'), '=', '') AS clean_token
  FROM tokens
),
inserted AS (
  INSERT INTO app.activation_tokens (token_hash, email, role, status, expires_at)
  SELECT
    encode(digest(clean_token, 'sha256'), 'hex'),
    email,
    'voter',
    'pending',
    now() + interval '7 days'
  FROM hashed
  RETURNING token_hash, email
)
SELECT
  h.full_name AS "Nama",
  h.email AS "Email Login",
  'https://votein-evoting.vercel.app/auth/aktivasi-voter?token=' || h.clean_token AS "Link Aktivasi"
FROM hashed h
ORDER BY h.email;
