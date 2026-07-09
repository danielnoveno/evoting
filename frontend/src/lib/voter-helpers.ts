
import type { VoterElection, VoterElectionPhase, VoterElectionViewState, VoterLogItem, VoterStore } from './voter-store'

const BASESCAN_ROOT = 'https://sepolia.basescan.org'

export function basescanTxUrl(hash: string) {
  return `${BASESCAN_ROOT}/tx/${hash}`
}

export function formatDateTime(value: string | null): string {
  if (!value) return 'Jadwal belum diatur'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Jadwal belum diatur'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
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
  if (!address) return 'Belum terhubung'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function shortenHash(hash: string | null | undefined): string {
  if (!hash) return 'Belum tersedia'
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

export function getPhaseLabel(phase: VoterElectionPhase) {
  if (phase === 'registration') return 'Menunggu Dibuka'
  if (phase === 'commit') return 'Pencoblosan'
  if (phase === 'reveal') return 'Konfirmasi Suara'
  if (phase === 'suspended') return 'Ditangguhkan'
  return 'Selesai'
}

export function getPhaseTone(phase: VoterElectionPhase) {
  if (phase === 'registration') return 'warning'
  if (phase === 'commit') return 'success'
  if (phase === 'reveal') return 'info'
  if (phase === 'suspended') return 'warning'
  return 'success'
}

export function getElectionProgress(election: VoterElection) {
  if (!election.totalParticipants) return 0
  if (election.phase === 'ended') return 100
  if (election.phase === 'suspended') return 0
  const counted = election.phase === 'reveal' ? election.revealedCount : election.committedCount
  return Math.min(100, Math.round((counted / election.totalParticipants) * 100))
}

export function getElectionViewState(election: VoterElection): VoterElectionViewState {
  const hasCommitted = Boolean(election.commitProof && election.committedCandidateId)
  const hasRevealed = Boolean(election.revealProof)
  // Suspended or registration elections block all actions
  if (election.phase === 'suspended') return { hasCommitted, hasRevealed, canCommit: false, canReveal: false, canViewResults: false, nextAction: 'wait' }
  if (election.phase === 'registration') return { hasCommitted, hasRevealed, canCommit: false, canReveal: false, canViewResults: false, nextAction: 'wait' }
  const canCommit = election.phase === 'commit' && !hasCommitted
  const canReveal = election.phase === 'reveal' && hasCommitted && !hasRevealed
  const canViewResults = election.phase === 'ended' || election.phase === 'reveal' || hasRevealed

  if (canCommit) return { hasCommitted, hasRevealed, canCommit, canReveal, canViewResults, nextAction: 'commit' }
  if (canReveal) return { hasCommitted, hasRevealed, canCommit, canReveal, canViewResults, nextAction: 'reveal' }
  if (canViewResults) return { hasCommitted, hasRevealed, canCommit, canReveal, canViewResults, nextAction: 'results' }
  return { hasCommitted, hasRevealed, canCommit, canReveal, canViewResults, nextAction: 'wait' }
}

export function sortDashboardElections(elections: VoterElection[]) {
  const getPriority = (election: VoterElection) => {
    const viewState = getElectionViewState(election)
    if (viewState.nextAction === 'commit') return 0
    if (viewState.nextAction === 'reveal') return 1
    if (election.phase === 'suspended') return 2
    if (election.phase === 'registration') return 3
    if (election.phase === 'commit') return 4
    if (election.phase === 'reveal') return 5
    return 6
  }

  return [...elections].sort((left, right) => {
    const priorityDiff = getPriority(left) - getPriority(right)
    if (priorityDiff !== 0) return priorityDiff
    return new Date(left.deadlineIso).getTime() - new Date(right.deadlineIso).getTime()
  })
}

export function resolveElectionAction(election: VoterElection) {
  const viewState = getElectionViewState(election)
  if (election.phase === 'suspended') return { label: 'Ditangguhkan', href: `/pemilih/pemilihan/${election.id}/pilih-kandidat` }
  if (viewState.nextAction === 'commit') return { label: 'Berikan Suara', href: `/pemilih/pemilihan/${election.id}/pilih-kandidat` }
  if (viewState.nextAction === 'reveal') return { label: 'Menunggu Penghitungan', href: `/pemilih/pemilihan/${election.id}/hasil` }
  if (viewState.nextAction === 'results') return { label: 'Lihat Hasil', href: `/pemilih/pemilihan/${election.id}/hasil` }
  return { label: 'Belum Dibuka', href: `/pemilih#pemilihan-${election.id}` }
}

export function getElectionResultRows(election: VoterElection) {
  const totalVotes = election.candidates.reduce((sum, candidate) => sum + candidate.votes, 0)
  return [...election.candidates]
    .sort((left, right) => right.votes - left.votes)
    .map((candidate) => ({ ...candidate, percentage: totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0, totalVotes }))
}

export function getRecentLogs(store: VoterStore): VoterLogItem[] {
  return store.elections
    .flatMap((election) => {
      const items: VoterLogItem[] = []
      if (election.commitProof) {
        items.push({ id: `${election.id}-commit`, title: `${election.title} · Pilihan tersimpan`, detail: `Kode bukti: ${formatWallet(election.commitProof.txHash)} · Blok #${formatNumber(election.commitProof.blockNumber)}`, timeLabel: formatDateTime(election.commitProof.createdAt), tone: 'success' })
      }
      if (election.phase === 'reveal' && !election.revealProof) {
        items.push({ id: `${election.id}-phase`, title: `${election.title} · Penghitungan dibuka`, detail: 'Sistem sedang menyiapkan pengesahan suara otomatis.', timeLabel: election.lastTransactionLabel, tone: 'info' })
      }
      if (election.revealProof) {
        items.push({ id: `${election.id}-reveal`, title: `${election.title} · Suara disahkan`, detail: `Kode bukti: ${formatWallet(election.revealProof.txHash)} · Blok #${formatNumber(election.revealProof.blockNumber)}`, timeLabel: formatDateTime(election.revealProof.createdAt), tone: 'success' })
      }
      return items
    })
    .slice(0, 6)
}
