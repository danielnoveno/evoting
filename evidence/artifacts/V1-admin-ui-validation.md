# V1-admin-ui-validation

## Ruang validasi
Validasi build untuk implementasi UI admin batch-1.

## Perintah yang dijalankan

1. Type check
```bash
npm run typecheck
```
Hasil: **pass**

2. Build default Next
```bash
npm run build
```
Hasil: **gagal environment** (`Bus error (core dumped)`)

3. Build fallback wasm
```bash
npm run build:wasm
```
Hasil: **pass**

4. Re-run setelah hardening batch-2 (role guard + ABI)
```bash
npm run typecheck
npm run build:wasm
```
Hasil: **pass**

5. Re-run setelah wiring kontrak live (batch-3)
```bash
npm run typecheck
npm run build:wasm
```
Hasil: **pass**

6. Re-run setelah monitoring + audit log admin (batch-4)
```bash
npm run typecheck
npm run build:wasm
```
Hasil: **pass**

## Catatan teknis
- Kegagalan `npm run build` berkaitan dengan environment SWC native di mesin saat ini.
- `build:wasm` dipakai sebagai jalur validasi reproducible untuk memastikan kode tetap kompilabel.

## Checklist state admin (batch-1)
- Loading state: ada (`/space/[id]/admin/loading.tsx` + skeleton dashboard).
- Error state: ada (`/space/[id]/admin/error.tsx` + fallback reload).
- Empty state: ada di daftar kandidat dan whitelist.
- Success state: ada pada aksi fase/whitelist/kandidat melalui panel sukses + link Basescan.
- Phase-blocked state: ada untuk whitelist/kandidat saat bukan Registration.

## Checklist hardening (batch-2)
- Guard role admin frontend: ada (deny state untuk non-admin/non-superadmin).
- Session role login demo: role tersimpan sebelum redirect.
- ABI frontend: bukan placeholder, sudah menggunakan subset ABI kontrak `ElectionSpace`.

## Checklist wiring live (batch-3)
- Address resolver env tersedia (`NEXT_PUBLIC_ELECTION_SPACE_ADDRESS`, `NEXT_PUBLIC_REGISTRY_ADDRESS`).
- Role-check on-chain tersedia (`spaceAdmin` dan `isSuperAdmin`).
- Aksi on-chain admin aktif untuk transisi fase + whitelist bila wallet authorized.
- Fallback ke mode simulasi jika live config belum tersedia.

## Checklist monitoring + audit (batch-4)
- Panel monitoring real-time tersedia di dashboard admin.
- Tabel audit log tersedia dan menampilkan tx hash dengan link Basescan.
- Log bertambah otomatis saat aksi admin dijalankan.
