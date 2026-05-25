# DOC-SUPABASE-EVIDENCE-PACK

Status: draft

## Tujuan
Dokumen ini mengikat implementasi backend Supabase dengan bukti yang dapat dipakai untuk BAB IV/V.

## Artefak teknis minimum
- `B1-SUPABASE-PHASE1-SETUP`
- `B1-SUPABASE-PHASE2-SCHEMA-RLS`
- `B1-SUPABASE-PHASE3-REPOSITORY-INTEGRATION`
- `B1-SUPABASE-PHASE4-AUTH-WHITELIST-INTEGRATION`
- `B1-SUPABASE-PHASE5-ROLE-GUARD-WHITELIST-CRUD`
- `B1-SUPABASE-PHASE6-MIDDLEWARE-WRITE-GUARD`
- `B1-SUPABASE-PHASE7-PROPOSAL-RELATIONS-GUARD`
- `B1-SUPABASE-PHASE8-CSV-STRUCTURED-CANDIDATES`
- `B1-SUPABASE-PHASE9-IMPORT-JOBS-CANDIDATE-METADATA`
- `B1-SUPABASE-PHASE10-STORAGE-HISTORY-ASSETS`
- `B1-SUPABASE-PHASE11-VALIDATION-EVIDENCE`

## Bukti yang harus dikumpulkan manual
1. Screenshot login dan route guard
2. Screenshot create/edit proposal live
3. Screenshot whitelist import history
4. Screenshot storage object private + signed URL test
5. Export row `whitelist_import_jobs`
6. Export row `proposal_drafts`, `proposal_candidates`, `proposal_whitelist_entries`
7. Catatan hasil validasi terhadap RLS dan route access

## Klaim yang aman ditulis
- Supabase dipakai sebagai backend off-chain pendukung
- Proposal draft, kandidat, whitelist draft, dan import job telah diimplementasikan di layer aplikasi
- Artefak CSV disimpan di storage private dan diakses melalui signed URL sementara

## Klaim yang harus dibatasi
- Validitas operasional penuh hanya setelah uji Supabase nyata selesai
- Whitelist draft bukan whitelist voting final on-chain
- Workflow backend belum menggantikan pembuktian publik Basescan
