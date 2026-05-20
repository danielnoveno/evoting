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
    description: 'Pantau dan kelola seluruh proposal pemilihan kemahasiswaan UAJY. Pastikan integritas data sebelum proposal dipublikasikan.',
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
    tags: ['KEAMANAN PEMILIHAN', 'AUDIT PUBLIK'],
    nodeSync: {
      status: 'NODE SINKRONISASI',
      info: '0x4f...a3e2 connected\nblock #192,841 valid\nTPS: 2,400 stable',
    },
  },
  proposals: [
    {
      id: sharedDummyContext.proposalId,
      title: sharedDummyContext.proposalTitle,
      category: 'Organisasi',
      date: '18 Okt 2023',
      votersEstimate: String(sharedDummyContext.voterEstimate),
      hash: '0x71C...4f92',
      status: 'DISETUJUI',
    },
    {
      id: 'p-kelompok-praktikum-bd-2026',
      title: 'Pemilihan Ketua Kelompok Praktikum Basis Data FTI 2026',
      category: 'Akademik',
      date: '22 Okt 2023',
      votersEstimate: '36',
      hash: '0x92A...1e88',
      status: 'MENUNGGU REVIEW',
    },
    {
      id: 'p-himaforka-psdm-2026',
      title: 'Pemilihan Koordinator Divisi PSDM HIMAFORKA 2026',
      category: 'Himpunan',
      date: '18 Okt 2023',
      votersEstimate: '84',
      hash: 'Belum di-hash',
      status: 'DRAF',
    },
    {
      id: 'p-panitia-makrab-if-2026',
      title: 'Pemilihan Ketua Panitia Makrab Informatika 2026',
      category: 'Kepanitiaan',
      date: '15 Okt 2023',
      votersEstimate: '58',
      hash: '0x3B2...9c41',
      status: 'DITOLAK',
    },
    {
      id: 'p-ukm-riset-sekretaris',
      title: 'Pemilihan Sekretaris UKM Riset 2026',
      category: 'Organisasi',
      date: '12 Okt 2023',
      votersEstimate: '324',
      hash: '0x88D...2a11',
      status: 'DISETUJUI',
    },
    {
      id: 'p-ukm-riset-divisi-acara',
      title: 'Pemilihan Ketua Divisi Acara UKM Riset 2026',
      category: 'UKM',
      date: '10 Okt 2023',
      votersEstimate: '120',
      hash: 'Belum di-hash',
      status: 'DRAF',
    },
  ] as ProposalRow[],
}
import { sharedDummyContext } from '@/lib/dummy-shared-context'
