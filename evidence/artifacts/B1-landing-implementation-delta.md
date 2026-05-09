# B1-landing-implementation-delta

## Objective
Implementasi halaman public responsive + halaman auth hubungkan dompet berbasis referensi Figma lokal untuk konteks skripsi e-voting organisasi mahasiswa.

## Touched files
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/next-env.d.ts`
- `frontend/next.config.mjs`
- `frontend/postcss.config.js`
- `frontend/tailwind.config.ts`
- `frontend/src/app/layout.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/app/cara-kerja/page.tsx`
- `frontend/src/app/hubungkan-dompet/page.tsx`
- `frontend/src/app/pemilihan/page.tsx`
- `frontend/src/app/pemilihan/[id]/hasil/page.tsx`
- `frontend/src/app/globals.css`
- `frontend/src/components/auth/auth-shell.tsx`
- `frontend/src/components/public/site-shell.tsx`
- `.docs/knowledge/thesis-consistency-register.md`

## Implementation notes
- Membuat scaffold `frontend/` berbasis Next.js App Router + Tailwind.
- Menambahkan shared public navbar/footer agar 4 route public memiliki alignment yang sama.
- Menambahkan shared auth shell dan komponen reusable untuk flow hubungkan dompet.
- Menggunakan container konsisten `max-width 1320px` dengan `px-4 / px-5 / px-6` sesuai guardrail responsive public area.
- Copywriting public diubah/dirapikan ke Bahasa Indonesia dengan konteks skripsi Security Engineering dan e-voting organisasi mahasiswa.
- Mengimplementasikan route `/`, `/cara-kerja`, `/pemilihan`, `/pemilihan/[id]/hasil` berdasar referensi JPG lokal.
- Mengimplementasikan route `/hubungkan-dompet` sebagai login kampus tunggal dengan pembuatan Smart Wallet otomatis pada login pertama.

## Known limits
- MCP Figma tidak dapat diakses saat implementasi karena token expired, sehingga paritas visual mengacu pada file JPG lokal di `.docs/DESIGN FIGMA/landingpage/`.
- MCP Figma masih tidak dapat diakses langsung, jadi validasi node-level masih tertunda walau 4 route sudah diimplementasikan.
