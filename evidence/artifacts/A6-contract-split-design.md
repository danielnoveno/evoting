# A6-contract-split-design

## Rekomendasi arsitektur kontrak

Gunakan split 2 layer:

1. **VoteChainRegistry (platform-level)**
   - Simpan `superAdmin` dan daftar `admin` aktif.
   - Simpan proposal election + status review.
   - Deploy/registrasi `ElectionSpace` ketika proposal approved.
   - Menjalankan aksi governance lintas space (suspend/terminate).

2. **ElectionSpace (per election/space)**
   - Menjalankan mekanisme voting: phase, whitelist, commit, reveal, result.
   - Menyimpan state spesifik election (candidateCount, commitments, voteCount).
   - Menyediakan event voting untuk audit publik.

## Interface minimum antar kontrak

### Registry -> ElectionSpace
- `setSuspended(bool suspended, string reasonCode)`
- `setTerminated(string reasonCode)`

### ElectionSpace -> Registry (read-only)
- `isSuperAdmin(address actor)`
- `isAdmin(address actor)` (opsional jika butuh shared role policy)

## Benefit split
1. Isolasi risiko: bug satu election tidak merusak election lain.
2. Governance terpusat: kontrol admin/proposal konsisten di Registry.
3. Sesuai multi-space thesis scope.

## Trade-off
1. Kompleksitas deployment naik (factory pattern / registry mapping).
2. Harus disiplin ABI sinkron untuk frontend.
3. Perlu test tambahan integration Registry <-> ElectionSpace.

## MVP mode (agar tetap 14 hari)
Tahap 1 (P0):
- Implement satu `ElectionSpace` solid dulu.
- Simulasikan super admin sederhana di kontrak yang sama jika waktu mepet.

Tahap 2 (P0.5 jika waktu cukup):
- Pisah ke `Registry + ElectionSpace` dengan fungsi governance minimum.

Tahap 3 (P1):
- Full proposal workflow + reason codes + integration tests lengkap.
