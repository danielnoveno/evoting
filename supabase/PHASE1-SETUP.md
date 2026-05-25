# B1-SUPABASE-PHASE1-SETUP

Status: implemented

## Scope build phase 1
- Menyiapkan workspace `supabase/`
- Menambahkan dependency frontend untuk Supabase dan data fetching
- Menambahkan util dasar browser/server/middleware
- Menambahkan provider `react-query`
- Menambahkan guardrail konfigurasi backend pada layout

## File yang ditambahkan/diubah
- `supabase/README.md`
- `supabase/config.toml`
- `supabase/migrations/.gitkeep`
- `supabase/seed/.gitkeep`
- `supabase/functions/.gitkeep`
- `frontend/.env.example`
- `frontend/middleware.ts`
- `frontend/src/lib/supabase/config.ts`
- `frontend/src/lib/supabase/database.types.ts`
- `frontend/src/lib/supabase/browser.ts`
- `frontend/src/lib/supabase/server.ts`
- `frontend/src/lib/supabase/middleware.ts`
- `frontend/src/components/ui/providers.tsx`
- `frontend/src/components/ui/backend-status-banner.tsx`
- `frontend/src/app/layout.tsx`

## Validasi
- `npm run typecheck` ✅
- `npm run build` ✅

## Catatan batas implementasi
- Belum ada schema tabel Supabase final
- Belum ada RLS policy
- Belum ada hook repository per fitur
- Belum ada integrasi Ponder ke schema `indexer.*`
- Belum ada migrasi dari mock store ke query live
