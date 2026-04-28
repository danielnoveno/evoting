# VoteChain Frontend (Next.js + OnchainKit + Wagmi)

Frontend ini disiapkan sesuai konteks skripsi VoteChain:
- UI bahasa Indonesia
- integrasi wallet via **Wagmi**
- komponen onboarding/experience via **OnchainKit**
- target jaringan **Base Sepolia (84532)**

## Perintah awal (OnchainKit)

Jika ingin re-bootstrap dari nol dengan pola OnchainKit, gunakan perintah awal:

```bash
npx create-onchain@latest
```

Lalu sesuaikan ke struktur di folder ini (App Router + Wagmi config di `src/lib/wagmi.ts`).

## Menjalankan frontend

```bash
cp .env.example .env.local
npm install
npm run dev
```

Jika environment Linux kamu mengalami `Bus error (core dumped)` saat menjalankan Next (karena native SWC), gunakan mode wasm:

```bash
npm run dev:wasm
npm run build:wasm
```

Script wasm sudah disiapkan dengan:
- `NODE_OPTIONS=--no-addons`
- `NEXT_TEST_WASM_DIR=./node_modules/@next/swc-wasm-nodejs`

## Struktur utama

```text
src/
  app/
  components/
  hooks/
  lib/
  providers.tsx
```

## Catatan skripsi

- Fase voting harus berurutan: Registration -> Commit -> Reveal -> Ended.
- Mekanisme commit-reveal disiapkan di `src/lib/commitment.ts`.
- Tautan bukti transaksi BaseScan disiapkan di `src/lib/basescan.ts`.

## Halaman publik yang sudah dipetakan dari Stitch

- `/` → Landing Page - Public Area
- `/cara-kerja` → Cara Kerja - Public Area
- `/pemilihan` → Daftar Pemilihan - Public Area
- `/pemilihan/[id]/hasil` → Detail Hasil & Audit Trail
