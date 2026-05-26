import { sharedContext } from '@/lib/shared-context'

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
    description: `Pantau dan kelola seluruh proposal pemilihan internal ${sharedContext.organizationShort}. Pastikan integritas data sebelum proposal dipublikasikan.`,
    primaryCta: 'Buat Proposal Baru',
  },
  stats: [
    { label: 'TOTAL PROPOSAL', value: '12', iconKey: 'bar-chart' },
    { label: 'MENUNGGU REVIEW', value: '2', iconKey: 'hourglass' },
    { label: 'BERJALAN', value: '2', iconKey: 'rocket' },
    { label: 'SELESAI', value: '8', iconKey: 'check-circle' },
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
      id: sharedContext.proposalId,
      title: sharedContext.proposalTitle,
      category: 'Kepengurusan',
      date: '10 Mar 2026',
      votersEstimate: String(sharedContext.voterEstimate),
      hash: '0x71C...4f92',
      status: 'DISETUJUI',
    },
    {
      id: 'p-ketua-divisi-litbang-ukm-riset-2026',
      title: 'Pemilihan Ketua Divisi Litbang UKM Riset 2026',
      category: 'Divisi',
      date: '18 Mar 2026',
      votersEstimate: '120',
      hash: '0x92A...1e88',
      status: 'DISETUJUI',
    },
    {
      id: 'p-sekretaris-ukm-riset-2025',
      title: 'Pemilihan Sekretaris UKM Riset 2025',
      category: 'Kepengurusan',
      date: '15 Apr 2025',
      votersEstimate: '286',
      hash: '0x55C...d8a1',
      status: 'DISETUJUI',
    },
    {
      id: 'p-bendahara-ukm-riset-2026',
      title: 'Pemilihan Bendahara UKM Riset 2026',
      category: 'Kepengurusan',
      date: '02 Mei 2026',
      votersEstimate: '310',
      hash: 'Belum di-hash',
      status: 'MENUNGGU REVIEW',
    },
    {
      id: 'p-ketua-divisi-acara-ukm-riset-2025',
      title: 'Pemilihan Ketua Divisi Acara UKM Riset 2025',
      category: 'Divisi',
      date: '20 Sep 2025',
      votersEstimate: '54',
      hash: '0x44F...a9c1',
      status: 'DISETUJUI',
    },
    {
      id: 'p-ketua-divisi-humas-ukm-riset-2026',
      title: 'Pemilihan Ketua Divisi Humas UKM Riset 2026',
      category: 'Divisi',
      date: '05 Mei 2026',
      votersEstimate: '98',
      hash: 'Belum di-hash',
      status: 'DRAF',
    },
  ] as ProposalRow[],
}
