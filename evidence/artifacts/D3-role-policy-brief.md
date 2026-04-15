# D3-role-policy-brief

## Objective
Menetapkan model otorisasi 3 level untuk VoteChain:
- Super Admin (platform governance)
- Admin (pengelola election/space)
- Voter (pemilih per-space)

## Ruang lingkup
In-scope:
1. Definisi role dan izin inti.
2. Aturan approval proposal election.
3. Aturan penghentian election oleh Super Admin.

Out-of-scope:
1. Mekanisme DAO/governance voting antar-admin.
2. Multi-signature governance lanjutan.

## Definisi role

### 1) Super Admin
Hak:
- CRUD admin platform.
- Review proposal election dari admin (`approve` / `reject`).
- Suspend/terminate election yang melanggar aturan.

Larangan:
- Tidak boleh mengubah isi suara voter.
- Tidak boleh membuka data pilihan sebelum reveal valid.

### 2) Admin
Hak:
- Buat proposal election.
- Kelola whitelist voter untuk election miliknya.
- Kelola transisi fase election miliknya.

Larangan:
- Tidak boleh mengelola election milik admin lain.
- Tidak boleh bypass urutan fase.

### 3) Voter
Hak:
- Commit dan reveal hanya jika wallet terdaftar di whitelist election terkait.

Larangan:
- Tidak boleh commit/reveal lebih dari sekali.
- Tidak boleh reveal di fase selain Reveal.

## Aturan kebijakan inti
1. Whitelist bersifat per-space/election, bukan global lintas semua election.
2. Urutan fase wajib tetap: Registration -> Commit -> Reveal -> Ended.
3. Aksi "menghapus election" diinterpretasikan sebagai disable/suspend/terminated state agar audit trail on-chain tetap terjaga.
4. Semua aksi governance penting harus emit event untuk auditabilitas (dan ditautkan ke Basescan).

## Dampak thesis
- Narasi 3 aktor sebelumnya perlu diperluas menjadi 4 aktor operasional (Super Admin, Admin, Voter, Publik).
- Klaim "delete election" harus ditulis sebagai suspend/terminate (bounded by blockchain immutability).
