# B1-SUPABASE-PHASE4-AUTH-WHITELIST-INTEGRATION

Status: implemented

## Scope build phase 4
- Menambahkan hook sesi/auth Supabase berbasis email-password
- Menambahkan repository auth browser-side
- Menghubungkan login kampus ke Supabase bila backend tersedia
- Menghubungkan logout shell ke `supabase.auth.signOut()`
- Menambahkan integrasi awal whitelist live pada detail admin dengan fallback aman

## File yang ditambahkan
- `frontend/src/lib/repositories/authRepository.ts`
- `frontend/src/hooks/use-auth-session.ts`

## File yang diubah
- `frontend/src/components/dashboard/console-shell.tsx`
- `frontend/src/components/voter/voter-shell.tsx`
- `frontend/src/app/hubungkan-dompet/page.tsx`
- `frontend/src/components/admin/admin-election-detail-view.tsx`

## Perilaku baru
- Login kampus mencoba autentikasi ke Supabase lebih dulu jika env backend tersedia.
- Jika backend belum dikonfigurasi, login tetap fallback ke mode transisi lokal.
- Logout admin/superadmin/pemilih mencoba mengakhiri sesi Supabase.
- Halaman detail admin mencoba memuat whitelist live dari Supabase; jika belum ada, tetap memakai fallback lokal.

## Validasi
- `npm run build` ✅
- `npm run typecheck` ✅

## Batas implementasi
- Role redirect pasca-login masih memakai heuristik email (`admin` / `superadmin`) dan belum memakai role query final dari DB.
- Smart wallet login masih simulasi UI, belum memakai provider wallet produksi.
- Whitelist live saat ini masih read-oriented; tambah/hapus live belum diaktifkan.
- Guard route berbasis session+role penuh belum diterapkan di middleware/page protection.
