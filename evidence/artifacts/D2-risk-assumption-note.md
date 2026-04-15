# D2-risk-assumption-note

## Risiko Kunci
1. **Security regression** jika guard fase atau whitelist tidak konsisten.
2. **Salt loss** jika localStorage gagal saat commit.
3. **Scope creep** jika fitur P1/P2 dikerjakan sebelum P0 hijau.
4. **Evidence gap** bila tx/screenshot tidak dikumpulkan saat uji.

## Asumsi Kerja
1. Pengujian dilakukan pada Base Sepolia dengan testnet ETH tersedia.
2. Wallet pemilih unik per partisipan untuk simulasi.
3. Akses admin dan voter dipisahkan pada akun wallet berbeda.

## Mitigasi Awal
- Terapkan stage gate sebelum pindah tahap.
- Gunakan tabel bukti + log harian.
- Wajib negative-path test untuk whitelist, wrong phase, mismatch, double action.
