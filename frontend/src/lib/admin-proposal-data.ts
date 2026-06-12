export type ProposalStatus = 'DISETUJUI' | 'MENUNGGU REVIEW' | 'PERLU REVISI' | 'DRAF' | 'DITOLAK' | 'DIBATALKAN'

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
    description: 'Pantau dan kelola seluruh proposal pemilihan internal dari Supabase.',
    primaryCta: 'Buat Proposal Baru',
  },
  stats: [
    { label: 'TOTAL PROPOSAL', value: '0', iconKey: 'bar-chart' },
    { label: 'MENUNGGU REVIEW', value: '0', iconKey: 'hourglass' },
    { label: 'BERJALAN', value: '0', iconKey: 'rocket' },
    { label: 'SELESAI', value: '0', iconKey: 'check-circle' },
  ],
  banner: {
    title: 'Verifikasi Blockchain Otomatis',
    description: 'Setiap proposal yang disetujui dapat dicatat ke dalam smart contract setelah metadata final dan transaksi nyata tersedia.',
    tags: ['KEAMANAN PEMILIHAN', 'AUDIT PUBLIK'],
    nodeSync: { status: 'NODE SINKRONISASI', info: 'Menunggu data indexer' },
  },
  proposals: [] as ProposalRow[],
}
