export interface VoterProofRecord {
  id: string
  title: string
  date: string
  status: 'Selesai'
  txHash: `0x${string}`
  blockNumber: number
  gasUsed: string
  candidate: string
  submittedAt: string
  verifierId: string
  commitmentHash: `0x${string}`
}

export const voterProofRecords: VoterProofRecord[] = [
  {
    id: 'presiden-bem-2024',
    title: 'Pemilihan Presiden BEM 2024',
    date: '12 Okt 2024',
    status: 'Selesai',
    txHash: '0x7f8832a886b84518a996f01119b9109012f2c8d23467e7c8' as `0x${string}`,
    blockNumber: 18442109,
    gasUsed: '21,000',
    candidate: 'Budi Santoso',
    submittedAt: '12 Okt 2024 • 10:11 WIB',
    verifierId: 'EV-2024-X921',
    commitmentHash: '0x95f4f89df13c0beeb56f20a73fe9ec9a18f0e8cbec8a03e2' as `0x${string}`,
  },
  {
    id: 'referendum-kampus-hijau',
    title: 'Referendum Kebijakan Kampus Hijau',
    date: '05 Sep 2024',
    status: 'Selesai',
    txHash: '0x5ce9b2f83748a8d8c1f17a87f4f2c1e8e3f2e6cb1a0cb6b0' as `0x${string}`,
    blockNumber: 18310942,
    gasUsed: '20,841',
    candidate: 'Pilihan A (Setuju)',
    submittedAt: '05 Sep 2024 • 13:42 WIB',
    verifierId: 'EV-2024-KH55',
    commitmentHash: '0xa21c778ab657e4f6fb8fe7c6c2b9f0cd14c92af1e1748e4a' as `0x${string}`,
  },
  {
    id: 'ketua-himpunan-informatika',
    title: 'Pemilihan Ketua Himpunan Informatika',
    date: '28 Jun 2024',
    status: 'Selesai',
    txHash: '0x11b7d031a40b5b22d188f3ea1ad3d05c19f2f4fd8ca9e237' as `0x${string}`,
    blockNumber: 17987521,
    gasUsed: '21,118',
    candidate: 'Nadya Pratiwi',
    submittedAt: '28 Jun 2024 • 09:37 WIB',
    verifierId: 'EV-2024-HM31',
    commitmentHash: '0xb9f774d24b39868f98ee580b930ef11db53a558763b058bb' as `0x${string}`,
  },
]

export const quickProofHistory = voterProofRecords.map((record) => ({
  id: record.id,
  title: record.title,
  date: record.date,
  status: record.status,
}))

export function getVoterProofById(proofId: string) {
  return voterProofRecords.find((record) => record.id === proofId)
}
