# Supabase Backend

Folder ini berisi konfigurasi dan skrip untuk layanan backend **Supabase** yang mendukung aplikasi Votein.

## Isi Direktori
- `migrations/` — Definisi skema database PostgreSQL dan kebijakan akses (RLS).
- `seed/` — Data awal untuk inisialisasi environment pengembangan.
- `scripts/` — Skrip manual/destruktif, tidak dijalankan otomatis oleh migrasi.
- `functions/` — (Opsional) Edge Functions untuk logika serverless tambahan.
- `config.toml` — Konfigurasi lokal untuk CLI Supabase.
