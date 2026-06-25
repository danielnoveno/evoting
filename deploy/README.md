# VoteChain — cPanel VPS Deployment Guide

Panduan lengkap deploy VoteChain ke cPanel VPS sebagai backup dari services utama (Netlify, Railway, Supabase).

## Arsitektur

```
PRIMARY (Production):
├── Netlify     → Frontend (Next.js)
├── Railway     → Ponder Indexer
└── Supabase    → PostgreSQL Database

BACKUP (cPanel VPS: votein.biz.id):
├── Frontend    → Next.js Node.js app via PM2
├── Indexer     → Ponder via PM2
├── Database    → PostgreSQL (restore dari Supabase)
└── Domain      → votein.biz.id
```

## Prasyarat

- VPS dengan cPanel 136.0.24
- Node.js v20+ (via nvm)
- PostgreSQL client (untuk backup)
- Domain votein.biz.id sudah pointing ke VPS IP

## Quick Start

```bash
# 1. Clone repo ke VPS
cd /home/voteinbi
git clone <your-repo-url> app
cd app

# 2. Jalankan full setup
bash deploy/scripts/setup-vps.sh full

# 3. Edit environment variables
nano frontend/.env
nano indexer/.env

# 4. Setup SSL di cPanel
# WHM → SSL/TLS → Let's Encrypt → votein.biz.id

# 5. Test
curl -I https://votein.biz.id
```

## Scripts

### setup-vps.sh
Full VPS setup termasuk install dependencies, clone repo, deploy frontend & indexer.

```bash
bash deploy/scripts/setup-vps.sh [full|frontend-only|indexer-only|db-only]
```

### backup-db.sh
Automated backup dari Supabase ke VPS lokal.

```bash
bash deploy/scripts/backup-db.sh [daily|manual]
```

Cron job (otomatis):
```
0 2 * * * /home/voteinbi/app/deploy/scripts/backup-db.sh daily
```

### deploy-frontend.sh
Build dan deploy Next.js frontend.

```bash
bash deploy/scripts/deploy-frontend.sh [static|server]
```

- `static`: Export sebagai file statis (tanpa API routes)
- `server`: Jalankan sebagai Node.js app dengan PM2

### deploy-indexer.sh
Manage Ponder indexer.

```bash
bash deploy/scripts/deploy-indexer.sh [install|start|stop|restart|status|logs]
```

## PM2 Commands

```bash
# Check status
pm2 status

# Restart semua
pm2 restart all

# Logs
pm2 logs votein-frontend
pm2 logs votein-indexer

# Auto-start saat reboot
pm2 save
pm2 startup
```

## Domain Setup

### 1. DNS Configuration
Di registrar domain:
```
A Record:  @    → <VPS_IP_ADDRESS>
A Record:  www  → <VPS_IP_ADDRESS>
```

### 2. SSL Certificate
Di cPanel:
```
SSL/TLS → Let's Encrypt → votein.biz.id → Issue
```

### 3. Reverse Proxy
Upload `deploy/htaccess` ke `/home/voteinbi/public_html/.htaccess`

**Requirements:**
- WHM → EasyApache 4 → Install `mod_proxy`, `mod_proxy_http`

## Environment Variables

### Frontend (frontend/.env)
```bash
# Copy dari .env.production.example
cp frontend/.env.production.example frontend/.env

# Edit dengan values production
nano frontend/.env
```

Wajib diisi:
- `NEXT_PUBLIC_REGISTRY_ADDRESS`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY`
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`

### Indexer (indexer/.env)
```bash
# Sudah dibuat otomatis oleh setup-vps.sh
nano indexer/.env
```

Wajib diisi:
- `PONDER_RPC_URL_84532`
- `NEXT_PUBLIC_REGISTRY_ADDRESS`

## Backup Strategy

### Database
- **Otomatis**: Cron job backup harian jam 2 AM
- **Manual**: `bash deploy/scripts/backup-db.sh manual`
- **Restore**: `gunzip < backup.sql.gz | psql -U postgres -d votein`

### Frontend & Indexer
- **Code**: Git repository (otomatis terbackup)
- **Build**: Jalankan `setup-vps.sh` lagi untuk rebuild
- **Logs**: `/home/voteinbi/backups/logs/`

## Monitoring

### Check Services
```bash
# PM2 status
pm2 status

# Node.js processes
ps aux | grep node

# Port usage
netstat -tlnp | grep -E '3000|42069'

# Disk usage
df -h /home/voteinbi

# Logs
tail -f /home/voteinbi/backups/logs/*.log
```

### Alert Setup (Opsional)
Tambahkan monitoring script:
```bash
# /home/voteinbi/monitor.sh
#!/bin/bash
if ! pm2 status votein-frontend | grep -q "online"; then
    echo "Frontend down!" | mail -s "VoteChain Alert" your@email.com
fi
```

Cron:
```
*/5 * * * * /home/voteinbi/monitor.sh
```

## Troubleshooting

### Frontend tidak bisa akses
```bash
# Cek PM2 status
pm2 status

# Cek logs
pm2 logs votein-frontend

# Restart
pm2 restart votein-frontend

# Cek port
netstat -tlnp | grep 3000
```

### Indexer error
```bash
# Cek logs
pm2 logs votein-indexer

# Restart
pm2 restart votein-indexer

# Rebuild
cd /home/voteinbi/app/indexer
npm run codegen
pm2 restart votein-indexer
```

### Database backup gagal
```bash
# Cek pg_dump
which pg_dump

# Test manual
PGPASSWORD=your_password pg_dump -h db.cuxoheyjxjeeqpxtfssb.supabase.co -U postgres -d postgres > test.sql

# Cek cron
crontab -l | grep backup
```

### SSL Certificate expired
```bash
# Auto-renew di cPanel
# Atau manual:
 certbot renew --cert-name votein.biz.id
```

## Security Checklist

- [ ] Semua secrets tidak di-commit ke repo
- [ ] `.env.production` di-gitignore
- [ ] SSL aktif di https://votein.biz.id
- [ ] Firewall aktif (cPanel default)
- [ ] PM2 tidak exposed ke public
- [ ] Database hanya akses dari localhost
- [ ] Backup terenkripsi (opsional)

## Architecture Notes

### Primary vs Backup
- **Primary** (Netlify/Railway/Supabase): Production utama
- **Backup** (cPanel VPS): Fallback jika primary down
- **Domain**: votein.biz.id pointing ke backup VPS

### Failover
Jika Netlify down:
1. DNS votein.biz.id sudah pointing ke VPS
2. Frontend sudah jalan di VPS
3. User otomatis ke VPS

Jika Supabase down:
1. Database sudah di-backup ke VPS
2. Restore ke PostgreSQL lokal
3. Update `.env` ke local database

## File Structure

```
deploy/
├── scripts/
│   ├── backup-db.sh          # Database backup
│   ├── deploy-frontend.sh    # Frontend deployment
│   ├── deploy-indexer.sh     # Indexer management
│   └── setup-vps.sh         # Full VPS setup
├── ecosystem.config.js       # PM2 configuration
├── htaccess                  # Reverse proxy config
└── README.md                 # This file
```

## Support

Untuk masalah deployment, cek:
1. PM2 logs: `pm2 logs`
2. System logs: `/home/voteinbi/backups/logs/`
3. cPanel error logs: WHM → Service Status → Apache Logs
