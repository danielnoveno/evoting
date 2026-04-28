'use client'

import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'

import { basescan } from '@/lib/basescan'
import { AdminPhase, AdminVoter } from '@/lib/admin-demo-data'
import { getErrorMessage } from '@/lib/errors'
import { truncateAddress } from '@/lib/utils'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, Divider, SectionLabel } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { InfoBanner } from '@/components/ui/InfoBanner'

interface VoterListProps {
  phase: AdminPhase
  voters: AdminVoter[]
  onAddVoter: (address: `0x${string}`) => Promise<`0x${string}`>
  onRemoveVoter: (address: `0x${string}`) => Promise<`0x${string}`>
}

const walletPattern = /^0x[a-fA-F0-9]{40}$/

export function VoterList({ phase, voters, onAddVoter, onRemoveVoter }: VoterListProps) {
  const [walletInput, setWalletInput] = useState('')
  const [pendingAdd, setPendingAdd] = useState(false)
  const [pendingRemoveAddress, setPendingRemoveAddress] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)

  const phaseBlocked = phase !== 'registration'

  const sortedVoters = useMemo(
    () =>
      [...voters].sort((left, right) => {
        if (left.status === right.status) return 0
        if (left.status === 'verified') return -1
        return 1
      }),
    [voters],
  )

  const handleAdd = async () => {
    setErrorMessage(null)
    setSuccessMessage(null)

    const normalized = walletInput.trim()
    if (!walletPattern.test(normalized)) {
      setErrorMessage('Alamat wallet tidak valid — harus diawali 0x dan 42 karakter.')
      return
    }

    try {
      setPendingAdd(true)
      const hash = await onAddVoter(normalized as `0x${string}`)
      setTxHash(hash)
      setWalletInput('')
      setSuccessMessage('Pemilih berhasil didaftarkan ke whitelist.')
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setPendingAdd(false)
    }
  }

  const handleRemove = async (address: `0x${string}`) => {
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      setPendingRemoveAddress(address)
      const hash = await onRemoveVoter(address)
      setTxHash(hash)
      setSuccessMessage('Pemilih berhasil dihapus dari whitelist.')
      setRemoveTarget(null)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setPendingRemoveAddress(null)
    }
  }

  return (
    <Card>
      <SectionLabel>WHITELIST PEMILIH</SectionLabel>

      {phaseBlocked ? (
        <InfoBanner variant="warning">
          Fitur tambah/hapus whitelist hanya tersedia pada fase Registration.
        </InfoBanner>
      ) : null}

      <div className="mt-3 max-h-[260px] overflow-y-auto rounded-lg border border-slate-100">
        <div className="grid min-h-11 grid-cols-[1.2fr_0.7fr_0.4fr] items-center gap-3 border-b border-slate-100 bg-slate-50 px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
          <span>Wallet</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        {sortedVoters.length === 0 ? (
          <EmptyState
            subtitle="Tambahkan pemilih pertama agar dapat mengikuti voting."
            title="Belum ada pemilih terdaftar"
          />
        ) : (
          sortedVoters.map((voter) => {
            const removing = pendingRemoveAddress === voter.address

            return (
              <div
                className="grid min-h-11 grid-cols-[1.2fr_0.7fr_0.4fr] items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-xs text-slate-900 last:border-b-0"
                key={voter.address}
              >
                <div>
                  <p className="font-mono text-xs text-slate-600" title={voter.address}>
                    {truncateAddress(voter.address)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{voter.addedAt}</p>
                </div>

                <Badge variant={voter.status === 'verified' ? 'active' : 'commit'}>
                  {voter.status === 'verified' ? 'Terverifikasi' : 'Pending'}
                </Badge>

                <div className="flex justify-end">
                  {removeTarget === voter.address ? (
                    <div className="flex items-center gap-1">
                      <Button
                        disabled={removing}
                        onClick={() => setRemoveTarget(null)}
                        size="sm"
                        variant="ghost"
                      >
                        Batal
                      </Button>
                      <Button
                        loading={removing}
                        onClick={() => handleRemove(voter.address)}
                        size="sm"
                        variant="destructive"
                      >
                        Hapus
                      </Button>
                    </div>
                  ) : (
                    <button
                      aria-label={`Hapus pemilih ${truncateAddress(voter.address)}`}
                      className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      disabled={phaseBlocked}
                      onClick={() => setRemoveTarget(voter.address)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <Divider />

      <div className="flex flex-wrap gap-2">
        <input
          className="h-9 min-w-[220px] flex-1 rounded-md border border-slate-200 px-3 text-sm focus:border-[#0F172A] focus:outline-none focus:ring-4 focus:ring-slate-900/10"
          disabled={phaseBlocked || pendingAdd}
          onChange={(event) => setWalletInput(event.target.value)}
          placeholder="0x..."
          value={walletInput}
        />
        <Button
          disabled={phaseBlocked || walletInput.trim().length === 0}
          loading={pendingAdd}
          onClick={handleAdd}
          size="sm"
          variant="primary"
        >
          + Daftar
        </Button>
        <Button disabled={phaseBlocked} size="sm" variant="secondary">
          Import CSV
        </Button>
      </div>

      {errorMessage ? (
        <div className="mt-3">
          <InfoBanner variant="danger">{errorMessage}</InfoBanner>
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-semibold text-emerald-800">{successMessage}</p>
          {txHash ? (
            <a
              className="mt-1 inline-flex text-xs text-blue-700 underline"
              href={basescan.tx(txHash)}
              rel="noreferrer"
              target="_blank"
            >
              Lihat detail di Basescan ↗
            </a>
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}
