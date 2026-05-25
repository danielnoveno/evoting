# B1-SUPABASE-PHASE9-IMPORT-JOBS-CANDIDATE-METADATA

Status: implemented

## Scope build phase 9
- Menambahkan pencatatan formal `whitelist_import_jobs` saat ingest CSV bulk dijalankan
- Menambah metadata kandidat proposal yang lebih kaya pada form draft
- Menghubungkan pembacaan metadata kandidat live ke halaman detail/edit proposal
- Mendokumentasikan posisi upload file sungguhan sebagai langkah lanjutan, bukan klaim implementasi selesai

## File yang ditambahkan
- `supabase/PHASE9-IMPORT-JOBS-CANDIDATE-METADATA.md`

## File yang diubah
- `frontend/src/lib/repositories/types.ts`
- `frontend/src/lib/supabase/database.types.ts`
- `frontend/src/lib/repositories/proposalRepository.ts`
- `frontend/src/lib/repositories/whitelistRepository.ts`
- `frontend/src/lib/whitelist-csv.ts`
- `frontend/src/hooks/use-whitelist-status.ts`
- `frontend/src/components/admin/proposal-form.tsx`
- `frontend/src/components/admin/admin-election-detail-view.tsx`
- `frontend/src/app/admin/daftar-proposal/[id]/page.tsx`
- `frontend/src/app/admin/daftar-proposal/[id]/edit/page.tsx`

## Perilaku baru
- Bulk ingest CSV whitelist sekarang mencatat satu baris `whitelist_import_jobs` sebelum entry dimasukkan ke `proposal_whitelist_entries`.
- Kandidat proposal kini dapat menyimpan metadata tambahan: `faculty`, `bio`, dan `vision`.
- Detail/edit proposal akan mencoba mengisi ulang metadata kandidat live ke form ketika relasi tersedia.

## Validasi
- `npm run build` ✅
- `npm run typecheck` ✅

## Batas implementasi
- Upload file sungguhan ke Supabase Storage belum diaktifkan; phase ini baru mencatat metadata impor (`fileName`, `filePath`) untuk workflow formal.
- `whitelist_import_jobs` belum punya dashboard/history khusus.
- Metadata kandidat belum mencakup `mission`, `avatar_path`, dan alur upload asset kandidat.
