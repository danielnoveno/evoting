# Setup Git Auto Deploy — VoteChain ke cPanel

## Prasyarat
- Repo GitHub: `danielnoveno/evoting`
- cPanel Arenahost dengan **Git Version Control** feature

---

## Step 1: Setup di cPanel

1. Login cPanel Arenahost
2. Buka **Git Version Control** (atau **Version Control**)
3. Klik **Create**
4. Isi:
   - **Repository URL**: `https://github.com/danielnoveno/evoting.git`
   - **Repository Path**: `votein-app` (atau folder apapun, jangan `public_html` langsung)
   - **Branch**: `main` (atau `master`)
5. Klik **Create & Deploy**
6. Tunggu selesai clone

---

## Step 2: Setup Deployment Hook

1. Di **Git Version Control**, klik repo yang tadi dibuat
2. Buka tab **Deployment** atau **Manage**
3. Set **Deployment Document Root**: sesuaikan (misal `public_html`)
4. **Post-Deployment Hook** — paste script ini:

```bash
cd /home/user/votein-app  # path repo kamu
bash deploy.sh
```

Atau kalau gak ada hook, jalankan manual setiap push:
```bash
cd ~/votein-app
bash deploy.sh
```

---

## Step 3: Workflow Sehari-hari

### Edit kode di lokal:
```bash
cd "Skripsi - Evoting"

# Edit files...
# ...

# Push ke GitHub
git add .
git commit -m "feat: description"
git push origin main
```

### cPanel auto-deploy:
- Kalau hook aktif → otomatis jalan setelah push
- Kalau gak ada hook → login cPanel → Git Version Control → klik **Deploy**

---

## Step 4: First Time Setup di Server

SSH ke server (atau cPanel Terminal):
```bash
cd ~/votein-app  # atau path repo kamu
npm install --omit=dev
npm run build
npm start
```

---

## Troubleshooting

### Build gagal di server?
- Pastikan Node.js version >= 20
- Cek log: `cat /tmp/votein.log`
- Coba manual: `cd ~/votein-app/frontend && npm install --omit=dev && npm run build`

### App gak start?
- Cek port: `lsof -i :3000`
- Kill lama: `pkill -f "next start"`
- Start: `npm start`
