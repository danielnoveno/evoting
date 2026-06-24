export type StoredCandidate = {
  id: string
  number: string
  name: string
  faculty: string
  summary: string
  imageTone: 'dark' | 'neutral'
  identityNumber: string
  bio: string
  vision: string
  mission: string
}

const keyForElection = (electionId: string) => `votein_admin_candidates_${electionId}`

function loadStoredCandidates(electionId: string): StoredCandidate[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(keyForElection(electionId))
  if (!raw) return []
  try {
    return JSON.parse(raw) as StoredCandidate[]
  } catch {
    return []
  }
}

function saveStoredCandidates(electionId: string, candidates: StoredCandidate[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(keyForElection(electionId), JSON.stringify(candidates))
}

export function upsertStoredCandidate(electionId: string, candidate: StoredCandidate) {
  const candidates = loadStoredCandidates(electionId)
  const index = candidates.findIndex((item) => item.id === candidate.id)

  if (index >= 0) {
    candidates[index] = candidate
  } else {
    candidates.push(candidate)
  }

  saveStoredCandidates(electionId, candidates)
}

export function deleteStoredCandidate(electionId: string, candidateId: string) {
  const candidates = loadStoredCandidates(electionId).filter((item) => item.id !== candidateId)
  saveStoredCandidates(electionId, candidates)
}
