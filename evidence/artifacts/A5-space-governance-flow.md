# A5-space-governance-flow

## Tujuan
Mendefinisikan flow governance dari proposal election sampai lifecycle operasional, termasuk intervensi Super Admin.

## State governance proposal
`Draft -> Submitted -> Approved | Rejected`

## State operasional election
`PendingActivation -> Registration -> Commit -> Reveal -> Ended`

State tambahan kontrol platform:
- `Suspended` (darurat; dipasang Super Admin)
- `Terminated` (dihentikan permanen; dipasang Super Admin)

## Flow utama
1. Admin membuat proposal election (`Draft`).
2. Admin submit proposal (`Submitted`).
3. Super Admin review:
   - Jika valid -> `Approved`, election boleh diaktifkan.
   - Jika tidak valid -> `Rejected`.
4. Election aktif masuk `Registration` dan berjalan normal:
   - Registration -> Commit -> Reveal -> Ended.

## Flow intervensi Super Admin
1. Jika terjadi pelanggaran rules, Super Admin set `Suspended`.
2. Saat `Suspended`, commit/reveal/transisi fase normal diblok.
3. Super Admin dapat:
   - lanjutkan kembali ke state sebelumnya (`unsuspend`) jika masalah selesai, atau
   - set `Terminated` jika election harus dihentikan permanen.

## Aturan kompatibilitas dengan baseline keamanan
1. Intervensi governance tidak boleh mengubah data commit/reveal historis.
2. Reveal tetap wajib verifikasi hash (`keccak256(candidateId, salt)`).
3. Anti double vote tetap berlaku walau sempat suspend.
4. Semua transisi governance emit event dan dapat diverifikasi via Basescan.

## UX copy guardrails (Bahasa Indonesia)
- `Submitted`: "Menunggu Review Super Admin"
- `Rejected`: "Pengajuan ditolak"
- `Suspended`: "Pemilihan ditangguhkan sementara"
- `Terminated`: "Pemilihan dihentikan"

## Open decision
- Apakah `Ended` bisa dipakai kembali setelah `Suspended`? Rekomendasi: boleh jika tidak `Terminated`.
