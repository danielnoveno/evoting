# B1-SUPABASE-STORAGE-BASELINE

Status: implemented

## Bucket awal
1. `space-metadata`
   - visibilitas: private
   - tujuan: metadata final space/kandidat dalam JSON
   - mime: `application/json`

2. `proof-exports`
   - visibilitas: private
   - tujuan: export bukti commit/reveal atau audit bundle
   - mime: `application/json`, `application/pdf`

## Aturan awal
- Tidak ada bucket publik.
- Akses file harus melalui signed URL atau server-only flow.
- Jangan upload file berisi `salt` atau pilihan suara mentah.
- File whitelist mentah tidak disimpan permanen di bucket publik.

## Next phase
- tambah storage policy detail
- atur signed URL TTL
- validasi antivirus/content-type jika upload user dibuka
