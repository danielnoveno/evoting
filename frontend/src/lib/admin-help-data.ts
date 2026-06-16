export const adminHelpData = {
  header: {
    title: 'Pusat Bantuan Admin',
    description: 'Panduan operasional dan dukungan teknis blockchain untuk ekosistem Votein.',
  },
  categories: [
    { id: 'manajemen-proposal', title: 'Manajemen Proposal', description: 'Panduan pembuatan, pengeditan, dan verifikasi draf proposal sebelum fase voting.', iconKey: 'file-text' },
    { id: 'manajemen-space', title: 'Manajemen Space', description: 'Konfigurasi parameter pemilihan, durasi blok, dan pengaturan partisipasi anggota.', iconKey: 'box' },
    { id: 'blockchain-commit', title: 'Blockchain Commit', description: 'Penjelasan teknis mekanisme commit-reveal untuk menjaga privasi pemilih.', iconKey: 'fingerprint' },
    { id: 'keamanan-whitelist', title: 'Keamanan & Whitelist', description: 'Audit akses admin, pengaturan whitelist dompet, dan proteksi dari serangan sybil.', iconKey: 'shield-check' },
  ],
  faqs: [
    { id: 'faq-1', question: 'Bagaimana cara mengganti fase pemilihan?', answer: 'Fase pemilihan hanya dapat diubah melalui dashboard Manajemen Pemilihan jika status saat ini masih sesuai aturan smart contract.' },
    { id: 'faq-2', question: 'Apa yang harus dilakukan jika transaksi gagal?', answer: 'Periksa saldo ETH testnet, jaringan wallet, dan status RPC. Gunakan link Basescan jika transaksi sudah memiliki hash.' },
    { id: 'faq-3', question: 'Cara ekspor data pemilih ke CSV?', answer: 'Buka menu Manajemen Pemilihan, pilih ruang voting dari Supabase, lalu masuk ke tab Whitelist dan gunakan aksi ekspor jika tersedia.' },
    { id: 'faq-4', question: 'Apakah hasil pemilihan bisa dimanipulasi oleh admin?', answer: 'Admin tidak boleh mengubah hasil on-chain. Klaim ini hanya valid jika transaksi commit/reveal dan kontrak sudah benar-benar berjalan di Base Sepolia.' },
    { id: 'faq-5', question: 'Bagaimana mekanisme Commit-Reveal bekerja?', answer: 'Pada fase Commit, pemilih mengirim hash pilihan dan salt. Pada fase Reveal, kandidat dan salt dibuka untuk diverifikasi kontrak.' },
  ],
  supportWidget: { title: 'Butuh Bantuan?', description: 'Hubungi pengelola sistem untuk masalah kritis.', primaryButton: 'Chat Tim Teknis', secondaryButton: 'Hubungi Support' },
  systemStatus: { title: 'STATUS SISTEM', statusLabel: 'Menunggu indexer', lastBlock: 'Menunggu indexer' },
}
