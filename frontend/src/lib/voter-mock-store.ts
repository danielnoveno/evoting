'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

export type VoterElectionPhase = 'registration' | 'commit' | 'reveal' | 'ended'

export interface VoterCandidate {
  id: string
  name: string
  faculty: string
  vision: string
  mission: string[]
  votes: number
}

export interface VoterProof {
  txHash: string
  blockNumber: number
  gasUsed: number
  createdAt: string
  statusLabel: string
}

export interface VoterLogItem {
  id: string
  title: string
  detail: string
  timeLabel: string
  tone: 'success' | 'info' | 'warning'
}

export interface VoterElection {
  id: string
  title: string
  organization: string
  summary: string
  phase: VoterElectionPhase
  deadlineIso: string
  totalParticipants: number
  committedCount: number
  revealedCount: number
  quorumPercent: number
  candidateCount: number
  candidates: VoterCandidate[]
  selectedCandidateId: string | null
  committedCandidateId: string | null
  commitProof: VoterProof | null
  revealProof: VoterProof | null
  commitmentHash: string | null
  voterIdentifier: string
  lastTransactionLabel: string
  supportCopy: string
}

export interface VoterProfile {
  name: string
  email: string
  wallet: string
  bio: string
  avatarUrl: string
}

export interface VoterStore {
  profile: VoterProfile
  elections: VoterElection[]
  selectedProofElectionId: string
}

const STORAGE_KEY = 'votein-voter-mock-store'
const BASESCAN_ROOT = 'https://sepolia.basescan.org'

