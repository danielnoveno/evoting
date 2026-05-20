'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { sharedDummyContext } from '@/lib/dummy-shared-context'
import { clearAllDemoVoteCommitments } from '@/lib/vote-commitment-demo'

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

const STORAGE_KEY = 'votein-voter-mock-store-v2'
const BASESCAN_ROOT = 'https://sepolia.basescan.org'

const voterStoreSeed: VoterStore = {
  profile: {
    name: 'Aditya Pratama',
    email: 'aditya.pratama@students.uajy.ac.id',
    wallet: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    bio: 'Mahasiswa aktif yang rutin berpartisipasi dalam pemilihan digital organisasi kampus.',
    avatarUrl: 'https://i.pravatar.cc/320?img=12',
  },
  selectedProofElectionId: 'koordinator-psdm-himaforka-2025',
  elections: [
    {
      id: sharedDummyContext.electionId,
      title: sharedDummyContext.proposalTitle,
      organization: sharedDummyContext.organization,
      summary: sharedDummyContext.summary,
      phase: 'commit',
      deadlineIso: sharedDummyContext.commitDeadlineIso,
      totalParticipants: sharedDummyContext.voterEstimate,
      committedCount: 218,
      revealedCount: 0,
      quorumPercent: 67,
      candidateCount: 3,
      selectedCandidateId: null,
      committedCandidateId: null,
      commitProof: null,
      revealProof: null,
      commitmentHash: null,
      voterIdentifier: 'VOTER-SHA-9921-X',
      lastTransactionLabel: 'Belum ada commit dari akun ini.',
      supportCopy: 'Jika pilihan berubah sebelum dikirim, Anda masih bisa kembali dan memilih kandidat lain.',
      candidates: sharedDummyContext.candidates.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        faculty: candidate.faculty,
        vision: candidate.vision,
        mission: [...candidate.mission],
        votes: 0,
      })),
    },
    {
      id: 'ketua-kelompok-praktikum-bd-2026',
      title: 'Pemilihan Ketua Kelompok Praktikum Basis Data FTI 2026',
      organization: 'Praktikum Basis Data FTI UAJY',
      summary: 'Berikan suara untuk memilih ketua kelompok praktikum yang akan mengoordinasikan tugas, jadwal, dan komunikasi dengan asisten.',
      phase: 'reveal',
      deadlineIso: '2026-05-11T10:00:00+07:00',
      totalParticipants: 36,
      committedCount: 32,
      revealedCount: 24,
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
      supportCopy: 'Pastikan Anda menggunakan perangkat yang sama agar data komitmen tetap tersedia saat reveal.',
      candidates: [
        {
          id: 'c1',
          name: 'Gina Maharani',
          faculty: 'Informatika ’23',
          vision: 'Membangun kelompok praktikum yang disiplin, komunikatif, dan saling membantu.',
          mission: ['Menyusun jadwal internal kelompok.', 'Menjaga komunikasi rutin dengan asisten.'],
          votes: 12,
        },
        {
          id: 'c2',
          name: 'Kevin Adinata',
          faculty: 'Sistem Informasi ’23',
          vision: 'Mewujudkan kelompok praktikum yang tertib, transparan, dan tepat waktu.',
          mission: ['Membagi peran sesuai kekuatan anggota.', 'Mencatat progres tiap pertemuan.'],
          votes: 8,
        },
        {
          id: 'c3',
          name: 'Laras Putri',
          faculty: 'Informatika ’23',
          vision: 'Mendorong kelompok praktikum yang suportif, siap presentasi, dan konsisten mengumpulkan tugas.',
          mission: ['Menjaga komunikasi antaranggota.', 'Memastikan kesiapan presentasi sebelum deadline.'],
          votes: 4,
        },
      ],
    },
    {
      id: 'ukm-riset-sekretaris-2026',
      title: 'Pemilihan Sekretaris UKM Riset 2026',
      organization: sharedDummyContext.organization,
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
          vision: 'Membangun sekretariat UKM yang rapi, responsif, dan membantu seluruh pengurus bekerja lebih terstruktur.',
          mission: ['Merapikan arsip kegiatan.', 'Menyusun notulensi dan pengingat agenda rutin.'],
          votes: 0,
        },
        {
          id: 'c2',
          name: 'Rizki Fadillah',
          faculty: 'Teknik Mesin',
          vision: 'Mewujudkan administrasi UKM yang tertib, transparan, dan mudah diakses anggota.',
          mission: ['Digitalisasi dokumen organisasi.', 'Mempercepat distribusi informasi internal.'],
          votes: 0,
        },
      ],
    },
    {
      id: 'koordinator-psdm-himaforka-2025',
      title: 'Pemilihan Koordinator Divisi PSDM HIMAFORKA 2025',
      organization: 'HIMAFORKA FTI UAJY',
      summary: 'Hasil final telah diumumkan dan bukti audit pemilihan kepengurusan tersedia untuk diunduh.',
      phase: 'ended',
      deadlineIso: '2026-04-15T09:42:00+07:00',
      totalParticipants: 86,
      committedCount: 86,
      revealedCount: 86,
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
      voterIdentifier: 'EV-HMF-2025-021',
      lastTransactionLabel: 'Sertifikat publik sudah tersedia.',
      supportCopy: 'Anda bisa menyalin hash transaksi untuk diverifikasi langsung di Basescan.',
      candidates: [
        {
          id: 'c1',
          name: 'Nabila Putri',
          faculty: 'Informatika ’22',
          vision: 'PSDM HIMAFORKA yang hadir untuk pengembangan anggota sejak awal masa studi.',
          mission: ['Program mentoring antarangkatan.', 'Pemetaan minat dan potensi anggota.'],
          votes: 24,
        },
        {
          id: 'c2',
          name: 'Bagas Pramana',
          faculty: 'Sistem Informasi ’22',
          vision: 'Divisi PSDM yang terukur, dekat dengan anggota, dan aktif menyiapkan kader organisasi.',
          mission: ['Pelatihan kader berkala.', 'Evaluasi kebutuhan pengembangan anggota per semester.'],
          votes: 39,
        },
        {
          id: 'c3',
          name: 'Cindy Maharani',
          faculty: 'Informatika ’23',
          vision: 'Pengembangan anggota berbasis komunitas, apresiasi, dan ruang belajar yang konsisten.',
          mission: ['Kelas pengembangan soft skill.', 'Program apresiasi anggota aktif.'],
          votes: 23,
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
  if (phase === 'registration') return 'Registrasi'
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
  const getPriority = (election: VoterElection) => {
    if (election.phase === 'commit' && !election.commitProof) return 0
    if (election.phase === 'reveal' && !election.revealProof) return 1
    if (election.phase === 'registration') return 2
    if (election.phase === 'commit') return 3
    if (election.phase === 'reveal') return 4
    return 5
  }

  return [...elections].sort((left, right) => {
    const priorityDiff = getPriority(left) - getPriority(right)
    if (priorityDiff !== 0) return priorityDiff

    return new Date(left.deadlineIso).getTime() - new Date(right.deadlineIso).getTime()
  })
}

export function resolveElectionAction(election: VoterElection) {
  if (election.phase === 'commit') {
    return {
      label: 'Berikan Suara',
      href: `/pemilih/pemilihan/${election.id}/pilih-kandidat`,
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
      clearAllDemoVoteCommitments()
      persistStore(next)
      setStore(next)
    },
    selectCandidate(electionId: string, candidateId: string) {
      applyStore((current) => updateElection(current, electionId, (election) => ({
        ...election,
        selectedCandidateId: candidateId,
      })))
    },
    commitVote(electionId: string, commitmentHash?: string): VoterProof | null {
      let proof: VoterProof | null = null

      applyStore((current) => updateElection(current, electionId, (election) => {
        if (!election.selectedCandidateId) return election

        proof = createProof('Commit tersimpan')

        return {
          ...election,
          phase: 'reveal',
          committedCandidateId: election.selectedCandidateId,
          committedCount: Math.min(election.totalParticipants, election.committedCount + 1),
          commitmentHash: commitmentHash ?? `0x${randomHex(64)}`,
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
