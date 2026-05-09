# V4-landing-usability-note

## Scope
Landing page public area (`/`) dengan fokus container responsive, spacing antarseksi, dan copywriting yang lebih sesuai konteks skripsi e-voting organisasi mahasiswa.

## UX decisions
- Container diseragamkan ke `max-width: 1320px` dengan `px-4 / px-5 / px-6` agar alignment navbar, konten, dan footer konsisten.
- Grid hero dan section value proposition dipecah menjadi satu kolom pada mobile untuk menghindari horizontal scroll.
- Copy user-facing diubah ke Bahasa Indonesia yang lebih natural dan menghindari jargon teknis berlebihan.
- CTA utama per section dibatasi satu aksi primer agar hirarki tetap jelas.

## Residual risks
- Paritas visual detail belum bisa diverifikasi langsung dari MCP Figma karena token expired; validasi saat ini berbasis JPG lokal.
- Belum ada QA manual terdokumentasi pada viewport 390px / 768px / 1280px; build dan struktur responsive sudah disiapkan, tetapi screenshot manual masih perlu dilengkapi.
