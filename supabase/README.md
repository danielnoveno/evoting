# Supabase Backend

Folder ini berisi konfigurasi dan skrip untuk layanan backend **Supabase** yang mendukung aplikasi Votein.

## Isi Direktori
- `migrations/` — Definisi skema database PostgreSQL dan kebijakan akses (RLS).
- `seed/` — Data awal untuk inisialisasi environment pengembangan.
- `scripts/` — Skrip manual/destruktif, tidak dijalankan otomatis oleh migrasi.
- `functions/` — (Opsional) Edge Functions untuk logika serverless tambahan.
- `config.toml` — Konfigurasi lokal untuk CLI Supabase.

## Seed pengujian cepat

Untuk menyiapkan data BAB IV/V/VI tanpa mengisi form berulang, jalankan:

```sql
\i supabase/seed/testing-fast-flow.sql
```

Syarat: akun SuperAdmin (`dnw022003@gmail.com`), Admin (`novenoow@gmail.com`), dan Voter (`220711663@students.uajy.ac.id`) sudah pernah login agar baris `auth.users` tersedia.

Seed ini hanya membuat data off-chain berstatus `approved`/siap deploy. Jangan memakai seed ini sebagai bukti transaksi Base Sepolia sebelum ada `tx_hash` dan alamat kontrak nyata.
