# Workflow: Definition of Done

A task is done only if all relevant checks pass.

## Core checks
- Security baseline preserved.
- Voting phase logic remains valid.
- Commit-reveal sequence and storage rules are respected.
- User-facing copy is Bahasa Indonesia and understandable.
- Basescan links are available for on-chain artifacts.

## Engineering checks
- Code compiles and tests pass for touched scope.
- Negative-path behavior is validated where relevant.
- No unexplained design-system deviations.

## Documentation checks
- Decisions and trade-offs are recorded.
- Evidence is available for thesis reporting.

## Claim-evidence checks
- Every thesis-facing claim is tagged as `safe`, `bounded`, or `unsupported`.
- `safe` and `bounded` claims must reference concrete evidence artifacts.
- `unsupported` claims cannot be written as conclusions.

## Consistency checks
- No contradiction between implementation, tests, and Chapter IV/V narrative.
- Any mismatch is logged in `knowledge/thesis-consistency-register.md`.
- Residual risks and limitations are explicitly stated.
