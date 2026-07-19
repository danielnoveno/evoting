-- =============================================================================
-- VoteChain — Testing Seed: 14 Voter Aktif + Activation Tokens
-- =============================================================================
-- Jalankan setelah migration:
--   npx supabase db query --linked --file "supabase/seed/testing-fast-flow.sql"
--
-- Output:
--   - 14 voter Inserted ke master_voters (status=active, wallet=real smart wallet)
--   - 14 activation token dibuat (hash tersimpan di activation_tokens)
--   - Plain token ditampilkan di NOTICE → copy link aktivasi dari situ
--
-- Prasyarat:
--   1. ALLOW_TEST_VOTER_EMAILS=true di Vercel/Supabase (agar @votein.biz.id lolos validasi)
--   2. Voter login 1x via Magic Link → auth.users terbentuk → profile auto-upsert
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
    'https://votein.biz.id'
  );

  v_voter record;
  v_token_raw text;
  v_token_hash text;
  v_activation_link text;
begin
  for v_voter in
    select email, full_name
    from app.master_voters
    where email like '%@votein.biz.id'
      and status = 'active'
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

    raise notice 'VOTER_ACTIVATION|%|%|%', v_voter.email, v_voter.full_name, v_activation_link;
  end loop;

  raise notice '─── 14 activation token siap. Cari link di atas (grep VOTER_ACTIVATION). ───';
  raise notice '─── Prasyarat: ALLOW_TEST_VOTER_EMAILS=true di environment Supabase/Vercel. ───';
end $$;

-- ─── 3. Verification ────────────────────────────────────────────────────────

-- Cek master_voters
-- select nim, full_name, email, wallet_address, status
-- from app.master_voters
-- where email like '%@votein.biz.id'
-- order by email;

-- Cek activation_tokens (hash saja, plain token hanya di NOTICE)
-- select email, token_hash, status, expires_at
-- from app.activation_tokens
-- where email like '%@votein.biz.id'
-- order by email;
