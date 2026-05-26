# Votein: Rancang Bangun Sistem E-Voting Berbasis Blockchain Ethereum untuk Organisasi Mahasiswa

**Votein** adalah platform e-voting terdesentralisasi yang dirancang khusus untuk memenuhi kebutuhan pemilihan umum di lingkungan organisasi mahasiswa (studi kasus: Himpunan Mahasiswa Informatika - HIMAFORKA FTI UAJY). Platform ini dibangun untuk meningkatkan transparansi, akuntabilitas, dan *auditability* hasil pemungutan suara dengan memanfaatkan teknologi blockchain Ethereum (Base Sepolia Testnet) dan *smart contracts* Solidity.

Platform ini memisahkan tata kelola administratif yang dikelola secara *off-chain* dengan proses pemungutan suara (*voting*) inti yang dijalankan secara *on-chain*, sehingga menjamin kerahasiaan pilihan serta keabsahan suara tanpa mempersulit pengguna non-teknis.

---

## Fitur Utama

### 1. Smart Wallet Onboarding
Voter non-teknis tidak diwajibkan untuk membuat atau mengelola wallet Web3 secara manual sejak awal. Onboarding dipermudah menggunakan email kampus melalui integrasi smart wallet (one-time wallet) untuk memproses transaksi voting secara mulus.

### 2. On-Chain Voting Integrity
Proses pemungutan suara inti dijalankan secara aman di blockchain melalui smart contract Solidity:
*   **Whitelist & Address Validation**: Hak pilih divalidasi berdasarkan kecocokan alamat wallet dengan daftar pemilih tetap (DPT) yang sah.
*   **Double Voting Prevention**: Menghindari pemilih memberikan suara lebih dari sekali untuk pemilihan yang sama.
*   **Replay Attack Prevention & Nonce Tracking**: Menjaga integritas data transaksi agar tidak dapat dieksekusi ulang secara ilegal.

### 3. Skema Commit-Reveal
Untuk menjaga kerahasiaan pilihan selama masa pemungutan suara aktif, Votein menerapkan mekanisme *commit-reveal*:
*   **Fase Commit**: Voter menyerahkan bukti suara dalam bentuk hash kriptografi pilihan mereka. Pilihan asli tetap tersembunyi.
*   **Fase Reveal**: Setelah masa pemungutan suara selesai, Voter membuka kunci hash dengan mengirimkan pilihan asli untuk proses penghitungan suara secara transparan dan otomatis oleh smart contract.

### 4. Off-Chain Indexing (Audit Trail)
Menggunakan **Ponder** sebagai indexer off-chain yang menangkap seluruh *events* dari smart contract, lalu mengolahnya menjadi data terstruktur yang disajikan di dashboard admin maupun pemilih secara cepat. Ini menyediakan jejak audit digital (*audit trail*) yang transparan dan dapat diverifikasi oleh publik melalui block explorer.

---

## Arsitektur & Teknologi Stack

*   **Frontend**: Next.js, TypeScript, Tailwind CSS / Vanilla CSS
*   **Smart Contracts**: Solidity
*   **Framework Kontrak**: Foundry (Forge, Cast)
*   **Jaringan Blockchain**: Base Sepolia Testnet
*   **Data Indexer**: Ponder Indexer

---

## Struktur Direktori Utama

*   `contracts/` — Kode sumber smart contract Solidity, naskah deployment, dan unit testing menggunakan Foundry.
*   `frontend/` — Aplikasi web Next.js untuk antarmuka Voter, Admin, dan dashboard hasil pemilihan.
*   `indexer/` — Konfigurasi Ponder indexer untuk melacak dan menstrukturkan log event on-chain.
*   `shared/` — Tempat penyimpanan ABI contract, alamat deployment, dan konstanta konfigurasi jaringan yang digunakan bersama antara frontend dan indexer.
*   `supabase/` — Konfigurasi backend, migrasi database, dan fungsi edge untuk layanan Supabase.
*   `scripts/` — Skrip utilitas untuk pemeliharaan data, pembersihan environment, dan bantuan pengembangan.
*   `.docs/` — *(Diabaikan oleh git)* Berisi dokumen akademik (SKPL, DDPL), aset desain Figma, bukti pengujian, serta artefak pengembangan internal.

