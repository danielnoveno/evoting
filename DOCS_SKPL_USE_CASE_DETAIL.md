# Dokumen Spesifikasi Kebutuhan Perangkat Lunak (SKPL) - Use Case Detail
**Proyek**: Votein - Sistem E-Voting Berbasis Blockchain Ethereum
**Tujuan**: Definisi detail fungsionalitas sistem untuk dokumen akademik (Skripsi).

---

## 1. Daftar Use Case

| ID | Nama Use Case | Aktor | Deskripsi Singkat |
|:---|:---|:---|:---|
| **UC-01** | Autentikasi & Aktivasi Profil (Wallet Onboarding) | Voter, Admin, Super Admin | Proses menghubungkan wallet Web3 dan verifikasi identitas kampus untuk akses sistem. |
| **UC-02** | Manajemen Akun Admin Organisasi | Super Admin | Mengelola hak akses bagi admin organisasi mahasiswa (Hima/UKM). |
| **UC-03** | Inisialisasi Pemilihan (Create Election) | Super Admin | Mendaftarkan pemilihan baru ke dalam Smart Contract Registry. |
| **UC-04** | Manajemen Draft Pemilihan | Admin | Mengatur informasi dasar pemilihan, tema, dan aturan pemilihan. |
| **UC-05** | Manajemen Kandidat | Admin | Mengelola data calon yang akan dipilih (foto, visi, misi). |
| **UC-06** | Manajemen Daftar Pemilih Tetap (DPT) | Admin | Mengelola daftar pemilih yang berhak memberikan suara (Whitelist). |
| **UC-07** | Sinkronisasi Whitelist ke Blockchain | Admin | Mendaftarkan alamat wallet pemilih ke Smart Contract agar bisa melakukan voting. |
| **UC-08** | Transisi Fase Pemilihan | Admin | Mengubah status pemilihan (Registrasi -> Commit -> Reveal -> Selesai). |
| **UC-09** | Melihat Daftar Pemilihan | Voter | Melihat pemilihan yang tersedia atau sedang berlangsung. |
| **UC-10** | Memberikan Suara (Commit Vote) | Voter | Mengirimkan hash pilihan (enkripsi) ke blockchain pada fase Commit. |
| **UC-11** | Membuka Suara (Reveal Vote) | Voter | Mengirimkan pilihan asli dan salt untuk dihitung oleh Smart Contract pada fase Reveal. |
| **UC-12** | Melihat Hasil Pemilihan (Real-time Audit) | Voter, Admin, Super Admin | Melihat hasil perhitungan suara yang transparan dari blockchain. |
| **UC-13** | Mengunduh Bukti Audit (Audit Bundle) | Voter | Mendapatkan bukti digital partisipasi voting sebagai transparansi personal. |

---

## 2. Deskripsi Detail Use Case

### UC-01: Autentikasi & Aktivasi Profil (Wallet Onboarding)

*   **ID Use Case**: UC-01
*   **Aktor**: Voter, Admin, Super Admin
*   **Deskripsi**: Proses awal di mana pengguna menghubungkan dompet digital (Smart Wallet) dan memverifikasi identitas kampus mereka melalui akun Microsoft/Google UAJY untuk mengaktifkan profil di platform Votein.
*   **Pre-kondisi**: Pengguna memiliki akun email kampus (@uajy.ac.id atau @students.uajy.ac.id).
*   **Post-kondisi**: Alamat wallet pengguna terikat (binding) dengan identitas kampus dan peran (role) telah ditentukan dalam database.
*   **Skelario Utama (Normal Flow)**:
    1. Pengguna mengakses halaman "Hubungkan Dompet".
    2. Pengguna memilih opsi "Hubungkan Wallet" (menggunakan Coinbase Smart Wallet/Web3 Wallet).
    3. Sistem mendeteksi koneksi wallet dan memeriksa apakah alamat wallet sudah terdaftar.
    4. Jika belum terdaftar, sistem meminta pengguna melakukan "Verifikasi Identitas Kampus".
    5. Pengguna login menggunakan Single Sign-On (SSO) Microsoft atau Google UAJY.
    6. Sistem menerima data identitas (email, nama) dari provider SSO.
    7. Sistem melakukan pemetaan (*binding*) antara Alamat Wallet dengan Email Kampus di database Supabase.
    8. Sistem memberikan peran akses (*Voter/Admin/Super Admin*) berdasarkan data yang ada.
    9. Profil pengguna aktif, dan pengguna diarahkan ke dashboard masing-masing.
*   **Skenario Alternatif**:
    *   **A1 (Wallet Sudah Terikat)**: Sistem mendeteksi wallet sudah terikat profil, langsung mengarahkan ke dashboard tanpa login SSO lagi.
    *   **A2 (Login Gagal)**: Jika autentikasi SSO gagal, sistem menampilkan pesan error dan meminta pengguna mencoba kembali.

---

### UC-03: Inisialisasi Pemilihan (Create Election)

