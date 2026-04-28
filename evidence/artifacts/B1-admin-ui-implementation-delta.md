# B1-admin-ui-implementation-delta

## Ringkasan
Implementasi batch-1 untuk tampilan role admin di route `/space/[id]/admin` dengan fokus:
- dashboard admin inti,
- manajemen fase,
- whitelist pemilih,
- kandidat,
- bukti transaksi + tautan Basescan,
- state loading/error/empty/success/phase-blocked.

Batch-2 melanjutkan hardening:
- guard role admin di frontend (mode demo-session),
- aktivasi ABI nyata (subset `ElectionSpace.sol`) untuk flow yang dipakai frontend,
- sinkronisasi login demo agar role tersimpan sebelum redirect.

Batch-3 melanjutkan kesiapan kontrak live:
- resolver alamat kontrak dari environment,
- role-check on-chain (space admin / super admin) pada dashboard admin,
- aksi fase + whitelist dapat menembak transaksi kontrak live jika wallet authorized,
- fallback aman ke mode simulasi jika konfigurasi kontrak belum tersedia.

Batch-4 menambahkan area monitoring dan audit log admin:
- panel monitoring real-time (fase aktif, commit/reveal, partisipasi, perolehan sementara),
- tabel log aktivitas dengan link tx ke Basescan,
- log otomatis bertambah saat aksi admin dijalankan (live/simulasi).

## File yang diubah

### Route + layout
1. `frontend/src/app/space/[id]/admin/page.tsx`
   - Gunakan params dinamis (`id`) untuk route admin.
   - Render komponen client `AdminDashboard`.

2. `frontend/src/app/space/[id]/admin/loading.tsx` (baru)
   - Skeleton loading khusus dashboard admin.

3. `frontend/src/app/space/[id]/admin/error.tsx` (baru)
   - Error boundary khusus dashboard admin dengan aksi `Coba Lagi`.

4. `frontend/src/components/layout/SiteContainer.tsx`
   - Paritas container jadi `max-width 1320px` dan padding responsif `px-4 / md:px-5 / lg:px-6`.

### Komponen admin
5. `frontend/src/components/admin/AdminDashboard.tsx` (baru)
   - Orkestrasi dashboard admin + tab dinamis berbasis `spaceId`.
   - Menampilkan state loading/error/success-ready.

6. `frontend/src/components/admin/AdminHeader.tsx` (baru)
   - Header admin, badge fase aktif, link kontrak ke Basescan.

7. `frontend/src/components/admin/PhaseManager.tsx`
   - Daftar fase Registration → Commit → Reveal → Ended.
   - Konfirmasi transisi fase (aksi irreversible).
   - Bukti tx + link Basescan setelah aksi.

8. `frontend/src/components/admin/VoterList.tsx`
   - Tabel whitelist + status badge + inline confirm hapus.
   - Validasi format wallet (`0x` + 42 karakter).
   - Guard aksi hanya saat fase Registration.
   - Feedback error/sukses + tx proof link.

9. `frontend/src/components/admin/CandidateList.tsx`
   - List kandidat + form tambah kandidat inline.
   - Guard aksi tambah/hapus hanya saat fase Registration.
   - Empty state + tx proof link.

### Hook + data state
10. `frontend/src/hooks/useAdminDashboard.ts` (baru)
    - Simulasi data dashboard admin.
    - Aksi async: transisi fase, tambah/hapus voter, tambah/hapus kandidat.
    - Tetap menjaga urutan fase satu arah.

11. `frontend/src/lib/admin-demo-data.ts` (baru)
    - Tipe data admin (`AdminPhase`, `AdminVoter`, `AdminCandidate`, `AdminSpaceState`).
    - Helper fase (`getNextPhase`, `getPhaseLabel`, `getPhaseBadgeVariant`).

### Hardening batch-2
12. `frontend/src/lib/demo-auth.ts`
    - Tambah fungsi session role: `setDemoSessionRole`, `getDemoSessionRole`, `clearDemoSessionRole`.

13. `frontend/src/hooks/useDemoLoginFlow.ts`
    - `runLogin` mendukung parameter role dan menyimpan role ke localStorage.

14. `frontend/src/app/login/{metamask,google,email,smart-wallet}/page.tsx`
    - Semua jalur login demo sekarang mengirim role saat proses login.

15. `frontend/src/components/admin/AdminDashboard.tsx`
    - Tambah guard role (`admin`/`superadmin`) sebelum render dashboard.

16. `frontend/src/lib/abi.ts`
    - Ganti placeholder ABI kosong dengan ABI subset nyata dari `contracts/src/ElectionSpace.sol`.

### Wiring kontrak live (batch-3)
17. `frontend/src/lib/contracts.ts` (baru)
    - Resolver address dari environment:
      - `NEXT_PUBLIC_ELECTION_SPACE_ADDRESS`
      - `NEXT_PUBLIC_REGISTRY_ADDRESS`

18. `frontend/src/lib/registry-abi.ts` (baru)
    - ABI subset registry (`spaceById`, `isSuperAdmin`) untuk role-check dan resolusi space.

19. `frontend/src/hooks/useAdminDashboard.ts`
    - Tambah read on-chain: `currentPhase`, `candidateCount`, `spaceAdmin`, `registry`.
    - Tambah role-check on-chain via `isSuperAdmin`.
    - Aksi on-chain aktif untuk:
      - `transitionToNextPhase`
      - `registerVoter`
      - `unregisterVoter`
    - Jika wallet tidak authorized / address tidak dikonfigurasi: fallback mode simulasi.

20. `frontend/src/components/admin/AdminDashboard.tsx`
    - Tampilkan indikator mode (live/demo) + info wallet admin on-chain.

21. `frontend/.env.example`
    - Tambah variabel env untuk address kontrak live.

### Monitoring + Audit Log (batch-4)
22. `frontend/src/components/admin/AdminMonitoringPanel.tsx` (baru)
    - Ringkasan monitoring real-time untuk admin.

23. `frontend/src/components/admin/AdminAuditLogTable.tsx` (baru)
    - Tabel log aktivitas berisi waktu, event, aktor, tx hash, block, dan status.

24. `frontend/src/lib/admin-demo-data.ts`
    - Tambah model `AdminAuditLog` + seed data log awal.

25. `frontend/src/hooks/useAdminDashboard.ts`
    - Tambah mekanisme append log ketika aksi admin berjalan.

26. `frontend/src/components/admin/AdminDashboard.tsx`
    - Integrasi panel monitoring dan tabel audit log ke dashboard admin.

## Perilaku keamanan/UX yang dijaga
- Urutan fase satu arah tetap dipertahankan (Registration → Commit → Reveal → Ended).
- Aksi whitelist & kandidat diblok di luar Registration.
- Semua copy user-facing dalam Bahasa Indonesia.
- Error kontrak ditranslasi via `getErrorMessage()`.
- Bukti transaksi selalu disertai tautan Basescan.

## Catatan batasan
- Guard role saat ini berbasis localStorage demo-session (belum auth produksi).
- Aksi kandidat on-chain belum didukung oleh kontrak `ElectionSpace` saat ini; UI menandai kandidat sebagai locked setelah deploy.
- Data metrik commit/reveal pada dashboard masih hybrid (demo + sebagian read on-chain), belum full indexer-driven.
- Data admin saat ini masih berbasis state simulasi untuk validasi UI flow.
