# B1-SUPABASE-PHASE7-PROPOSAL-RELATIONS-GUARD

Status: implemented

## Scope build phase 7
- Menyimpan relasi proposal draft untuk kandidat dan whitelist dari frontend
- Menambahkan hook pembacaan relasi proposal (`proposal_candidates`, `proposal_whitelist_entries`)
- Menguatkan middleware dengan role-aware redirect awal berbasis `app_profiles.role`
- Menampilkan relasi live kandidat/whitelist pada detail dan edit proposal bila tersedia

## File yang ditambahkan
- `frontend/src/hooks/use-proposal-relations.ts`
- `supabase/PHASE7-PROPOSAL-RELATIONS-GUARD.md`

## File yang diubah
- `frontend/src/lib/repositories/types.ts`
- `frontend/src/lib/repositories/proposalRepository.ts`
- `frontend/src/lib/supabase/database.types.ts`
- `frontend/src/components/admin/proposal-form.tsx`
- `frontend/src/lib/supabase/middleware.ts`
- `frontend/src/app/admin/daftar-proposal/[id]/page.tsx`
- `frontend/src/app/admin/daftar-proposal/[id]/edit/page.tsx`

## Perilaku baru
- Form proposal sekarang bisa menyimpan nama kandidat dan daftar wallet whitelist dasar dari textarea multi-baris.
- Simpan proposal akan melakukan upsert draft inti, lalu sinkronisasi relasi kandidat dan whitelist draft.
- Middleware bukan hanya mengecek session, tetapi juga mencoba membaca role profile backend untuk route admin/superadmin.
- Halaman detail/edit proposal mencoba memuat relasi live dan menampilkannya ke form jika tersedia.

## Validasi
- `npm run build` ✅
- `npm run typecheck` ✅

## Batas implementasi
- Relasi kandidat masih minimal (nama + student id placeholder), belum seluruh bio/visi/misi.
- Whitelist draft masih berbasis textarea, belum CSV live parsing pada form proposal.
- Middleware role-aware masih redirect sederhana ke login dan belum memberi route recovery yang lebih kaya.
- Validasi on-chain untuk whitelist efektif tetap belum terhubung dari form ini.
