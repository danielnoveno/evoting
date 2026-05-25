# B1-SUPABASE-PHASE10-STORAGE-HISTORY-ASSETS

Status: implemented

## Scope build phase 10
- Menambahkan upload CSV whitelist ke Supabase Storage bucket private sebelum import bulk diproses
- Menambahkan pembacaan riwayat import whitelist pada panel admin
- Menambahkan metadata asset kandidat dasar (`avatarPath`) ke form proposal dan persistence draft
- Menjaga agar semua artefak upload tetap diposisikan sebagai bukti operasional off-chain, bukan sumber kebenaran voting

## File yang ditambahkan
- `frontend/src/hooks/use-whitelist-import-jobs.ts`
- `supabase/PHASE10-STORAGE-HISTORY-ASSETS.md`

## File yang diubah
- `frontend/src/lib/repositories/types.ts`
- `frontend/src/lib/supabase/database.types.ts`
- `frontend/src/lib/repositories/proposalRepository.ts`
- `frontend/src/lib/repositories/whitelistRepository.ts`
- `frontend/src/components/admin/proposal-form.tsx`
- `frontend/src/components/admin/admin-election-detail-view.tsx`
- `frontend/src/app/admin/daftar-proposal/[id]/page.tsx`
- `frontend/src/app/admin/daftar-proposal/[id]/edit/page.tsx`
- `supabase/README.md`

## Perilaku baru
- CSV whitelist yang diproses bulk sekarang diunggah dulu ke bucket private `proof-exports`, lalu dicatat pada `whitelist_import_jobs`.
- Panel admin detail menampilkan ringkasan riwayat import CSV terbaru.
- Proposal kandidat sekarang bisa menyimpan `avatarPath` sebagai metadata asset dasar.

## Validasi
- `npm run build` ✅
- `npm run typecheck` ✅

## Batas implementasi
- Upload CSV masih berasal dari isi teks/paste, belum file picker penuh.
- Riwayat import baru tampil ringkas, belum ada halaman audit/detail job lengkap.
- Asset kandidat masih metadata path, belum upload file avatar sungguhan ke storage.
