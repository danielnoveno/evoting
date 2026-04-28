'use client'

import { useMemo, useState } from 'react'
import { Pencil, Trash2, UserRound } from 'lucide-react'

import { basescan } from '@/lib/basescan'
import { AdminCandidate, AdminPhase } from '@/lib/admin-demo-data'
import { getErrorMessage } from '@/lib/errors'

import { Button } from '@/components/ui/Button'
import { Card, Divider, SectionLabel } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { InfoBanner } from '@/components/ui/InfoBanner'

interface CandidateListProps {
  candidates: AdminCandidate[]
  phase: AdminPhase
  candidateMutableOnChain: boolean
  onAddCandidate: (payload: {
    name: string
    nim: string
    vision: string
  }) => Promise<`0x${string}`>
  onRemoveCandidate: (candidateId: number) => Promise<`0x${string}`>
}

export function CandidateList({
  candidates,
  phase,
  candidateMutableOnChain,
  onAddCandidate,
  onRemoveCandidate,
}: CandidateListProps) {
  const [openForm, setOpenForm] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nimInput, setNimInput] = useState('')
  const [visionInput, setVisionInput] = useState('')
  const [pendingAdd, setPendingAdd] = useState(false)
  const [pendingRemoveId, setPendingRemoveId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)

  const phaseBlocked = phase !== 'registration' || !candidateMutableOnChain

  const totalVotes = useMemo(
    () => candidates.reduce((sum, candidate) => sum + candidate.votes, 0),
    [candidates],
  )

  const handleAddCandidate = async () => {
    setErrorMessage(null)

    if (!nameInput.trim() || !nimInput.trim()) {
      setErrorMessage('Nama kandidat dan NIM wajib diisi.')
      return
    }

    try {
      setPendingAdd(true)
      const hash = await onAddCandidate({
        name: nameInput.trim(),
        nim: nimInput.trim(),
        vision: visionInput.trim() || 'Belum ada visi-misi yang ditambahkan.',
      })

      setTxHash(hash)
      setNameInput('')
      setNimInput('')
      setVisionInput('')
      setOpenForm(false)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setPendingAdd(false)
    }
  }

  const handleRemoveCandidate = async (candidateId: number) => {
    setErrorMessage(null)

    try {
      setPendingRemoveId(candidateId)
      const hash = await onRemoveCandidate(candidateId)
      setTxHash(hash)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setPendingRemoveId(null)
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <SectionLabel className="mb-0">KANDIDAT</SectionLabel>
        <Button
          disabled={phaseBlocked}
          onClick={() => setOpenForm((previous) => !previous)}
          size="sm"
          variant="ghost"
        >
          + Tambah Kandidat
        </Button>
      </div>

      {phaseBlocked ? (
        <InfoBanner variant="warning">
          {candidateMutableOnChain
            ? 'Penambahan kandidat hanya tersedia saat fase Registration.'
            : 'Kandidat dikunci setelah space dibuat. Perubahan kandidat tidak didukung on-chain pada versi ini.'}
        </InfoBanner>
      ) : null}

      {openForm ? (
        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Nama Kandidat</label>
              <input
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                disabled={pendingAdd}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="cth: Bella Sari Putri"
                value={nameInput}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">NIM</label>
              <input
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 font-mono text-sm"
                disabled={pendingAdd}
                onChange={(event) => setNimInput(event.target.value)}
                placeholder="220711001"
                value={nimInput}
              />
            </div>
          </div>

          <div className="mt-2">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Visi Singkat</label>
            <textarea
              className="min-h-20 w-full rounded-md border border-slate-200 bg-white p-3 text-sm"
              disabled={pendingAdd}
              onChange={(event) => setVisionInput(event.target.value)}
              placeholder="Satu kalimat visi kandidat"
              value={visionInput}
            />
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <Button onClick={() => setOpenForm(false)} size="sm" variant="ghost">
              Batal
            </Button>
            <Button loading={pendingAdd} onClick={handleAddCandidate} size="sm" variant="primary">
              Simpan Kandidat
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-3 space-y-2">
        {candidates.length === 0 ? (
          <EmptyState
            action={
              <Button
                disabled={phaseBlocked}
                onClick={() => setOpenForm(true)}
                size="sm"
                variant="secondary"
              >
                + Tambah Kandidat
              </Button>
            }
            subtitle="Tambahkan kandidat pertama sebelum fase commit dimulai."
            title="Belum ada kandidat"
          />
        ) : (
          candidates.map((candidate) => {
            const pendingRemove = pendingRemoveId === candidate.id

            return (
              <div
                className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                key={candidate.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                      <UserRound className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{candidate.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-400">{candidate.nim}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      aria-label={`Edit kandidat ${candidate.name}`}
                      className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      disabled={!candidateMutableOnChain}
                      type="button"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      aria-label={`Hapus kandidat ${candidate.name}`}
                      className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      disabled={phaseBlocked || pendingRemove}
                      onClick={() => handleRemoveCandidate(candidate.id)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                  {candidate.vision}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Perolehan suara: {candidate.votes} dari total {totalVotes}
                </p>
              </div>
            )
          })
        )}
      </div>

      {errorMessage ? (
        <div className="mt-3">
          <InfoBanner variant="danger">{errorMessage}</InfoBanner>
        </div>
      ) : null}

      {txHash ? (
        <>
          <Divider />
          <a
            className="inline-flex text-xs text-blue-700 underline"
            href={basescan.tx(txHash)}
            rel="noreferrer"
            target="_blank"
          >
            Lihat detail transaksi terakhir di Basescan ↗
          </a>
        </>
      ) : null}
    </Card>
  )
}
