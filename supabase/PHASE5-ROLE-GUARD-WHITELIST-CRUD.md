# B1-SUPABASE-PHASE5-ROLE-GUARD-WHITELIST-CRUD

Status: implemented

## Scope build phase 5
- Menambahkan role gate awal berbasis profile backend
- Menghubungkan shell admin/superadmin/pemilih ke guard role
- Menambahkan whitelist CRUD dasar (create/delete) di repository + hook
- Menghubungkan tambah/hapus whitelist live pada detail admin
- Menambahkan detail proposal live read pada halaman detail dan edit proposal

## File yang ditambahkan
- `frontend/src/components/auth/role-gate.tsx`
- `frontend/src/hooks/use-proposal-draft.ts`
- `supabase/PHASE5-ROLE-GUARD-WHITELIST-CRUD.md`

## File yang diubah
- `frontend/src/lib/repositories/whitelistRepository.ts`
- `frontend/src/hooks/use-whitelist-status.ts`
- `frontend/src/components/admin/admin-shell.tsx`
- `frontend/src/components/superadmin/superadmin-shell.tsx`
- `frontend/src/components/voter/voter-shell.tsx`
- `frontend/src/components/admin/admin-election-detail-view.tsx`
- `frontend/src/app/admin/daftar-proposal/[id]/page.tsx`
- `frontend/src/app/admin/daftar-proposal/[id]/edit/page.tsx`

## Perilaku baru
- Jika profile backend aktif tetapi role tidak sesuai, shell menampilkan akses ditolak dengan CTA kembali ke login.
- Admin detail whitelist sekarang bisa mencoba tambah dan hapus entry live dari Supabase.
- Jika data masih fallback lokal, aksi hapus memberi notifikasi mode transisi dan tidak memaksa operasi palsu.
- Halaman detail/edit proposal mencoba memuat data live proposal draft lebih dulu, lalu fallback aman bila belum ada.

## Validasi
- `npm run build` ✅
- `npm run typecheck` ✅

## Batas implementasi
- Guard masih berbasis client-side profile resolution, belum hard-block server-side/middleware.
- Redirect pasca-login admin/superadmin masih heuristik email, belum role query final.
- Whitelist bulk upload live belum dihubungkan.
- Commit/reveal dan state on-chain tetap belum dimigrasikan ke guard backend khusus.
