export type ProposalStatus = 'DISETUJUI' | 'MENUNGGU REVIEW' | 'DRAF' | 'DITOLAK'

export interface ProposalRow {
  id: string
  title: string
  category: string
  date: string
  votersEstimate: string
  hash: string
  status: ProposalStatus
}

export const adminProposalContent = {
  header: {
    title: 'Ringkasan Pengajuan Proposal',
    description: 'Pantau dan kelola seluruh proposal pemilihan yang masuk dalam protokol blockchain. Pastikan integritas data sebelum menyetujui publikasi.',
    primaryCta: 'Buat Proposal Baru',
  },
  stats: [
    { label: 'TOTAL PROPOSAL', value: '128', iconKey: 'bar-chart' },
    { label: 'MENUNGGU REVIEW', value: '14', iconKey: 'hourglass' },
    { label: 'BERJALAN', value: '08', iconKey: 'rocket' },
    { label: 'SELESAI', value: '106', iconKey: 'check-circle' },
  ],
  banner: {
    title: 'Verifikasi Blockchain Otomatis',
    description: 'Setiap proposal yang disetujui akan secara otomatis dicatat ke dalam smart contract. Hal ini menjamin bahwa parameter pemilihan tidak dapat diubah setelah pemungutan suara dimulai.',
    tags: ['KEAMANAN MILITER', 'AUDIT PUBLIK'],
    nodeSync: {
      status: 'NODE SINKRONISASI',
      info: '0x4f...a3e2 connected\nblock #192,841 valid\nTPS: 2,400 stable',
    },
  },
  proposals: [
    {
      id: 'p1',
      title: 'Pemilihan Ketua OSIS 2024',
      category: 'Pendidikan',
      date: '24 Okt 2023',
      votersEstimate: '1,250',
      hash: '0x71C...4f92',
      status: 'DISETUJUI',
    },
    {
      id: 'p2',
      title: 'Votasi Kebijakan Lingkungan',
      category: 'Organisasi',
      date: '22 Okt 2023',
      votersEstimate: '450',
      hash: '0x92A...1e88',
      status: 'MENUNGGU REVIEW',
    },
    {
      id: 'p3',
      title: 'Sayembara Logo Komunitas',
      category: 'Umum',
      date: '18 Okt 2023',
      votersEstimate: '3,000',
      hash: 'Belum di-hash',
      status: 'DRAF',
    },
    {
      id: 'p4',
      title: 'Survei Fasilitas Publik',
      category: 'Pemerintah',
      date: '15 Okt 2023',
      votersEstimate: '15,000',
      hash: '0x3B2...9c41',
      status: 'DITOLAK',
    },
    {
      id: 'p5',
      title: 'Pemilihan Ketua HIMAFORKA 2025',
      category: 'Universitas',
      date: '12 Okt 2023',
      votersEstimate: '850',
      hash: '0x88D...2a11',
      status: 'DISETUJUI',
    },
    {
      id: 'p6',
      title: 'Voting Anggaran Tahunan',
      category: 'Keuangan',
      date: '10 Okt 2023',
      votersEstimate: '120',
      hash: 'Belum di-hash',
      status: 'DRAF',
    },
  ] as ProposalRow[],
}
