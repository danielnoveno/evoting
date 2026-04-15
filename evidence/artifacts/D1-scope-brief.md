# D1-scope-brief

## Tujuan
Menyelesaikan MVP VoteChain 14 hari dengan fokus keamanan inti e-voting.

## In-Scope (P0)
- Smart contract phase machine (Registration -> Commit -> Reveal -> Ended)
- Whitelist voter
- Commit-reveal validasi hash
- Anti double commit/reveal
- Frontend minimum: login, commit, reveal, hasil publik, admin minimum
- Proof on-chain via Basescan

## Out-of-Scope (dipindah P1/P2)
- Polishing UI lanjutan
- Optimasi indexer lanjutan
- Fitur non-esensial di luar keamanan alur inti

## Acceptance Criteria (testable)
1. Test positif + negatif kontrak lulus.
2. Simulasi 1 alur penuh dari Registration sampai Ended berhasil.
3. Tiap tx utama punya link Basescan.
4. Bukti BAB IV terkumpul di folder `evidence/`.

## Batasan
- Network: Base Sepolia (84532)
- Bahasa UI: Bahasa Indonesia
- Tidak mengubah urutan fase voting
