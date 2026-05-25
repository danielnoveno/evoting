# VoteChain Supabase Workspace

Workspace ini dipakai untuk backend off-chain VoteChain.

## Peran
- Auth/session aplikasi
- Draft proposal, kandidat, dan whitelist
- Storage file metadata/proof
- Audit log operasional
- Read model pendukung bersama Ponder

## Batas penting
- Bukan sumber kebenaran hasil voting final
- Tidak menyimpan salt commit-reveal
- Tidak menggantikan validasi whitelist/fase di smart contract

## Struktur awal
- `config.toml` — placeholder konfigurasi Supabase CLI
- `migrations/` — migrasi schema
- `seed/` — seed lokal/dev
- `functions/` — Edge Functions

## Dokumen phase
- `PHASE1-SETUP.md` — scaffold frontend + workspace
- `PHASE2-SCHEMA-RLS.md` — schema inti, baseline RLS, bucket storage
- `PHASE3-REPOSITORY-INTEGRATION.md` — repository layer frontend dan integrasi awal live data
- `PHASE4-AUTH-WHITELIST-INTEGRATION.md` — auth/session awal dan whitelist live pada admin detail
- `PHASE5-ROLE-GUARD-WHITELIST-CRUD.md` — role gate awal, whitelist CRUD dasar, dan proposal detail live read
- `PHASE6-MIDDLEWARE-WRITE-GUARD.md` — middleware session guard awal dan write live proposal draft
- `PHASE7-PROPOSAL-RELATIONS-GUARD.md` — save relasi proposal draft dan guard role-aware awal di middleware
- `PHASE8-CSV-STRUCTURED-CANDIDATES.md` — CSV whitelist dasar dan kandidat proposal terstruktur
- `PHASE9-IMPORT-JOBS-CANDIDATE-METADATA.md` — import job formal whitelist dan metadata kandidat proposal yang lebih kaya
- `PHASE10-STORAGE-HISTORY-ASSETS.md` — upload CSV ke storage, riwayat import, dan metadata asset kandidat dasar
- `PHASE11-VALIDATION-EVIDENCE.md` — signed URL artefak import dan fondasi validation/evidence pack

## Catatan
Edge Functions, policy storage detail, entity indexer penuh, dan repository fitur diimplementasikan pada phase berikutnya.
