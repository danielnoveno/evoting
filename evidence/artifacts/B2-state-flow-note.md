# B2-state-flow-note

## State flow proposal (Registry)
`Submitted -> Approved | Rejected -> Deployed`

Keterangan:
- Hanya Super Admin yang dapat review proposal.
- Hanya proposal `Approved` yang dapat dibuatkan `ElectionSpace`.

## State flow election (ElectionSpace)
Phase:
- `Registration -> Commit -> Reveal -> Ended`

Governance status:
- `Active` (normal)
- `Suspended` (aksi voting/admin diblok)
- `Terminated` (permanen dihentikan)

Aturan:
1. Fase tidak bisa mundur.
2. Commit/reveal hanya saat `status == Active`.
3. `getResult` hanya bisa di fase `Ended`.
