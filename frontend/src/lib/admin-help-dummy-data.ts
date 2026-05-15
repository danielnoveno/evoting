import { sharedDummyContext } from '@/lib/dummy-shared-context'

export const adminHelpData = {
  header: {
    title: 'Pusat Bantuan Admin',
    description: `Panduan operasional dan dukungan teknis blockchain untuk ekosistem ${sharedDummyContext.organizationShort}.`
  },
  categories: [
    {
      id: 'manajemen-proposal',
      title: 'Manajemen Proposal',
      description: `Panduan pembuatan, pengeditan, dan verifikasi draf proposal ${sharedDummyContext.proposalTitle} sebelum fase voting.`,
      iconKey: 'file-text'
    },
    {
      id: 'manajemen-space',
      title: 'Manajemen Space',
      description: `Konfigurasi parameter pemilihan, durasi blok, dan pengaturan partisipasi anggota ${sharedDummyContext.organizationShort}.`,
      iconKey: 'box'
    },
    {
      id: 'blockchain-commit',
      title: 'Blockchain Commit',
      description: 'Penjelasan teknis mekanisme commit-reveal untuk menjaga privasi pemilih.',
      iconKey: 'fingerprint'
    },
    {
      id: 'keamanan-whitelist',
      title: 'Keamanan & Whitelist',
      description: 'Audit akses admin, pengaturan whitelist dompet, dan proteksi dari serangan sybil.',
      iconKey: 'shield-check'
    }
  ],
  faqs: [
    {
      id: 'faq-1',
      question: 'Bagaimana cara mengganti fase pemilihan?',
      answer: 'Fase pemilihan hanya dapat diubah melalui dashboard Manajemen Pemilihan jika status saat ini masih "Menunggu". Jika fase sudah berjalan ("Berlangsung"), Anda memerlukan konsensus multisig untuk melakukan perubahan darurat guna menjaga integritas blockchain.'
    },
    {
      id: 'faq-2',
      question: 'Apa yang harus dilakukan jika transaksi gagal?',
      answer: 'Transaksi gagal biasanya disebabkan oleh gas fee yang tidak mencukupi atau kepadatan jaringan. Silakan periksa status node dan pastikan wallet admin memiliki saldo ETH (Sepolia) yang cukup.'
    },
    {
      id: 'faq-3',
      question: 'Cara ekspor data pemilih ke CSV?',
      answer: `Buka menu Manajemen Pemilihan, pilih ${sharedDummyContext.proposalTitle}, lalu masuk ke tab "Real-time" atau "Whitelist" dan klik tombol "Unduh Laporan" untuk mengekspor data ke format CSV.`
    },
    {
      id: 'faq-4',
      question: 'Apakah hasil pemilihan bisa dimanipulasi oleh admin?',
      answer: 'Tidak bisa. Setiap suara yang masuk dienkripsi dan dicatat secara langsung (on-chain) pada blockchain Ethereum/Base. Bahkan admin sistem tidak memiliki akses untuk mengubah ledger yang bersifat immutable.'
    },
    {
      id: 'faq-5',
      question: 'Bagaimana mekanisme Commit-Reveal bekerja?',
      answer: 'Pada fase Commit, pemilih mengirimkan suara yang dienkripsi (hashed) sehingga pilihan mereka dirahasiakan. Pada fase Reveal, kunci enkripsi dibuka agar sistem dapat melakukan dekripsi dan menghitung total suara tanpa mengetahui identitas asal.'
    },
    {
      id: 'faq-6',
      question: 'Bagaimana mengatasi node yang tidak sinkron?',
      answer: 'Periksa koneksi internet Anda terlebih dahulu. Jika node masih tidak merespons, coba refresh halaman atau hubungi Tim Teknis untuk merestart koneksi RPC ke node validator jaringan blockchain.'
    },
    {
      id: 'faq-7',
      question: 'Apakah aplikasi mendukung pendaftaran pemilih secara massal?',
      answer: `Ya, Anda dapat mengunggah file CSV pada tab "Whitelist" di menu Manajemen Pemilihan ${sharedDummyContext.organizationShort}. Pastikan file berisi daftar wallet address dan nama (opsional) sesuai dengan format yang disediakan oleh platform.`
    }
  ],
  supportWidget: {
    title: 'Butuh Bantuan Langsung?',
    description: 'Tim teknis kami tersedia 24/7 untuk membantu masalah kritis pada sistem voting Anda.',
    primaryButton: 'Chat dengan Tim Teknis',
    secondaryButton: 'Hubungi Support'
  },
  systemStatus: {
    title: 'STATUS SISTEM',
    statusLabel: 'Node Blockchain Aktif',
    lastBlock: '#19,452,102'
  }
}
