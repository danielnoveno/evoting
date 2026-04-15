# D4-implementation-order-role-aware

## Tujuan
Menyesuaikan urutan implementasi MVP 14 hari dengan tambahan role Super Admin tanpa merusak target P0.

## Urutan kerja rekomendasi

### Sprint A (Hari 1-4) — Core voting aman
1. Finalkan `ElectionSpace`:
   - phase guard berurutan
   - whitelist per-space
   - commit-reveal + anti double
   - result only Ended
2. Tambahkan status emergency minimal (`suspended`) jika feasible.

### Sprint B (Hari 5-7) — Validasi + deploy
3. Tulis test positif dan negatif lengkap.
4. Deploy Base Sepolia + verifikasi source.
5. Simpan evidence tx hash + Basescan.

### Sprint C (Hari 8-11) — Frontend minimum
6. Integrasi route minimum commit/reveal/results/admin.
7. Integrasi urutan commit wajib: `generateSalt -> saveVoteData -> send tx`.
8. Translasi error Indonesia + state loading/error/success.

### Sprint D (Hari 12-14) — Governance + dokumen
9. Tambahkan governance Super Admin minimum:
   - CRUD admin basic
   - approve/reject proposal sederhana ATAU hardcoded allowlist admin (fallback)
   - suspend/terminate election
10. Simulasi end-to-end 3-5 voter.
11. Finalisasi bukti BAB IV/V.

## Fallback jika waktu ketat
1. Prioritaskan keamanan voting (Sprint A-B) sebagai P0 wajib.
2. Governance proposal detail dipindah P1, tapi fitur suspend oleh Super Admin tetap ada.

## Output bukti minimal untuk demo
1. Video/screenshot alur commit-reveal.
2. Tabel uji PASS/FAIL (positive + negative).
3. Link Basescan untuk deploy, commit, reveal, phase transition.
