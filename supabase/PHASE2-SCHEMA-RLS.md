# B1-SUPABASE-PHASE2-SCHEMA-RLS

Status: implemented

## Scope build phase 2
- Menambahkan schema inti `app` dan `indexer`
- Menambahkan enum, tabel, trigger `updated_at`, dan index awal
- Menambahkan baseline RLS
- Menambahkan bucket storage private
- Menambahkan seed status sinkronisasi indexer

## File yang ditambahkan
- `supabase/migrations/20260521T120000_build_phase2_core_schema.sql`
- `supabase/seed/seed.sql`
- `supabase/RLS-BASELINE.md`
- `supabase/STORAGE-BASELINE.md`

## Tabel inti
- `app.app_profiles`
- `app.proposal_drafts`
- `app.proposal_candidates`
- `app.whitelist_import_jobs`
- `app.proposal_whitelist_entries`
- `app.space_metadata_versions`
- `app.space_registry_map`
- `app.tx_audit_log`
- `app.proof_exports`
- `app.ops_audit_log`
- `app.notification_jobs`
- `indexer.indexer_sync_status`

## Batas implementasi
- Belum ada entity Ponder penuh (`chain_events`, `space_voter_states`, dll.)
- Belum ada edge function
- Belum ada storage policy per-path
- `database.types.ts` frontend belum digenerate dari schema final
- Belum ada repository layer fitur yang memakai tabel baru

## Validasi yang masih pending
- Apply migration ke Supabase lokal/cloud
- Uji bootstrap super admin
- Uji matrix RLS nyata dengan user authenticated
- Uji signed URL flow untuk storage