const voterStoreSeed: VoterStore = {
  profile: {
    name: 'Aditya Pratama',
    email: 'aditya.pratama@students.uajy.ac.id',
    wallet: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    bio: 'Mahasiswa aktif yang rutin berpartisipasi dalam pemilihan digital organisasi kampus.',
    avatarUrl: 'https://i.pravatar.cc/320?img=12',
  },
  selectedProofElectionId: 'anggota-senat-universitas',
  elections: [
    {
      id: 'ketua-umum-bem-2024',
      title: 'Ketua Umum BEM 2024',
      organization: 'HIMAFORKA · FTI UAJY',
      summary: 'Pilih kandidat ketua umum dengan alur commit-reveal yang menjaga kerahasiaan suara hingga fase reveal dibuka.',
      phase: 'commit',
      deadlineIso: '2026-05-10T18:00:00+07:00',
      totalParticipants: 15284,
      committedCount: 9821,
      revealedCount: 0,
      quorumPercent: 64,
      candidateCount: 3,
      selectedCandidateId: null,
      committedCandidateId: null,
      commitProof: null,
      revealProof: null,
      commitmentHash: null,
      voterIdentifier: 'VOTER-SHA-9921-X',
      lastTransactionLabel: 'Belum ada commit dari akun ini.',
      supportCopy: 'Jika pilihan berubah sebelum dikirim, Anda masih bisa kembali dan memilih kandidat lain.',
      candidates: [
        {
          id: 'c1',
          name: 'Andhika Pratama',
          faculty: 'Sistem Informasi',
          vision: 'Mewujudkan ekosistem digital yang inklusif dan transparan bagi seluruh lapisan mahasiswa melalui inovasi teknologi yang berkelanjutan.',
          mission: ['Digitalisasi birokrasi total.', 'Pengembangan talenta IT lokal.'],
          votes: 0,
        },
        {
          id: 'c2',
          name: 'Siti Rahayu',
          faculty: 'Informatika',
          vision: 'Membangun harmoni sosial melalui pemerataan akses ekonomi dan pendidikan di seluruh wilayah nusantara.',
          mission: ['Beasiswa 1 juta siswa berprestasi.', 'Revitalisasi pasar tradisional modern.'],
          votes: 0,
        },
        {
          id: 'c3',
          name: 'Budi Sudarsono',
          faculty: 'Teknik Industri',
          vision: 'Transformasi ketahanan pangan nasional berbasis kearifan lokal dan teknologi tepat guna untuk kesejahteraan petani.',
          mission: ['Jaminan harga jual komoditas tani.', 'Modernisasi alat pertanian desa.'],
          votes: 0,
        },
      ],
    },
    {
      id: 'votasi-anggaran-it',
      title: 'Votasi Anggaran Proyek IT',
      organization: 'Laboratorium Informatika',
      summary: 'Berikan suara untuk alokasi dana infrastruktur server semester ganjil dengan bukti audit yang bisa ditinjau publik.',
      phase: 'reveal',
      deadlineIso: '2026-05-11T10:00:00+07:00',
      totalParticipants: 842,
      committedCount: 781,
      revealedCount: 625,
      quorumPercent: 65,
      candidateCount: 3,
      selectedCandidateId: 'c1',
      committedCandidateId: 'c1',
      commitmentHash: '0x8f2aedc018cf718930ab7cb2f8165b4d3152afe2fcaa8cb9ab88d3351122f19d',
      commitProof: {
        txHash: '0x9f8d2ab5d91ec14ccba7f344a233f4ad77f1d4ac82f31ef624ad99821bc4ef77',
        blockNumber: 18294201,
        gasUsed: 20841,
        createdAt: '2026-05-08T19:30:00+07:00',
        statusLabel: 'Commit tersimpan',
      },
      revealProof: null,
      voterIdentifier: 'VOTER-SHA-9921-X',
      lastTransactionLabel: 'Commit berhasil dikirim. Menunggu fase reveal.',
      supportCopy: 'Pastikan Anda menggunakan perangkat yang sama agar data komitmen tetap tersedia untuk reveal.',
      candidates: [
        {
          id: 'c1',
          name: 'Cluster Infrastruktur',
          faculty: 'Opsi A',
          vision: 'Upgrade server pembelajaran dan sistem backup laboratorium.',
          mission: ['Tambah penyimpanan 20 TB.', 'Failover untuk layanan internal.'],
          votes: 312,
        },
        {
          id: 'c2',
          name: 'Cluster Pengembangan',
          faculty: 'Opsi B',
          vision: 'Akselerasi lisensi software pembelajaran dan sandbox eksperimen.',
          mission: ['Lisensi IDE institusi.', 'Lingkungan latihan keamanan.'],
          votes: 206,
        },
        {
          id: 'c3',
          name: 'Cluster Pelatihan',
          faculty: 'Opsi C',
          vision: 'Dukungan workshop sertifikasi dan pelatihan rutin untuk asisten laboratorium.',
          mission: ['Bootcamp cloud.', 'Kelas DevSecOps bulanan.'],
          votes: 107,
        },
      ],
    },
    {
      id: 'pemilihan-duta-kampus',
      title: 'Pemilihan Duta Kampus',
      organization: 'BEM Fakultas Teknik',
      summary: 'Pendaftaran kandidat masih dibuka. Voting akan dimulai saat fase commit dibuka oleh admin.',
      phase: 'registration',
      deadlineIso: '2026-05-14T14:00:00+07:00',
      totalParticipants: 524,
      committedCount: 0,
      revealedCount: 0,
      quorumPercent: 0,
      candidateCount: 2,
      selectedCandidateId: null,
      committedCandidateId: null,
      commitProof: null,
      revealProof: null,
      commitmentHash: null,
      voterIdentifier: 'VOTER-SHA-9921-X',
      lastTransactionLabel: 'Belum memasuki fase voting.',
      supportCopy: 'Pantau pembukaan fase commit di beranda atau menu Bukti Saya.',
      candidates: [
        {
          id: 'c1',
          name: 'Maya Kartika',
          faculty: 'Teknik Sipil',
          vision: 'Mewakili citra kampus yang kolaboratif dan berprestasi.',
          mission: ['Program promosi lintas komunitas.', 'Pendampingan duta fakultas.'],
          votes: 0,
        },
        {
          id: 'c2',
          name: 'Rizki Fadillah',
          faculty: 'Teknik Mesin',
          vision: 'Mendorong partisipasi mahasiswa dalam diplomasi dan jejaring eksternal.',
          mission: ['Roadshow sekolah mitra.', 'Pelatihan public speaking.'],
          votes: 0,
        },
      ],
    },
    {
      id: 'anggota-senat-universitas',
      title: 'Pemilihan Anggota Senat Universitas',
      organization: 'Universitas Atma Jaya Yogyakarta',
      summary: 'Hasil final telah diumumkan dan bukti sertifikat digital tersedia untuk diunduh.',
      phase: 'ended',
      deadlineIso: '2026-04-15T09:42:00+07:00',
      totalParticipants: 284,
      committedCount: 284,
      revealedCount: 284,
      quorumPercent: 100,
      candidateCount: 3,
      selectedCandidateId: 'c2',
      committedCandidateId: 'c2',
      commitmentHash: '0x7f8832a886b84518a996f01119b9109012f2c8d23467e7c8a001b1e32fbe8019',
      commitProof: {
        txHash: '0x7f8832a886b84518a996f01119b9109012f2c8d23467e7c8a001b1e32fbe8019',
        blockNumber: 18442109,
        gasUsed: 21000,
        createdAt: '2026-04-15T09:42:00+07:00',
        statusLabel: 'Confirmed',
      },
      revealProof: {
        txHash: '0xbc281e0573e35186b198f399f7d49b2e6ef0df24d4150f8f4c39c422fb76ee13',
        blockNumber: 18442138,
        gasUsed: 21948,
        createdAt: '2026-04-15T10:15:00+07:00',
        statusLabel: 'Finalized',
      },
      voterIdentifier: 'EV-2024-X921',
      lastTransactionLabel: 'Sertifikat publik sudah tersedia.',
      supportCopy: 'Anda bisa menyalin hash transaksi untuk diverifikasi langsung di Basescan.',
      candidates: [
        {
          id: 'c1',
          name: 'Siti Aminah',
          faculty: 'FISIP',
          vision: 'Perwakilan lintas fakultas dengan fokus tata kelola yang terbuka.',
          mission: ['Forum evaluasi bulanan.', 'Panel kebijakan terbuka.'],
          votes: 84,
        },
        {
          id: 'c2',
          name: 'Budi Santoso',
          faculty: 'PMB',
          vision: 'Partai Maju Bersama.',
          mission: ['Kolaborasi lintas unit.', 'Program advokasi mahasiswa.'],
          votes: 124,
        },
        {
          id: 'c3',
          name: 'Ahmad Fauzi',
          faculty: 'FKIP',
          vision: 'Kampus inklusif dan adaptif berbasis data.',
          mission: ['Kanal aspirasi digital.', 'Transparansi laporan kebijakan.'],
          votes: 21,
        },
      ],
    },
  ],
}

