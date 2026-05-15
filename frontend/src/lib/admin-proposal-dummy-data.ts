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
      id: sharedDummyContext.proposalId,
      title: sharedDummyContext.proposalTitle,
      category: 'Organisasi',
      date: '18 Okt 2023',
      votersEstimate: String(sharedDummyContext.voterEstimate),
      hash: '0x71C...4f92',
      status: 'DISETUJUI',
    },
    {
      id: 'p-ukm-riset-divisi',
      title: 'Pemilihan Kepala Divisi Program UKM Riset',
      category: 'Organisasi',
      date: '22 Okt 2023',
      votersEstimate: '96',
      hash: '0x92A...1e88',
      status: 'MENUNGGU REVIEW',
    },
    {
      id: 'p-ukm-riset-logo',
      title: 'Sayembara Logo Inovasi UKM Riset',
      category: 'Komunitas',
      date: '18 Okt 2023',
      votersEstimate: '324',
      hash: 'Belum di-hash',
      status: 'DRAF',
    },
    {
      id: 'p-ukm-riset-anggaran',
      title: 'Voting Anggaran Tahunan UKM Riset',
      category: 'Keuangan',
      date: '15 Okt 2023',
      votersEstimate: '120',
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
      id: 'p-ukm-riset-kebijakan',
      title: 'Voting Kebijakan Publikasi Karya UKM Riset',
      category: 'Keuangan',
      date: '10 Okt 2023',
      votersEstimate: '180',
      hash: 'Belum di-hash',
      status: 'DRAF',
    },
  ] as ProposalRow[],
}
import { sharedDummyContext } from '@/lib/dummy-shared-context'
