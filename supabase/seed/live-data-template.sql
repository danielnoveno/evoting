-- VoteChain live-data template untuk mengganti tampilan dummy.
-- Jalankan di Supabase SQL Editor setelah mengganti nilai TODO_* dengan data nyata.
-- Catatan: jangan isi tx_hash/alamat kontrak jika belum ada transaksi Base Sepolia yang benar.

do $$
declare
  v_admin_user_id uuid := '00000000-0000-0000-0000-000000000000'; -- TODO: auth.users.id admin yang sudah login
  v_admin_profile_id uuid;
  v_proposal_id uuid;
begin
  if v_admin_user_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'Ganti v_admin_user_id dengan auth.users.id admin nyata sebelum menjalankan seed.';
  end if;

  insert into app.app_profiles (user_id, wallet_address, display_name, email, role, role_hint)
  values (
    v_admin_user_id,
    '0x1111111111111111111111111111111111111111', -- TODO: wallet admin nyata
    'Admin HIMAFORKA',                            -- TODO
    'admin.himaforka@uajy.ac.id',                 -- TODO
    'admin',
    'Organisasi mahasiswa'
  )
  on conflict (user_id) do update set
    wallet_address = excluded.wallet_address,
    display_name = excluded.display_name,
    email = excluded.email,
    role = excluded.role,
    role_hint = excluded.role_hint
  returning id into v_admin_profile_id;

  insert into app.proposal_drafts (
    created_by,
    title,
    description,
    organization_name,
    rules_text,
    candidate_count,
    status,
    commit_start_at,
    reveal_start_at,
    ended_at
  ) values (
    v_admin_profile_id,
    'Pemilihan Ketua HIMAFORKA 2026', -- TODO
    'Pemilihan internal organisasi mahasiswa dengan alur commit-reveal.', -- TODO
    'HIMAFORKA FTI UAJY', -- TODO
    'Satu wallet hanya boleh melakukan satu commit dan satu reveal.',
    2,
    'approved', -- gunakan deployed hanya setelah deployed_space_address dan tx nyata tersedia
    timezone('utc', now()) + interval '1 day',
    timezone('utc', now()) + interval '3 days',
    timezone('utc', now()) + interval '5 days'
  )
  returning id into v_proposal_id;

  insert into app.proposal_candidates (
    proposal_draft_id,
    candidate_local_id,
    full_name,
    student_id,
    faculty,
    bio,
    vision,
    mission,
    sort_order
  ) values
    (v_proposal_id, 'candidate-1', 'Nama Kandidat 1', 'TODO-NPM-1', 'TODO-Fakultas/Prodi', 'Bio kandidat 1.', 'Visi kandidat 1.', '["Misi kandidat 1"]'::jsonb, 1),
    (v_proposal_id, 'candidate-2', 'Nama Kandidat 2', 'TODO-NPM-2', 'TODO-Fakultas/Prodi', 'Bio kandidat 2.', 'Visi kandidat 2.', '["Misi kandidat 2"]'::jsonb, 2);

  insert into app.proposal_whitelist_entries (
    proposal_draft_id,
    wallet_address,
    voter_name,
    source,
    validation_status,
    sync_status
  ) values
    (v_proposal_id, '0x2222222222222222222222222222222222222222', 'Pemilih 1', 'manual', 'valid', 'pending'),
    (v_proposal_id, '0x3333333333333333333333333333333333333333', 'Pemilih 2', 'manual', 'valid', 'pending')
  on conflict (proposal_draft_id, wallet_address) do update set
    voter_name = excluded.voter_name,
    validation_status = excluded.validation_status,
    sync_status = excluded.sync_status;

  insert into app.notification_jobs (channel, template_key, status, payload)
  values (
    'in_app',
    'proposal_ready',
    'queued',
    jsonb_build_object(
      'title', 'Pemilihan tersedia',
      'description', 'Data pemilihan sudah dimuat dari Supabase. Hubungkan wallet untuk melihat hak akses.',
      'type', 'info',
      'link', '/pemilihan/' || v_proposal_id || '/hasil'
    )
  );
end $$;

-- Setelah contract benar-benar dideploy di Base Sepolia, jalankan UPDATE ini dengan nilai nyata:
-- update app.proposal_drafts
-- set status = 'deployed',
--     deployed_space_id = TODO_SPACE_ID,
--     deployed_space_address = '0xTODO_CONTRACT_ADDRESS_40_HEX',
--     deployment_tx_hash = '0xTODO_DEPLOYMENT_TX_HASH_64_HEX'
-- where id = 'TODO_PROPOSAL_ID';

-- Jika ingin public page dapat membaca data tanpa login, jalankan policy berikut sesuai kebutuhan demo publik:
drop policy if exists "proposal_drafts_select_public_approved" on app.proposal_drafts;
create policy "proposal_drafts_select_public_approved"
on app.proposal_drafts
for select
using (status in ('approved', 'deployed', 'archived'));

drop policy if exists "proposal_candidates_select_public_parent_approved" on app.proposal_candidates;
create policy "proposal_candidates_select_public_parent_approved"
on app.proposal_candidates
for select
using (
  exists (
    select 1 from app.proposal_drafts d
    where d.id = proposal_draft_id
      and d.status in ('approved', 'deployed', 'archived')
  )
);

drop policy if exists "whitelist_entries_select_public_count_source" on app.proposal_whitelist_entries;
create policy "whitelist_entries_select_public_count_source"
on app.proposal_whitelist_entries
for select
using (
  exists (
    select 1 from app.proposal_drafts d
    where d.id = proposal_draft_id
      and d.status in ('approved', 'deployed', 'archived')
  )
);

drop policy if exists "tx_audit_log_select_public_success" on app.tx_audit_log;
create policy "tx_audit_log_select_public_success"
on app.tx_audit_log
for select
using (status = 'success');

drop policy if exists "notification_jobs_select_public_broadcast" on app.notification_jobs;
create policy "notification_jobs_select_public_broadcast"
on app.notification_jobs
for select
using (channel = 'in_app' and target_profile_id is null and target_wallet is null and status in ('queued', 'sent'));
