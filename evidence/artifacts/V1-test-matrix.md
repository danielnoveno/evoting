# V1-test-matrix

Eksekusi command:
- `forge test -vv`

Hasil ringkas:
- 9 passed
- 0 failed

## Skenario uji

| No | Test | Kategori | Expected | Status |
|---|---|---|---|---|
| 1 | `test_super_admin_can_crud_admin_and_create_space` | Positive | Super Admin dapat CRUD admin dan membuat election via proposal approved | PASS |
| 2 | `test_non_admin_cannot_submit_proposal` | Negative | Non-admin ditolak saat submit proposal | PASS |
| 3 | `test_commit_reveal_happy_path` | Positive | Whitelist voter dapat commit -> reveal -> result Ended | PASS |
| 4 | `test_non_whitelisted_cannot_commit` | Negative | Non-whitelist gagal commit | PASS |
| 5 | `test_wrong_phase_commit_rejected` | Negative | Commit di fase salah ditolak | PASS |
| 6 | `test_double_commit_rejected` | Negative | Commit kedua ditolak | PASS |
| 7 | `test_reveal_with_wrong_salt_rejected` | Negative | Reveal dengan salt salah ditolak (mismatch) | PASS |
| 8 | `test_super_admin_suspend_blocks_actions` | Negative + Governance | Saat suspended, commit diblok; setelah unsuspend commit bisa lanjut | PASS |
| 9 | `test_super_admin_terminate_blocks_actions` | Negative + Governance | Saat terminated, action admin/voter diblok | PASS |

## Gap tersisa
- Belum ada integration test frontend terhadap kontrak.
- Belum ada test deploy/verify Base Sepolia.
