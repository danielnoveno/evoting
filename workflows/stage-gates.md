# Workflow: Stage Gates

Use this file to decide whether a BMAD stage may advance.

## Gate 1 - Discover -> Architect
Required:
- `D1-scope-brief` exists and is bounded
- acceptance criteria are testable
- in-scope / out-of-scope is explicit
- key risks and assumptions are listed

Block if:
- request is still ambiguous on actor or objective
- scope creeps beyond thesis constraints

## Gate 2 - Architect -> Build
Required:
- `A1-boundary-map` is complete
- `A2-event-data-contract` exists
- open issues have owner and fallback
- security invariants are stated

Block if:
- cross-layer interfaces are inconsistent
- commitment encoding is undefined or conflicting

## Gate 3 - Build -> Validate
Required:
- `B1-implementation-delta` references actual files
- phase behavior and state transitions are documented
- user-facing copy follows Indonesian terminology guardrails
- known risks are tracked

Block if:
- security baseline regression is detected
- required states (loading/error/empty/success) are missing for touched flows

## Gate 4 - Validate -> Document
Required:
- `V1-test-matrix` with positive and negative paths
- `V2-security-check` with findings and residual risks
- `V3-proof-pack` includes tx proof links where applicable
- `V4-usability-note` exists when UX is impacted

Block if:
- claim is made without reproducible evidence
- proofs are incomplete or not linkable

## Gate 5 - Document -> Done
Required:
- `DOC1-bab4-map` aligns with Chapter IV sections
- `DOC2-safe-claims` marks every major claim as safe/bounded/unsupported
- `DOC3-limitations-future-work` is realistic and explicit
- mismatch log is updated if inconsistencies exist

Block if:
- conclusion contains unsupported claims
- unresolved contradictions between thesis narrative and implementation
