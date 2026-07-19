# Panduan Lengkap Deploy VoteChain ke cPanel VPS (ARSIP — DIRETIR)

> ⚠️ **STATUS: cPanel/VPS frontend (votein.biz.id) dan replika MySQL SUDAH DIRETIR.**
> - Frontend production sekarang dihosting di **Vercel**.
> - Database off-chain hanya **Supabase (PostgreSQL)**; replika MySQL di VPS tidak dipakai.
> - Indexer Ponder tetap berjalan di VPS, diakses lewat proxy server `/api/indexer/graphql`.
> Panduan ini tersisa sebagai arsip saja; jangan gunakan untuk deploy baru.

Panduan step-by-step dari nol sampai website jalan di `votein.biz.id`.

---

## 📋 Daftar Isi

1. [Akses VPS via SSH](#1-akses-vps-via-ssh)
2. [Install Node.js via nvm](#2-install-nodejs-via-nvm)
3. [Install PM2](#3-install-pm2)
4. [Clone Repository](#4-clone-repository)
5. [Setup Frontend](#5-setup-frontend)
6. [Setup Indexer](#6-setup-indexer)
7. [Setup Domain di cPanel](#7-setup-domain-di-cpanel)
8. [Setup SSL Certificate](#8-setup-ssl-certificate)
9. [Setup Reverse Proxy](#9-setup-reverse-proxy)
10. [Setup Database Backup](#10-setup-database-backup)
11. [Testing & Verifikasi](#11-testing--verifikasi)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Akses VPS via SSH

### Dari Windows (PuTTY)

1. Download PuTTY dari https://www.putty.org/
2. Buka PuTTY
3. Masukkan:
   - **Host Name**: IP VPS kamu (contoh: `103.xxx.xxx.xxx`)
   - **Port**: `22`
4. Klik **Open**
5. Saat muncul `login as:`, ketik:
   ```
   voteinbi
   ```
6. Masukkan password VPS kamu
7. Tekan Enter

### Dari Mac/Linux (Terminal)

Buka Terminal, ketik:
```bash
ssh voteinbi@IP_VPS_KAMU
```

Contoh:
```bash
ssh voteinbi@103.152.116.45
```

Masukkan password saat diminta.

### Cek Berhasil Login

Setelah berhasil login, kamu akan melihat:
```
[voteinbi@bekantan ~]$
```

Ketik ini untuk cek:
```bash
hostname
```
Harusnya muncul: `bekantan` atau nama VPS kamu.

---

## 2. Install Node.js via nvm

Node.js sudah terinstall di VPS kamu (v20.20.2). Tapi kita pastikan pakai nvm untuk managing versi.

### Cek Node.js yang Sudah Ada

```bash
which node
node -v
npm -v
```

Harusnya muncul:
```
~/.nvm/versions/node/v20.20.2/bin/node
v20.20.2
10.x.x
```

### Jika Belum Ada / Mau Install Ulang

```bash
# Download nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js 20
nvm install 20

# Set default
nvm alias default 20

# Verifikasi
node -v
npm -v
```

---

## 3. Install PM2

PM2 adalah process manager untuk menjalankan Node.js app di background.

### Install PM2

```bash
npm install -g pm2
```

### Verifikasi

```bash
pm2 -v
```

Harusnya muncul versi PM2 (contoh: `5.3.0`).

### Setup Auto-start saat Reboot

```bash
pm2 startup
```

Ikuti instruksi yang muncul (biasanya ada perintah yang harus dijalankan).

### Simpan Konfigurasi

```bash
pm2 save
```

---

## 4. Clone Repository

### Buat Folder App

```bash
mkdir -p /home/voteinbi/app
cd /home/voteinbi/app
```

### Clone Repository

```bash
git clone https://github.com/danielnoveno/evoting.git .
```

**Catatan**: 
- URL repo: `https://github.com/danielnoveno/evoting`
- Titik `.` di akhir artinya clone ke folder saat ini (`/home/voteinbi/app`)

### Verifikasi

```bash
ls -la
```

Harusnya muncul file-file seperti:
```
contracts/
frontend/
indexer/
deploy/
package.json
...
```

### Checkout Branch Deploy

```bash
git checkout deploy/cpanel-backup
```

---

## 5. Setup Frontend

### Masuk ke Folder Frontend

```bash
cd /home/voteinbi/app/frontend
```

### Buat File Environment

```bash
cp .env.production.example .env
```

### Edit File Environment

```bash
nano .env
```

Akan terbuka editor nano. Edit setiap baris dengan values yang benar:

```bash
# ─── Blockchain (wajib) ─────────────────────────────────────────────
NEXT_PUBLIC_REGISTRY_ADDRESS=0xFc63e575f1Ca4AB8F979Fc6dCb31B4D638020610
NEXT_PUBLIC_BASE_SEPOLIA_CHAIN_ID=84532
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_BASESCAN_EXPLORER_URL=https://sepolia.basescan.org
NEXT_PUBLIC_PAYMASTER_URL=https://api.developer.coinbase.com/rpc/v1/base-sepolia/YOUR_KEY_DISINI

# ─── OnChainKit (wajib) ─────────────────────────────────────────────
NEXT_PUBLIC_ONCHAINKIT_API_KEY=YOUR_ONCHAINKIT_KEY_DISINI

# ─── Supabase (wajib) ───────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://cuxoheyjxjeeqpxtfssb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_DISINI
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_DISINI

# ─── Site URL (WAJIB update ke domain) ──────────────────────────────
NEXT_PUBLIC_SITE_URL=https://votein.biz.id
NEXT_PUBLIC_APP_URL=https://votein.biz.id

# ─── SMTP Email (WAJIB untuk email aktivasi) ────────────────────────
SMTP_HOST=bekantan.kencang.com
SMTP_PORT=465
SMTP_USER=noreply@votein.biz.id
SMTP_PASSWORD=PASSWORD_EMAIL_DISINI
EMAIL_FROM=noreply@votein.biz.id
EMAIL_FROM_NAME=Sistem Votein
```

**Cara save di nano:**
1. Tekan `Ctrl + O` (huruf O)
2. Tekan `Enter`
3. Tekan `Ctrl + X`

### Install Dependencies

```bash
cd /home/voteinbi/app/frontend
npm install
```

Tunggu sampai selesai (bisa 1-3 menit).

### Build Frontend

```bash
npm run build
```

Tunggu sampai selesai (bisa 3-5 menit).

### Jalankan dengan PM2

```bash
pm2 start npm --name "votein-frontend" -- start
```

### Verifikasi

```bash
pm2 status
```

Harusnya muncul:
```
┌─────┬──────────────────┬──────┬──────┬───────┬──────────┐
│ id  │ name             │ mode │ ↺    │ status│ cpu      │
├─────┼──────────────────┼──────┼──────┼───────┼──────────┤
│ 0   │ votein-frontend  │ fork │ 0    │ online│ 0%       │
└─────┴──────────────────┴──────┴──────┴───────┴──────────┘
```

### Simpan PM2 Config

```bash
pm2 save
```

### Cek Port

```bash
netstat -tlnp | grep 3000
```

Harusnya muncul:
```
tcp        0      0 127.0.0.1:3000          0.0.0.0:*               LISTEN      12345/node
```

---

## 6. Setup Indexer

### Masuk ke Folder Indexer

```bash
cd /home/voteinbi/app/indexer
```

### Install Dependencies

```bash
npm install
```

### Buat File Environment

```bash
nano .env
```

Isi dengan:
```bash
PONDER_RPC_URL_84532=https://sepolia.base.org
NEXT_PUBLIC_REGISTRY_ADDRESS=0xFc63e575f1Ca4AB8F979Fc6dCb31B4D638020610
PONDER_START_BLOCK=42387749
PONDER_MAX_REQUESTS_PER_SECOND=3
PONDER_POLLING_INTERVAL_MS=5000
```

Save dengan `Ctrl + O`, `Enter`, `Ctrl + X`.

### Build Indexer

```bash
npm run codegen
```

### Jalankan dengan PM2

```bash
pm2 start npm --name "votein-indexer" -- start
```

### Verifikasi

```bash
pm2 status
```

Harusnya muncul 2 processes:
```
┌─────┬──────────────────┬──────┬──────┬───────┬──────────┐
│ id  │ name             │ mode │ ↺    │ status│ cpu      │
├─────┼──────────────────┼──────┼──────┼───────┼──────────┤
│ 0   │ votein-frontend  │ fork │ 0    │ online│ 0%       │
│ 1   │ votein-indexer   │ fork │ 0    │ online│ 0%       │
└─────┴──────────────────┴──────┴──────┴───────┴──────────┘
```

### Simpan PM2 Config

```bash
pm2 save
```

---

## 7. Setup Domain di cPanel

### Login cPanel

1. Buka browser
2. Ketik: `http://IP_VPS_KAMU:2083` atau `https://IP_VPS_KAMU:2083`
3. Masukkan username dan password cPanel

### Setup Zone Editor (DNS)

1. Di cPanel, cari menu **"Zone Editor"** atau **"DNS Zone Editor"**
2. Klik **"Manage"** di sebelah domain `votein.biz.id`
3. Jika belum ada, klik **"Add Record"** → **"A Record"**

### Tambah A Record

Klik **"Add Record"** lalu isi:

**Record 1:**
- **Type**: A
- **Name**: `@` (atau ketik `votein.biz.id`)
- **Record**: `<IP_VPS_KAMU>` (contoh: `103.152.116.45`)
- **TTL**: 14400

Klik **"Add Record"**

**Record 2:**
- **Type**: A
- **Name**: `www`
- **Record**: `<IP_VPS_KAMU>` (IP yang sama)
- **TTL**: 14400

Klik **"Add Record"**

### Verifikasi DNS

Buka Terminal di komputer kamu, ketik:
```bash
nslookup votein.biz.id
```

Harusnya muncul IP VPS kamu.

Atau buka https://dnschecker.org/ dan masukkan `votein.biz.id`.

---

## 8. Setup SSL Certificate

### Login cPanel

1. Buka `https://IP_VPS_KAMU:2083`
2. Login dengan credentials cPanel

### Install Let's Encrypt

1. Di cPanel, cari menu **"SSL/TLS Status"** atau **"Let's Encrypt"**
2. Klik **"Let's Encrypt"** atau **"SSL/TLS"**

### Issue Certificate

1. Di bawah **"Let's Encrypt SSL"**, cari domain `votein.biz.id`
2. Klik checkbox di sebelah domain
3. Klik **"Issue"** atau **"Install"**
4. Tunggu sampai selesai

### Verifikasi SSL

Buka browser, akses:
```
https://votein.biz.id
```

Harusnya ada ikon gembok hijau di address bar.

---

## 9. Setup Reverse Proxy

### Enable mod_proxy

1. Login ke **WHM** (Web Host Manager): `https://IP_VPS_KAMU:2087`
2. Cari **"EasyApache 4"**
3. Di bagian **"Apache Modules"**, cari dan centang:
   - `mod_proxy`
   - `mod_proxy_http`
4. Klik **"Apply Configuration"**

### Upload .htaccess

**Cara 1: Via cPanel File Manager**

1. Login cPanel
2. Buka **"File Manager"**
3. Navigasi ke `/home/voteinbi/public_html/`
4. Klik **"Upload"** di toolbar
5. Upload file `deploy/htaccess` dari komputer kamu
6. Setelah upload, rename file dari `htaccess` ke `.htaccess`
   - Klik kanan file `htaccess` → **Rename** → ketik `.htaccess`

**Cara 2: Via SSH**

```bash
cp /home/voteinbi/app/deploy/htaccess /home/voteinbi/public_html/.htaccess
```

### Verifikasi

Buka browser, akses:
```
https://votein.biz.id
```

Harusnya website VoteChain muncul.

---

## 10. Setup Database Backup

### Install PostgreSQL Client

```bash
sudo yum install postgresql -y
```

### Buat Folder Backup

```bash
mkdir -p /home/voteinbi/backups/database
mkdir -p /home/voteinbi/backups/logs
```

### Setup Cron Job

```bash
crontab -e
```

Tambahkan baris ini di akhir file:
```bash
0 2 * * * /home/voteinbi/app/deploy/scripts/backup-db.sh daily >> /home/voteinbi/backups/logs/backup.log 2>&1
```

**Cara save di crontab:**
1. Tekan `Esc`
2. Ketik `:wq`
3. Tekan `Enter`

### Test Backup Manual

```bash
cd /home/voteinbi/app
bash deploy/scripts/backup-db.sh manual
```

---

## 11. Testing & Verifikasi

### Cek Semua Services

```bash
# Cek PM2 status
pm2 status

# Cek logs frontend
pm2 logs votein-frontend --lines 20

# Cek logs indexer
pm2 logs votein-indexer --lines 20

# Cek port
netstat -tlnp | grep -E '3000|42069'
```

### Test Akses Website

Buka browser, akses:
```
https://votein.biz.id
```

Harusnya:
- Website VoteChain muncul
- Ada ikon gembok hijau (SSL)
- Bisa login
- Bisa connect wallet

### Cek API Routes

```bash
# Test RPC proxy
curl -I https://votein.biz.id/api/rpc/base-sepolia

# Test auth
curl -I https://votein.biz.id/api/auth/callback
```

### Cek PM2 Auto-start

```bash
# Restart VPS (jika aman)
sudo reboot

# Setelah reboot, cek PM2
pm2 status
```

Harusnya kedua services tetap online.

---

## 12. Troubleshooting

### Website Tidak Muncul

**Cek 1: PM2 Status**
```bash
pm2 status
```
Jika status `errored`, cek logs:
```bash
pm2 logs votein-frontend --lines 50
```

**Cek 2: Port**
```bash
netstat -tlnp | grep 3000
```
Jika port tidak ada, restart PM2:
```bash
pm2 restart votein-frontend
```

**Cek 3: Reverse Proxy**
```bash
cat /home/voteinbi/public_html/.htaccess
```
Pastikan file ada dan benar.

### SSL Error

**Cek Certificate**
```bash
# Via cPanel
SSL/TLS → SSL Certificates

# Pastikan certificate active untuk votein.biz.id
```

**Renew Certificate**
```bash
# Via cPanel → Let's Encrypt → Renew
```

### Database Connection Error

**Cek Environment Variables**
```bash
cat /home/voteinbi/app/frontend/.env | grep SUPABASE
```

Pastikan values benar.

### PM2 Process Down

```bash
# Restart specific process
pm2 restart votein-frontend

# Restart all
pm2 restart all

# Check logs
pm2 logs --lines 100
```

### DNS Belum Propagate

```bash
# Cek DNS
nslookup votein.biz.id

# Atau gunakan
dig votein.biz.id
```

Jika belum pointing ke IP VPS, tunggu 1-24 jam untuk propagasi.

---

## 📝 Quick Reference

### PM2 Commands
```bash
pm2 status                    # Cek status
pm2 restart votein-frontend   # Restart frontend
pm2 restart votein-indexer    # Restart indexer
pm2 logs votein-frontend      # Lihat logs
pm2 stop votein-frontend      # Stop service
pm2 delete votein-frontend    # Hapus service
pm2 save                      # Simpan config
pm2 startup                   # Setup auto-start
```

### File Locations
```
/home/voteinbi/app/                    # Repository
/home/voteinbi/app/frontend/           # Frontend code
/home/voteinbi/app/indexer/            # Indexer code
/home/voteinbi/app/frontend/.env       # Frontend env vars
/home/voteinbi/app/indexer/.env        # Indexer env vars
/home/voteinbi/public_html/            # Web root (public)
/home/voteinbi/backups/                # Backup files
/home/voteinbi/backups/logs/           # Log files
```

### Ports
```
3000   → Frontend (Next.js)
42069  → Indexer (Ponder)
2083   → cPanel (HTTPS)
2087   → WHM (HTTPS)
```

---

## ✅ Checklist Setelah Deploy

- [ ] Website aksesible di https://votein.biz.id
- [ ] SSL aktif (ikon gembok hijau)
- [ ] PM2 status online untuk kedua services
- [ ] Auto-start PM2 sudah setup
- [ ] Database backup cron sudah aktif
- [ ] Environment variables sudah benar
- [ ] Reverse proxy (.htaccess) sudah terpasang

---

## 🆘 Butuh Bantuan?

Jika ada masalah, cek:
1. PM2 logs: `pm2 logs`
2. cPanel error logs: WHM → Service Status → Apache Logs
3. Backup logs: `/home/voteinbi/backups/logs/`