*   **ID Use Case**: UC-03
*   **Aktor**: Super Admin
*   **Deskripsi**: Super Admin membuat entitas pemilihan baru pada tingkat blockchain (Smart Contract) agar siap dikelola oleh Admin Organisasi.
*   **Pre-kondisi**: Super Admin telah login dan berada di Portal Super Admin.
*   **Post-kondisi**: Contract Election ID terbentuk di blockchain dan ID pemilihan tersimpan di database.
*   **Skenario Utama**:
    1. Super Admin memilih menu "Buat Pemilihan Baru".
    2. Super Admin memasukkan Nama Pemilihan, Admin Organisasi yang bertanggung jawab, dan Jumlah Kandidat Awal.
    3. Super Admin mengonfirmasi transaksi melalui wallet.
    4. Sistem mengeksekusi fungsi `createElection` pada Smart Contract `VoteChainUnified`.
    5. Blockchain memproses transaksi dan mengembalikan `electionId`.
    6. Sistem mencatat `electionId` dan alamat contract ke database.
    7. Pemilihan muncul di daftar pemilihan dengan status "Registrasi".

---

### UC-04: Manajemen Draft Pemilihan

*   **ID Use Case**: UC-04
*   **Aktor**: Admin
*   **Deskripsi**: Admin mengatur detail informasi pemilihan seperti judul, deskripsi, aturan, dan tema visual (brand color) sebelum pemilihan tersebut dipublikasikan.
*   **Pre-kondisi**: Pemilihan telah diinisialisasi oleh Super Admin dan Admin telah ditugaskan.
*   **Post-kondisi**: Perubahan detail pemilihan tersimpan di database (tabel `proposal_drafts`).
*   **Skenario Utama**:
    1. Admin masuk ke Dashboard Admin dan memilih menu "Pengaturan Pemilihan".
    2. Admin mengubah Judul Pemilihan, Deskripsi, dan Nama Organisasi.
    3. Admin mengatur skema warna (Theme Color) untuk menyesuaikan dengan branding organisasi.
    4. Admin memasukkan teks "Aturan Pemilihan" yang akan ditampilkan kepada pemilih.
    5. Admin menekan tombol "Simpan Perubahan".
    6. Sistem memvalidasi input dan memperbarui data di database.
*   **Skenario Alternatif**:
    *   **A1 (Input Tidak Lengkap)**: Sistem memberikan peringatan jika field wajib (seperti Judul) kosong.

---

### UC-05: Manajemen Kandidat

*   **ID Use Case**: UC-05
*   **Aktor**: Admin
*   **Deskripsi**: Admin mengelola profil para calon yang akan berkompetisi dalam pemilihan.
*   **Pre-kondisi**: Pemilihan berada pada fase draft atau registrasi.
*   **Post-kondisi**: Data kandidat tersimpan dan siap ditampilkan di halaman voting.
*   **Skenario Utama**:
    1. Admin memilih menu "Kelola Kandidat".
    2. Admin menekan tombol "Tambah Kandidat".
    3. Admin mengunggah Foto Kandidat, Nama Lengkap, NPM, Visi, dan Misi (dalam bentuk poin-poin).
    4. Admin menentukan nomor urut kandidat.
    5. Admin menekan tombol "Simpan".
    6. Sistem menyimpan data ke tabel `proposal_candidates` dan mengunggah foto ke storage Supabase.
*   **Skenario Alternatif**:
    *   **A1 (Edit/Hapus)**: Admin dapat memilih kandidat yang sudah ada untuk memperbarui informasi atau menghapus kandidat jika terjadi pembatalan pencalonan.

---

### UC-06: Manajemen Daftar Pemilih Tetap (DPT)

*   **ID Use Case**: UC-06
*   **Aktor**: Admin
*   **Deskripsi**: Admin mengelola daftar mahasiswa yang memiliki hak suara untuk pemilihan tertentu.
*   **Pre-kondisi**: Admin telah login dan pemilihan berada pada fase "Registrasi".
*   **Post-kondisi**: Daftar Whitelist (DPT) tersimpan di database sistem.
*   **Skenario Utama**:
    1. Admin memilih pemilihan yang sedang dikelola.
    2. Admin masuk ke menu "Manajemen Pemilih/Whitelist".
    3. Admin memilih opsi "Import CSV" atau "Tambah Manual".
    4. Admin mengunggah file CSV berisi daftar NPM dan Alamat Wallet pemilih.
    5. Sistem melakukan validasi format alamat wallet.
    6. Sistem menyimpan daftar pemilih ke database sebagai "Draft Whitelist".
*   **Skenario Alternatif**:
    *   **A1 (Format Salah)**: Sistem mendeteksi format wallet atau data tidak valid, menampilkan baris yang error untuk diperbaiki.

---

### UC-07: Sinkronisasi Whitelist ke Blockchain

