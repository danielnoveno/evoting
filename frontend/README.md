# Frontend (Next.js + TypeScript)

Skeleton awal frontend VoteChain MVP.

## Route minimum (sesuai MVP)
- `/login`
- `/beranda`
- `/space/create`
- `/space/[id]/admin`
- `/space/[id]/vote`
- `/space/[id]/reveal`
- `/space/[id]/results`

## Aturan implementasi
- Copy user-facing berbahasa Indonesia
- Error kontrak wajib diterjemahkan (`getErrorMessage`)
- Semua tx hash harus dapat diakses via link Basescan
- Alur commit wajib: `generateSalt -> saveVoteData -> send tx`
