# Votein Smart Contracts

Modul ini berisi implementasi *smart contracts* berbasis Solidity untuk sistem e-voting terdesentralisasi. Pengembangan dilakukan menggunakan framework **Foundry**.

## Fitur Utama
- **Alur Pemilihan Terstruktur**: Mendukung transisi fase otomatis (Registration -> Commit -> Reveal -> Ended).
- **Keamanan Commit-Reveal**: Implementasi skema `keccak256(abi.encodePacked(candidateId, salt))` untuk menjaga kerahasiaan suara.
- **Validasi Whitelist**: Memastikan hanya alamat dompet yang terdaftar yang dapat memberikan suara.
- **Integritas Data**: Pencegahan pemungutan suara ganda (*double voting*) dan manipulasi hasil.

## Struktur Direktori
- `src/` — Kode sumber kontrak pintar (Solidity).
- `test/` — Pengujian unit dan integrasi menggunakan Forge.
- `script/` — Skrip otomatisasi deployment dan verifikasi kontrak ke jaringan Base Sepolia.