function cloneStore(seed: VoterStore) {
  return JSON.parse(JSON.stringify(seed)) as VoterStore
}

function readStore() {
  if (typeof window === 'undefined') return cloneStore(voterStoreSeed)

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return cloneStore(voterStoreSeed)

  try {
    return JSON.parse(raw) as VoterStore
  } catch {
    return cloneStore(voterStoreSeed)
  }
}

function persistStore(store: VoterStore) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function randomHex(size: number) {
  const alphabet = 'abcdef0123456789'
  return Array.from({ length: size }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

function createProof(statusLabel: string): VoterProof {
  const now = new Date()
  return {
    txHash: `0x${randomHex(64)}`,
    blockNumber: 18400000 + Math.floor(Math.random() * 50000),
    gasUsed: 20500 + Math.floor(Math.random() * 3000),
    createdAt: now.toISOString(),
    statusLabel,
  }
}

function updateElection(store: VoterStore, electionId: string, updater: (election: VoterElection) => VoterElection) {
  return {
    ...store,
    elections: store.elections.map((election) => election.id === electionId ? updater(election) : election),
  }
}

export function basescanTxUrl(hash: string) {
  return `${BASESCAN_ROOT}/tx/${hash}`
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatDateShort(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value)
}

export function formatWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function getPhaseLabel(phase: VoterElectionPhase) {
  if (phase === 'registration') return 'Pra-registrasi'
  if (phase === 'commit') return 'Fase Commit'
  if (phase === 'reveal') return 'Fase Reveal'
  return 'Selesai'
}

export function getPhaseTone(phase: VoterElectionPhase) {
  if (phase === 'registration') return 'warning'
  if (phase === 'commit') return 'success'
  if (phase === 'reveal') return 'info'
  return 'success'
}

export function getElectionProgress(election: VoterElection) {
  if (!election.totalParticipants) return 0
  if (election.phase === 'ended') return 100
  const counted = election.phase === 'reveal' ? election.revealedCount : election.committedCount
  return Math.min(100, Math.round((counted / election.totalParticipants) * 100))
}

export function sortDashboardElections(elections: VoterElection[]) {
  return [...elections].sort((left, right) => new Date(left.deadlineIso).getTime() - new Date(right.deadlineIso).getTime())
}

export function resolveElectionAction(election: VoterElection) {
  if (election.phase === 'commit') {
    return {
      label: 'Berikan Suara',
      href: `/pemilih/pemilihan/${election.id}/commit`,
    }
  }

  if (election.phase === 'reveal') {
    return {
      label: election.revealProof ? 'Lihat Hasil' : 'Mulai Reveal Suara',
      href: election.revealProof
        ? `/pemilih/pemilihan/${election.id}/hasil`
        : `/pemilih/pemilihan/${election.id}/reveal`,
    }
  }

  if (election.phase === 'ended') {
    return {
      label: 'Lihat Hasil',
      href: `/pemilih/pemilihan/${election.id}/hasil`,
    }
  }

  return {
    label: 'Pantau Jadwal',
    href: '/pemilih/bukti-saya',
  }
}

export function getElectionResultRows(election: VoterElection) {
  const totalVotes = election.candidates.reduce((sum, candidate) => sum + candidate.votes, 0)

  return [...election.candidates]
    .sort((left, right) => right.votes - left.votes)
    .map((candidate) => ({
      ...candidate,
      percentage: totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0,
      totalVotes,
    }))
}

export function getRecentLogs(store: VoterStore): VoterLogItem[] {
  return store.elections
    .flatMap((election) => {
      const items: VoterLogItem[] = []

      if (election.commitProof) {
        items.push({
          id: `${election.id}-commit`,
          title: `${election.title} · Commit tersimpan`,
          detail: `Tx: ${formatWallet(election.commitProof.txHash)} · Block #${formatNumber(election.commitProof.blockNumber)}`,
          timeLabel: formatDateTime(election.commitProof.createdAt),
          tone: 'success',
        })
      }

      if (election.phase === 'reveal' && !election.revealProof) {
        items.push({
          id: `${election.id}-phase`,
          title: `${election.title} · Reveal dibuka`,
          detail: 'Admin telah membuka fase reveal. Silakan konfirmasi suara Anda.',
          timeLabel: election.lastTransactionLabel,
          tone: 'info',
        })
      }

      if (election.revealProof) {
        items.push({
          id: `${election.id}-reveal`,
          title: `${election.title} · Reveal tervalidasi`,
          detail: `Tx: ${formatWallet(election.revealProof.txHash)} · Block #${formatNumber(election.revealProof.blockNumber)}`,
          timeLabel: formatDateTime(election.revealProof.createdAt),
          tone: 'success',
        })
      }

      return items
    })
    .sort((left, right) => right.timeLabel.localeCompare(left.timeLabel))
    .slice(0, 6)
}

export function useVoterStore() {
  const [store, setStore] = useState<VoterStore | null>(null)

  useEffect(() => {
    setStore(readStore())
  }, [])

  const applyStore = useCallback((updater: (current: VoterStore) => VoterStore) => {
    setStore((current) => {
      const base = current ?? readStore()
      const next = updater(base)
      persistStore(next)
      return next
    })
  }, [])

  const actions = useMemo(() => ({
    reset() {
      const next = cloneStore(voterStoreSeed)
      persistStore(next)
      setStore(next)
    },
    selectCandidate(electionId: string, candidateId: string) {
      applyStore((current) => updateElection(current, electionId, (election) => ({
        ...election,
        selectedCandidateId: candidateId,
      })))
    },
    commitVote(electionId: string): VoterProof | null {
      let proof: VoterProof | null = null

      applyStore((current) => updateElection(current, electionId, (election) => {
        if (!election.selectedCandidateId) return election

        proof = createProof('Commit tersimpan')

        return {
          ...election,
          phase: 'reveal',
          committedCandidateId: election.selectedCandidateId,
          committedCount: Math.min(election.totalParticipants, election.committedCount + 1),
          commitmentHash: `0x${randomHex(64)}`,
          commitProof: proof,
          lastTransactionLabel: 'Reveal siap dilakukan dari browser yang sama.',
        }
      }))

      return proof
    },
    revealVote(electionId: string): VoterProof | null {
      let proof: VoterProof | null = null

      applyStore((current) => updateElection(current, electionId, (election) => {
        if (!election.committedCandidateId || election.revealProof) return election

        proof = createProof('Finalized')

        return {
          ...election,
          phase: 'ended',
          revealProof: proof,
          revealedCount: Math.min(election.totalParticipants, election.revealedCount + 1),
          lastTransactionLabel: 'Hasil akhir dapat dilihat dan diverifikasi di Basescan.',
          candidates: election.candidates.map((candidate) => candidate.id === election.committedCandidateId
            ? { ...candidate, votes: candidate.votes + 1 }
            : candidate),
        }
      }))

      return proof
    },
    updateProfile(payload: Partial<VoterProfile>) {
      applyStore((current) => ({
        ...current,
        profile: {
          ...current.profile,
          ...payload,
        },
      }))
    },
    selectProofElection(electionId: string) {
      applyStore((current) => ({
        ...current,
        selectedProofElectionId: electionId,
      }))
    },
  }), [applyStore])

  return {
    store,
    actions,
    loading: store === null,
  }
}

export function findElection(store: VoterStore | null, electionId: string) {
  return store?.elections.find((election) => election.id === electionId) ?? null
}
