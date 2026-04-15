# Contracts (Foundry)

Folder ini untuk implementasi smart contract VoteChain MVP.

## Tujuan P0
- Phase berurutan: Registration -> Commit -> Reveal -> Ended
- Commit-reveal valid (`keccak256(abi.encodePacked(candidateId, salt))`)
- Whitelist pemilih
- Anti double commit/reveal
- Hasil hanya dapat diakses di fase Ended

## Struktur
- `src/` : source Solidity
- `test/` : unit/integration test Forge
- `script/` : skrip deploy/verify

## Catatan
Implementasi ini baseline awal. Hardening test negatif dan deploy Base Sepolia dilakukan pada tahap berikutnya.
