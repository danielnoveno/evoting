# V2-security-check

## Baseline checks

1. Phase ordering preserved: ✅
2. Commit-reveal integrity (`keccak256(candidateId, salt)`): ✅
3. Whitelist access for commit/reveal: ✅
4. Anti double commit/reveal: ✅
5. Result getter only at Ended phase: ✅
6. Governance emergency controls (suspend/terminate): ✅

## Residual risks
1. Super Admin centralization risk (single-point privilege).
2. Proposal metadata validation masih off-chain (URI/title belum tervalidasi kebijakan detail on-chain).
3. Frontend belum sepenuhnya mengonsumsi seluruh custom errors governance.

## Rekomendasi mitigasi lanjutan
1. Tambah multi-sig untuk role Super Admin (P1/P2).
2. Tambah reason-code standard dan policy registry yang lebih ketat.
3. Tambah integration tests frontend + transaction proof pack.