*   **ID Use Case**: UC-07
*   **Aktor**: Admin
*   **Deskripsi**: Mendaftarkan daftar pemilih (whitelist) dari database ke dalam Smart Contract agar secara sah dapat memberikan suara di blockchain.
*   **Pre-kondisi**: Daftar DPT sudah diunggah di database dan fase adalah "Registrasi".
*   **Post-kondisi**: Fungsi `registerVoters` pada blockchain berhasil dieksekusi, status sinkronisasi menjadi "Synced".
*   **Skenario Utama**:
    1. Admin menekan tombol "Sinkronisasi ke Blockchain".
    2. Sistem menyiapkan data alamat wallet pemilih dalam bentuk array.
    3. Sistem meminta konfirmasi transaksi melalui wallet Admin.
    4. Transaksi dikirim ke blockchain melalui fungsi `registerVoters`.
    5. Setelah transaksi sukses (confirmed), sistem memperbarui status setiap pemilih di database menjadi "Valid/On-Chain".

---

### UC-10: Memberikan Suara (Commit Vote)

*   **ID Use Case**: UC-10
*   **Aktor**: Voter
*   **Deskripsi**: Voter memberikan suara secara rahasia dengan mengirimkan hash dari pilihannya ke blockchain.
*   **Pre-kondisi**: Voter terdaftar dalam Whitelist, pemilihan berada pada fase "Commit", dan belum pernah memberikan suara.
*   **Post-kondisi**: Hash komitmen tersimpan di blockchain, status voter berubah menjadi "Has Committed".
*   **Skenario Utama**:
    1. Voter memilih kandidat pada antarmuka pemilihan.
    2. Sistem menghasilkan *salt* (string acak) secara otomatis di sisi klien.
    3. Sistem menghitung hash: `keccak256(candidateId, salt)`.
    4. Sistem meminta Voter mengonfirmasi transaksi "Commit Vote".
    5. Transaksi mengirimkan hash tersebut ke Smart Contract.
    6. Sistem menyimpan *salt* dan *candidateId* di penyimpanan lokal (browser) atau database terenkripsi untuk fase Reveal nanti.
    7. Sistem menampilkan notifikasi bahwa suara berhasil dikirim (fase komitmen).

---

### UC-11: Membuka Suara (Reveal Vote)

*   **ID Use Case**: UC-11
*   **Aktor**: Voter
*   **Deskripsi**: Voter membuka rahasia suaranya agar dapat dihitung secara otomatis oleh Smart Contract.
*   **Pre-kondisi**: Pemilihan berada pada fase "Reveal" dan Voter telah melakukan "Commit".
*   **Post-kondisi**: Pilihan voter divalidasi oleh Smart Contract, suara kandidat bertambah, status voter menjadi "Has Revealed".
*   **Skenario Utama**:
    1. Voter membuka kembali halaman pemilihan pada fase Reveal.
    2. Sistem mengambil data *candidateId* dan *salt* yang disimpan sebelumnya.
    3. Voter menekan tombol "Buka Suara (Reveal)".
    4. Sistem meminta konfirmasi transaksi melalui wallet.
    5. Smart Contract memverifikasi apakah `keccak256(pilihan_asli, salt)` cocok dengan hash yang dikirim saat fase Commit.
    6. Jika cocok, suara kandidat tersebut bertambah 1 secara on-chain.
    7. Sistem menampilkan bukti bahwa suara telah berhasil dihitung.

---

### UC-12: Melihat Hasil Pemilihan (Real-time Audit)

*   **ID Use Case**: UC-12
*   **Aktor**: Voter, Admin, Super Admin
*   **Deskripsi**: Menampilkan hasil perhitungan suara yang diambil langsung dari data blockchain.
*   **Pre-kondisi**: Pemilihan telah memasuki fase "Selesai" (atau fase Reveal untuk pantauan sementara).
*   **Post-kondisi**: Pengguna melihat grafik dan tabel hasil perolehan suara.
*   **Skenario Utama**:
    1. Pengguna membuka dashboard pemilihan.
    2. Sistem (melalui Indexer) mengambil event `Revealed` dari blockchain.
    3. Sistem menjumlahkan total suara untuk setiap kandidat secara transparan.
    4. Pengguna dapat melihat detail setiap transaksi reveal di block explorer untuk memastikan keabsahan.
    5. Sistem menampilkan pemenang berdasarkan perolehan suara terbanyak.

---

### UC-13: Mengunduh Bukti Audit (Audit Bundle)

*   **ID Use Case**: UC-13
*   **Aktor**: Voter
*   **Deskripsi**: Voter mengunduh file JSON/PDF yang berisi bukti transaksi blockchain (Commit & Reveal) miliknya sebagai bukti bahwa suaranya benar-benar dihitung.
*   **Pre-kondisi**: Voter telah menyelesaikan fase Reveal.
*   **Post-kondisi**: File bukti audit tersimpan di perangkat Voter.
*   **Skenario Utama**:
    1. Voter masuk ke menu "Profil" atau "Riwayat Pemilihan".
    2. Voter menekan tombol "Unduh Bukti Audit".
    3. Sistem mengumpulkan ID Transaksi (TX Hash) Commit dan Reveal milik voter tersebut.
    4. Sistem mengemas data tersebut ke dalam format dokumen digital.
    5. File diunduh oleh Voter.

---

**Catatan**: Dokumen ini dirancang untuk memenuhi standar SKPL akademik dengan penekanan pada alur integrasi blockchain (Commit-Reveal) dan Onboarding Wallet yang menjadi nilai inovasi skripsi ini.
