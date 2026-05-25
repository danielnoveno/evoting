# B1-SUPABASE-PHASE8-CSV-STRUCTURED-CANDIDATES

Status: implemented

## Scope build phase 8
- Menambahkan parser CSV sederhana untuk whitelist
- Menambahkan bulk ingest whitelist dari modal admin detail
- Mengubah input kandidat proposal dari textarea polos menjadi form kandidat terstruktur
- Memperluas save proposal draft agar menyimpan relasi kandidat dan whitelist draft dengan bentuk yang lebih rapi

## File yang ditambahkan
- `frontend/src/lib/whitelist-csv.ts`
- `supabase/PHASE8-CSV-STRUCTURED-CANDIDATES.md`

## File yang diubah
- `frontend/src/lib/repositories/whitelistRepository.ts`
- `frontend/src/hooks/use-whitelist-status.ts`
- `frontend/src/lib/repositories/types.ts`
- `frontend/src/lib/repositories/proposalRepository.ts`
- `frontend/src/lib/supabase/database.types.ts`
- `frontend/src/hooks/use-proposal-relations.ts`
- `frontend/src/components/admin/proposal-form.tsx`
- `frontend/src/components/admin/admin-election-detail-view.tsx`
- `frontend/src/app/admin/daftar-proposal/[id]/page.tsx`
- `frontend/src/app/admin/daftar-proposal/[id]/edit/page.tsx`

## Perilaku baru
- Modal upload whitelist admin sekarang menerima isi CSV sederhana yang ditempel manual.
- Parser memproses format `wallet,name` per baris; wallet tidak valid diabaikan.
- Proposal form sekarang memakai daftar kandidat terstruktur (nama + NIM/ID opsional) alih-alih satu textarea nama kandidat.
- Halaman detail/edit proposal membaca relasi kandidat live dan menampilkannya kembali ke form terstruktur.

## Validasi
- `npm run build` ✅
- `npm run typecheck` ✅

## Batas implementasi
- CSV parsing masih sederhana, belum memakai upload file fisik/browser parser penuh.
- Kandidat terstruktur baru menyimpan `name` dan `studentId`; field fakultas, bio, visi, misi, dan avatar belum ikut dari form ini.
- Bulk whitelist masih draft/off-chain dan belum otomatis mengirim batch ke kontrak.
