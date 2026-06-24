# Panduan Deploy VoteChain ke cPanel (votein.biz.id)

## Yang Dibutuhkan
- File `~/votein-deploy.tar.gz` (3.4MB)
- Login cPanel Arenahost
- Node.js selector di cPanel (cek di Software → Setup Node.js App)

---

## Step 1: Upload ke cPanel

1. Login cPanel Arenahost
2. Buka **File Manager**
3. Navigate ke `public_html`
4. Klik **Upload** → pilih `votein-deploy.tar.gz`
5. Setelah upload selesai, klik kanan file → **Extract** → Extract ke `public_html/`
6. Hasilnya: `public_html/votein-deploy/` berisi semua file

---

## Step 2: Setup Node.js App

1. Di cPanel, buka **Software → Setup Node.js App**
2. Klik **Create Application**
3. Isi:
   - **Node.js version**: paling tinggi yang tersedia (misal 20 atau 22)
   - **Application mode**: Production
   - **Application root**: `votein-deploy` (folder yang tadi di-extract)
   - **Application startup file**: (kosongkan, nanti otomatis)
   - **Port**: `3000` (atau port lain yang tersedia)
4. Klik **Create**
5. Tunggu selesai install dependencies
6. Klik **Run JS Script** → isi: `npm start`
7. Aplikasi jalan di port yang dipilih

---

## Step 3: Setup Domain ke Node.js

1. Di cPanel, buka **Domains** (atau **Addon Domains**)
2. Buat domain `votein.biz.id` pointing ke folder `votein-deploy`
3. **ATAU** kalau domain udah pointing ke hosting:
   - Buka **Node.js App** → klik app yang tadi dibuat
   - **Proxy**: enable → masukkan URL port (misal `http://127.0.0.1:3000`)
   - Domain: `votein.biz.id`

**Alternatif**: Kalau cPanel gak support reverse proxy otomatis, bisa pakai `.htaccess`:

```apache
# .htaccess di public_html
RewriteEngine On
RewriteCond %{HTTP_HOST} ^votein\.biz\.id$ [NC]
RewriteCond %{REQUEST_URI} !^/_next/
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

---

## Step 4: SSL Certificate

1. Di cPanel, buka **SSL/TLS** → **Let's Encrypt**
2. Pilih domain `votein.biz.id`
3. Klik **Issue** → selesai
4. Force HTTPS dari **Domains** → toggle "Force HTTPS Redirect"

---

## Step 5: Test

1. Buka `https://votein.biz.id`
2. Cek landing page muncul
3. Cek `/cara-kerja` dan `/pemilihan`

---

## Troubleshooting

### App gak jalan?
```bash
# Via cPanel Terminal atau SSH
cd ~/votein-deploy
npm install --omit=dev
npm start
```

### Error 502 Bad Proxy?
- Pastikan port Node.js benar
- Pastikan app running (cek log di Node.js App selector)
- Coba `curl http://127.0.0.1:3000` di terminal cPanel

### Environment variables hilang?
- Buka Node.js App → klik app → Edit → Environment Variables
- Tambahin variabel yang dibutuhkan (atau edit `.env` di folder `votein-deploy`)
