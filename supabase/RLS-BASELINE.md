# V2-SUPABASE-RLS-BASELINE

Status: implemented

## Prinsip
- Deny-by-default melalui Row Level Security
- Voting authority tetap on-chain
- Supabase hanya menyimpan data pendukung operasional
- `salt` dan plain vote tidak masuk database

## Schema
- `app` — data aplikasi dan operasional admin/voter
- `indexer` — data proyeksi event Ponder

## Role matrix ringkas
| Role | Hak inti |
|---|---|
| `voter` | baca/update profil sendiri, baca bukti sendiri, baca notifikasi sendiri |
| `platform_admin` | kelola proposal, kandidat, whitelist draft, baca audit/ops yang relevan |
| `super_admin` | semua hak admin + oversight lintas proposal |
| service role | hanya server-side, tidak boleh diekspos ke browser |

## Kebijakan inti yang diterapkan
- `app_profiles`: self access + admin oversight
- `proposal_drafts`: owner draft atau admin/super admin
- `proposal_candidates`: mengikuti parent draft
- `whitelist_import_jobs`: mengikuti parent draft
- `proposal_whitelist_entries`: mengikuti parent draft
- `space_metadata_versions`: select/insert untuk owner draft atau admin
- `space_registry_map`: select owner/admin; write tetap server-only pada phase berikutnya
- `tx_audit_log`: voter hanya lihat tx miliknya; admin bisa oversight
- `proof_exports`: owner proof atau admin
- `ops_audit_log`: admin only
- `notification_jobs`: target profile atau admin
- `indexer_sync_status`: authenticated read-only

## Hal yang sengaja belum dibuka di client
- write ke `space_registry_map`
- write ke `ops_audit_log`
- write ke `notification_jobs`
- write ke `indexer.indexer_sync_status`

Semua write di atas nanti lewat server action / edge function / ingest worker.

## Residual risk
- Mapping `wallet_address` ke `auth.users` masih perlu disiplin provisioning pada phase berikutnya.
- Policy admin masih bertumpu pada `app_profiles.role`, sehingga bootstrap super admin pertama harus dilakukan aman di server-only path.
- Bucket storage policy detail belum dibuat; baru bucket baseline.
