# A4-access-control-matrix

## Access Matrix (final draft)

| Action | Super Admin | Admin (Owner Space) | Admin (Other Space) | Voter Whitelisted | Voter Non-Whitelisted | Publik |
|---|---|---|---|---|---|---|
| CRUD Admin Platform | Allow | Deny | Deny | Deny | Deny | Deny |
| Submit proposal election | Allow | Allow | Allow | Deny | Deny | Deny |
| Approve/Reject proposal | Allow | Deny | Deny | Deny | Deny | Deny |
| Create election contract instance | Allow | Allow (after approval) | Allow (after approval) | Deny | Deny | Deny |
| Add/remove whitelist voter (space owned) | Allow (override) | Allow | Deny | Deny | Deny | Deny |
| Transition phase (space owned) | Allow (override/emergency) | Allow | Deny | Deny | Deny | Deny |
| Commit vote | Deny | Deny | Deny | Allow (Commit phase only) | Deny | Deny |
| Reveal vote | Deny | Deny | Deny | Allow (Reveal phase only) | Deny | Deny |
| Read final result | Allow | Allow | Allow | Allow | Allow | Allow |
| Suspend / terminate election | Allow | Deny* | Deny | Deny | Deny | Deny |

`*` Admin dapat menutup fase ke Ended secara normal via alur fase; suspend darurat tetap hak Super Admin.

## Smart contract enforcement points
1. `onlySuperAdmin`
2. `onlyAdmin`
3. `onlySpaceAdmin(spaceId)`
4. `onlyRegistered(spaceId, voter)`
5. `onlyPhase(spaceId, expectedPhase)`

## Event audit wajib
1. `AdminUpserted(admin, isActive)`
2. `ProposalSubmitted(proposalId, admin)`
3. `ProposalReviewed(proposalId, decision, reviewer)`
4. `ElectionStatusChanged(spaceId, status, actor)`
5. `PhaseChanged(spaceId, previousPhase, newPhase, actor)`
6. `WhitelistUpdated(spaceId, voter, isRegistered, actor)`

## Catatan keamanan
- Override Super Admin wajib transparan: setiap override harus emit event + alasan (reason code).
- Tidak ada role yang dapat memodifikasi histori commit/reveal yang sudah tersimpan.
