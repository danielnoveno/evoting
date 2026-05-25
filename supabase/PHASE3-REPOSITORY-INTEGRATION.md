# B1-SUPABASE-PHASE3-REPOSITORY-INTEGRATION

Status: implemented

## Scope build phase 3
- Menambahkan repository layer frontend untuk profile, proposal, dan whitelist
- Menambahkan mapper dari row Supabase ke view model UI
- Menambahkan hooks React Query untuk data backend awal
- Mengintegrasikan halaman admin proposal dan halaman profil awal ke repository baru
- Menjaga fallback aman ke data transisi bila backend/sesi belum siap

## File yang ditambahkan
- `frontend/src/lib/repositories/types.ts`
- `frontend/src/lib/repositories/errors.ts`
- `frontend/src/lib/repositories/profileRepository.ts`
- `frontend/src/lib/repositories/proposalRepository.ts`
- `frontend/src/lib/repositories/whitelistRepository.ts`
- `frontend/src/lib/mappers/profileMapper.ts`
- `frontend/src/lib/mappers/proposalMapper.ts`
- `frontend/src/hooks/use-profile.ts`
- `frontend/src/hooks/use-admin-proposal-list.ts`
- `frontend/src/hooks/use-whitelist-status.ts`

## File yang diubah
- `frontend/src/lib/supabase/database.types.ts`
- `frontend/src/app/admin/daftar-proposal/page.tsx`
- `frontend/src/app/admin/profil/page.tsx`
- `frontend/src/app/pemilih/profil/page.tsx`

## Perilaku baru
- Halaman proposal admin mencoba memuat daftar proposal dari Supabase lebih dulu.
- Jika backend belum aktif atau sesi belum tersedia, halaman proposal tetap aman dengan fallback dummy.
- Halaman profil admin dan pemilih mencoba resolve profil live berdasarkan wallet address.
- Simpan profil mencoba upsert ke Supabase; jika gagal, UI menampilkan pesan Indonesia yang aman.

## Validasi
- `npm run build` ✅
- `npm run typecheck` ✅

## Batas implementasi
- Belum ada migrasi penuh halaman voting/commit/reveal ke live backend
- Whitelist hook baru tersedia, tetapi belum dipasang ke halaman admin detail
- Upsert profil live masih bergantung pada sesi auth Supabase yang valid
- `database.types.ts` masih manual, belum auto-generated dari schema final
