# A2-event-data-contract (Draft)

## Events utama
1. `PhaseChanged(previousPhase, newPhase, timestamp)`
2. `WhitelistUpdated(voter, isRegistered)`
3. `Committed(voter, commitment)`
4. `Revealed(voter, candidateId, newVoteCount)`

## Data contract frontend -> contract
- Commit: `bytes32 commitment`
- Reveal: `uint256 candidateId`, `bytes32 salt`

## Data contract untuk bukti
- Tx hash commit/reveal
- Block number
- Address kontrak
- Link Basescan

## Open item
- Penamaan final custom errors agar selaras penuh dengan `getErrorMessage` frontend.
