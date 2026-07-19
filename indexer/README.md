# Votein Indexer

Blockchain indexer untuk VoteChain. Membaca event dari smart contract di Base Sepolia dan menyimpannya ke database untuk query via GraphQL.

Stack: Ponder · viem · Base Sepolia

## Setup Lokal

```bash
# 1. Copy env
cp .env.example .env

# 2. Isi .env dengan Alchemy API Key
# PONDER_RPC_URL_84532=https://base-sepolia.g.alchemy.com/v2/API_KEY_KAMU

# 3. Install dependencies
npm install

# 4. Run development
npm run dev
```

Indexer akan berjalan di `http://localhost:42069`.

## Deploy ke Railway

### 1. Buat Repository GitHub

Push folder `indexer/` ke GitHub repo baru (atau subfolder dari repo utama).

### 2. Buat Akun Railway

Buka https://railway.app → Sign up dengan GitHub.

### 3. Create Project

1. Klik **"New Project"**
2. Pilih **"Deploy from GitHub repo"**
3. Pilih repository indexer
4. Railway otomatis detect Dockerfile

### 4. Set Environment Variables

Di Railway Dashboard → tab **"Variables"**, tambahkan:

```
PONDER_RPC_URL_84532=https://base-sepolia.g.alchemy.com/v2/API_KEY_KAMU
NEXT_PUBLIC_REGISTRY_ADDRESS=0x4CbCff9fCe200D0c794659D80f6e16C5f7Ad73e8
PONDER_START_BLOCK=42387749
```

### 5. Deploy

Railway otomatis build dan deploy. Tunggu sampai status **"Active"**.

### 6. Ambil URL

Di Railway Dashboard → tab **"Settings"** → **"Networking"** → generate public domain.

Contoh: `https://indexer-xxx.up.railway.app`

### 7. Set di Netlify

Di Netlify Dashboard → Environment Variables:

```
NEXT_PUBLIC_PONDER_URL=https://indexer-xxx.up.railway.app
```

## Env Vars

| Variable | Required | Default | Description |
|---|---|---|---|
| `PONDER_RPC_URL_84532` | Ya | - | Alchemy RPC URL untuk Base Sepolia |
| `NEXT_PUBLIC_REGISTRY_ADDRESS` | Ya | - | Alamat kontrak VoteChainRegistry |
| `PONDER_START_BLOCK` | Tidak | `42387749` | Block number mulai indexing |
| `PONDER_MAX_REQUESTS_PER_SECOND` | Tidak | `3` | Rate limit RPC calls |
| `PONDER_POLLING_INTERVAL_MS` | Tidak | `5000` | Interval polling events |

## Troubleshooting

**Indexer gak jalan:**
- Cek logs di Railway Dashboard → tab "Logs"
- Pastikan `PONDER_RPC_URL_84532` valid
- Pastikan Alchemy API Key belum expired

**Frontend gak dapat data:**
- Cek `NEXT_PUBLIC_PONDER_URL` di Netlify
- Buka `{ponder_url}/graphql` di browser — harusnya ada GraphQL playground

**Indexer lambat:**
- Default rate limit: 3 req/detik (hemat Alchemy quota)
- Naikkan `PONDER_MAX_REQUESTS_PER_SECOND` kalau quota cukup
