# ROUTE AUDIT — VoteChain Frontend → Low‑Fi Prototype

> **Status:** Complete  
> **Tanggal:** 2026-06-18  
> **Total route di frontend Next.js:** 53 file `page.tsx`  
> **Total route di low‑fi prototype:** 54 (53 real + 1 generated: `/route-coverage`)  
> **Prototipe:** `.docs/low-fi-design/` (SPA hash‑based, vanilla HTML/CSS/JS)

---

## Layout Patterns Digunakan

| Pattern | Struktur | Route Prefix |
|---------|----------|-------------|
| **A — Dashboard** | Fixed sidebar 280px + sticky navbar + konten + footer | `/admin/*`, `/superadmin/*`, `/pemilih/*` |
| **B — Public** | Top navbar tanpa sidebar | `/`, `/pemilihan`, `/cara-kerja`, dll |
| **C — Auth** | Centered card | `/auth/*` |

---

## Daftar Route

| No | Route | Source (Next.js) | Role | Layout | Status |
|----|-------|-------------------|------|--------|--------|
| | **PUBLIC** | | | | |
| 1 | `/` | `frontend/src/app/page.tsx` | semua | Public | ✅ Selesai |
| 2 | `/pemilihan` | `frontend/src/app/pemilihan/page.tsx` | semua | Public | ✅ Selesai |
| 3 | `/pemilihan/[id]/hasil` | `frontend/src/app/pemilihan/[id]/hasil/page.tsx` | semua | Public | ✅ Selesai |
| 4 | `/cara-kerja` | `frontend/src/app/cara-kerja/page.tsx` | semua | Public | ⬜ Placeholder |
| 5 | `/hubungkan-dompet` | `frontend/src/app/hubungkan-dompet/page.tsx` | semua | Public | ⬜ Placeholder |
| 6 | `/kebijakan-privasi` | `frontend/src/app/kebijakan-privasi/page.tsx` | semua | Public | ⬜ Placeholder |
| 7 | `/ketentuan-layanan` | `frontend/src/app/ketentuan-layanan/page.tsx` | semua | Public | ⬜ Placeholder |
| 8 | `/portal-admin` | `frontend/src/app/portal-admin/page.tsx` | public, admin, superadmin | Public | ⬜ Placeholder |
| | **AUTH** | | | | |
| 9 | `/auth/reset-password` | `frontend/src/app/auth/reset-password/page.tsx` | public | Auth | ⬜ Placeholder |
| 10 | `/auth/aktivasi-admin` | `frontend/src/app/auth/aktivasi-admin/page.tsx` | public | Auth | ⬜ Placeholder |
| 11 | `/auth/update-password` | `frontend/src/app/auth/update-password/page.tsx` | semua | Auth | ⬜ Placeholder |
| | **VOTER** | | | | |
| 12 | `/pemilih` | `frontend/src/app/pemilih/page.tsx` | voter | Dashboard | ✅ Selesai |
| 13 | `/pemilih/bantuan` | `frontend/src/app/pemilih/bantuan/page.tsx` | voter | Dashboard | ⬜ Placeholder |
| 14 | `/pemilih/bukti-saya` | `frontend/src/app/pemilih/bukti-saya/page.tsx` | voter | Dashboard | ⬜ Placeholder |
| 15 | `/pemilih/profil` | `frontend/src/app/pemilih/profil/page.tsx` | voter | Dashboard | ⬜ Placeholder |
| 16 | `/pemilih/pemilihan/[id]/pilih-kandidat` | `frontend/src/app/pemilih/pemilihan/[id]/pilih-kandidat/page.tsx` | voter | Dashboard | ✅ Selesai |
| 17 | `/pemilih/pemilihan/[id]/konfirmasi` | `frontend/src/app/pemilih/pemilihan/[id]/konfirmasi/page.tsx` | voter | Dashboard | ⬜ Placeholder |
| 18 | `/pemilih/pemilihan/[id]/commit` | `frontend/src/app/pemilih/pemilihan/[id]/commit/page.tsx` | voter | Dashboard | ✅ Selesai |
| 19 | `/pemilih/pemilihan/[id]/reveal` | `frontend/src/app/pemilih/pemilihan/[id]/reveal/page.tsx` | voter | Dashboard | ✅ Selesai |
| 20 | `/pemilih/pemilihan/[id]/hasil` | `frontend/src/app/pemilih/pemilihan/[id]/hasil/page.tsx` | voter | Dashboard | ✅ Selesai |
| | **ADMIN** | | | | |
| 21 | `/admin` | `frontend/src/app/admin/page.tsx` | admin | Dashboard | ✅ Selesai |
| 22 | `/admin/profil` | `frontend/src/app/admin/profil/page.tsx` | admin | Dashboard | ⬜ Placeholder |
| 23 | `/admin/bantuan` | `frontend/src/app/admin/bantuan/page.tsx` | admin | Dashboard | ⬜ Placeholder |
| 24 | `/admin/manajemen-pemilihan` | `frontend/src/app/admin/manajemen-pemilihan/page.tsx` | admin | Dashboard | ⬜ Placeholder |
| 25 | `/admin/manajemen-pemilihan/[id]` | `frontend/src/app/admin/manajemen-pemilihan/[id]/page.tsx` | admin | Dashboard | ⬜ Placeholder |
| 26 | `/admin/manajemen-pemilihan/[id]/monitoring` | `frontend/src/app/admin/manajemen-pemilihan/[id]/monitoring/page.tsx` | admin | Dashboard | ⬜ Placeholder |
| 27 | `/admin/manajemen-pemilihan/[id]/tambah-kandidat` | `frontend/src/app/admin/manajemen-pemilihan/[id]/tambah-kandidat/page.tsx` | admin | Dashboard | ⬜ Placeholder |
| 28 | `/admin/manajemen-pemilihan/[id]/import-job/[jobId]` | `frontend/src/app/admin/manajemen-pemilihan/[id]/import-job/[jobId]/page.tsx` | admin | Dashboard | ⬜ Placeholder |
| 29 | `/admin/manajemen-pemilihan/[id]/kandidat/[candidateId]/edit` | `frontend/src/app/admin/manajemen-pemilihan/[id]/kandidat/[candidateId]/edit/page.tsx` | admin | Dashboard | ⬜ Placeholder |
| 30 | `/admin/daftar-proposal` | `frontend/src/app/admin/daftar-proposal/page.tsx` | admin | Dashboard | ⬜ Placeholder |
| 31 | `/admin/daftar-proposal/tambah` | `frontend/src/app/admin/daftar-proposal/tambah/page.tsx` | admin | Dashboard | ⬜ Placeholder |
| 32 | `/admin/daftar-proposal/[id]` | `frontend/src/app/admin/daftar-proposal/[id]/page.tsx` | admin | Dashboard | ⬜ Placeholder |
| 33 | `/admin/daftar-proposal/[id]/edit` | `frontend/src/app/admin/daftar-proposal/[id]/edit/page.tsx` | admin | Dashboard | ⬜ Placeholder |
| | **SUPERADMIN** | | | | |
| 34 | `/superadmin` | `frontend/src/app/superadmin/page.tsx` | superadmin | Dashboard | ✅ Selesai |
| 35 | `/superadmin/profil` | `frontend/src/app/superadmin/profil/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| 36 | `/superadmin/pengaturan-platform` | `frontend/src/app/superadmin/pengaturan-platform/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| 37 | `/superadmin/risk-activity` | `frontend/src/app/superadmin/risk-activity/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| 38 | `/superadmin/audit-log` | `frontend/src/app/superadmin/audit-log/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| 39 | `/superadmin/data-voter` | `frontend/src/app/superadmin/data-voter/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| 40 | `/superadmin/manajemen-admin` | `frontend/src/app/superadmin/manajemen-admin/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| 41 | `/superadmin/manajemen-admin/tambah` | `frontend/src/app/superadmin/manajemen-admin/tambah/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| 42 | `/superadmin/manajemen-admin/[id]` | `frontend/src/app/superadmin/manajemen-admin/[id]/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| 43 | `/superadmin/manajemen-admin/[id]/edit` | `frontend/src/app/superadmin/manajemen-admin/[id]/edit/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| 44 | `/superadmin/manajemen-superadmin` | `frontend/src/app/superadmin/manajemen-superadmin/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| 45 | `/superadmin/manajemen-superadmin/[id]` | `frontend/src/app/superadmin/manajemen-superadmin/[id]/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| 46 | `/superadmin/manajemen-superadmin/[id]/edit` | `frontend/src/app/superadmin/manajemen-superadmin/[id]/edit/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| 47 | `/superadmin/manajemen-pemilihan` | `frontend/src/app/superadmin/manajemen-pemilihan/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| 48 | `/superadmin/manajemen-pemilihan/[id]` | `frontend/src/app/superadmin/manajemen-pemilihan/[id]/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| 49 | `/superadmin/manajemen-pemilihan/[id]/moderasi` | `frontend/src/app/superadmin/manajemen-pemilihan/[id]/moderasi/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| 50 | `/superadmin/manajemen-pemilihan/[id]/investigasi` | `frontend/src/app/superadmin/manajemen-pemilihan/[id]/investigasi/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| 51 | `/superadmin/manajemen-pemilihan/[id]/laporan-final` | `frontend/src/app/superadmin/manajemen-pemilihan/[id]/laporan-final/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| 52 | `/superadmin/manajemen-proposal` | `frontend/src/app/superadmin/manajemen-proposal/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| 53 | `/superadmin/manajemen-proposal/[id]` | `frontend/src/app/superadmin/manajemen-proposal/[id]/page.tsx` | superadmin | Dashboard | ⬜ Placeholder |
| | **GENERATED (extra)** | | | | |
| 54 | `/route-coverage` | *(generated)* | semua | Public | ✅ Selesai |

