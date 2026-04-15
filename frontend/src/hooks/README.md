# Hooks

Hook blockchain interaction yang akan dipakai:
- `useCommitVote.ts`
- `useRevealVote.ts`
- `usePhase.ts`

Rule penting: semua error kontrak harus dipetakan via `getErrorMessage()` sebelum ditampilkan ke pengguna.
