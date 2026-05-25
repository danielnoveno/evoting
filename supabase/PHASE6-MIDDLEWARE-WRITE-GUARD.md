# B1-SUPABASE-PHASE6-MIDDLEWARE-WRITE-GUARD

Status: implemented

## Scope build phase 6
- Menambahkan proteksi middleware awal berbasis session untuk area admin/superadmin/pemilih
- Menambahkan write live proposal draft pada form tambah/edit proposal
- Menambahkan hook save proposal draft dan repository upsert proposal
- Menjaga fallback aman bila backend belum dikonfigurasi atau sesi belum tersedia

## File yang ditambahkan
- `frontend/src/hooks/use-save-proposal-draft.ts`
- `supabase/PHASE6-MIDDLEWARE-WRITE-GUARD.md`

## File yang diubah
- `frontend/middleware.ts`
- `frontend/src/lib/supabase/middleware.ts`
- `frontend/src/lib/repositories/types.ts`
- `frontend/src/lib/repositories/proposalRepository.ts`
- `frontend/src/components/admin/proposal-form.tsx`
- `frontend/src/app/admin/daftar-proposal/tambah/page.tsx`
- `frontend/src/app/admin/daftar-proposal/[id]/edit/page.tsx`

## Perilaku baru
- Jika backend Supabase aktif dan user belum punya session, route `/admin`, `/superadmin`, dan `/pemilih` akan diarahkan ke `/hubungkan-dompet` melalui middleware.
- Form tambah/edit proposal sekarang mencoba menyimpan draft live ke tabel `app.proposal_drafts`.
- Jika sesi admin belum aktif atau backend belum siap, user mendapat error Indonesia yang aman.

## Validasi
- `npm run build` ✅
- `npm run typecheck` ✅

## Batas implementasi
- Middleware baru mengecek keberadaan session, belum memvalidasi role per path di sisi server.
- Save proposal baru menulis draft inti; kandidat, whitelist, dan metadata version belum ikut tersimpan penuh dari form ini.
- Commit/reveal dan guard fase voting tetap belum memakai proteksi backend server-side khusus.