---

## Ringkasan

| Metrik | Angka |
|--------|-------|
| Total route frontend | **53** |
| Total route prototype | **54** (53 real + 1 generated) |
| ✅ Selesai (dengan konten fungsional) | **12** |
| ⬜ Placeholder (wireframe dasar) | **42** |
| Layout Dashboard (A) | **42 route** |
| Layout Public (B) | **9 route** |
| Layout Auth (C) | **3 route** |

---

## Critical User Journey (Voter)

Alur voter yang sudah berfungsi penuh di prototype:

```
/pemilih  →  /pemilih/pemilihan/[id]/pilih-kandidat  →  /pemilih/pemilihan/[id]/commit
  → (Base Sepolia Tx Simulator)  →  /pemilih/pemilihan/[id]/reveal
  → (Base Sepolia Tx Simulator)  →  /pemilih/pemilihan/[id]/hasil
```

Setiap transaksi blockchain menggunakan **Base Sepolia Transaction Simulator** dengan opsi **Simulate Success** dan **Simulate Failure**.

---

## Catatan

- Prototipe menggunakan hash‑based routing (`#/route/path`).
- Role selector di navbar kanan atas untuk berpindah role: Public / Voter / Admin / Superadmin.
- Sidebar menu items disesuaikan per role (superadmin 8 menu, admin 4 menu, voter 3 menu).
- Semua halaman placeholder menampilkan wireframe grayscale dengan garis placeholder.
