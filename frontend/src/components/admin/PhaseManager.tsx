'use client'

import { useMemo, useState } from 'react'

import { basescan } from '@/lib/basescan'
import {
  AdminPhase,
  getNextPhase,
  getPhaseBadgeVariant,
  getPhaseLabel,
} from '@/lib/admin-demo-data'
import { getErrorMessage } from '@/lib/errors'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, Divider, SectionLabel } from '@/components/ui/Card'
import { InfoBanner } from '@/components/ui/InfoBanner'

interface PhaseManagerProps {
  phase: AdminPhase
  onTransition: () => Promise<`0x${string}`>
}

const phaseOrder: AdminPhase[] = ['registration', 'commit', 'reveal', 'ended']

export function PhaseManager({ phase, onTransition }: PhaseManagerProps) {
  const [isPending, setIsPending] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)

  const nextPhase = useMemo(() => getNextPhase(phase), [phase])

  const handleTransition = async () => {
    setIsPending(true)
    setErrorMessage(null)

    try {
      const hash = await onTransition()
      setTxHash(hash)
      setShowConfirm(false)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <SectionLabel>FASE VOTING</SectionLabel>

      <div className="space-y-2">
        {phaseOrder.map((item, index) => {
          const isActive = item === phase

          return (
            <div
              className={
                isActive
                  ? 'flex items-center justify-between rounded-md bg-slate-50 px-2 py-2'
                  : 'flex items-center justify-between rounded-md px-2 py-2'
              }
              key={item}
            >
              <p className="text-sm text-slate-900">
                {index + 1}. {getPhaseLabel(item)}
              </p>
              <Badge variant={isActive ? getPhaseBadgeVariant(item) : 'ended'}>
                {isActive ? 'Aktif' : 'Belum'}
              </Badge>
            </div>
          )
        })}
      </div>

      <Divider />

      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        Pindah ke fase berikutnya
      </label>
      <select
        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-[#0F172A] focus:outline-none focus:ring-4 focus:ring-slate-900/10"
        disabled
        value={nextPhase ?? 'ended'}
      >
        <option value={nextPhase ?? 'ended'}>
          {nextPhase ? getPhaseLabel(nextPhase) : 'Tidak ada fase berikutnya'}
        </option>
      </select>

      <Button
        className="mt-3"
        disabled={!nextPhase}
        fullWidth
        loading={isPending}
        onClick={() => setShowConfirm(true)}
        variant="primary"
      >
        Konfirmasi Transisi
      </Button>

      <p className="mt-2 text-[11px] italic text-slate-400">
        Transisi fase tidak dapat dibatalkan.
      </p>

      {showConfirm ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Tutup fase {getPhaseLabel(phase)}?</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Setelah transisi dijalankan, fase saat ini tidak bisa dibuka kembali.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button onClick={() => setShowConfirm(false)} size="sm" variant="ghost">
              Batal
            </Button>
            <Button loading={isPending} onClick={handleTransition} size="sm" variant="primary">
              Ya, Tutup Fase
            </Button>
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-3">
          <InfoBanner variant="danger">{errorMessage}</InfoBanner>
        </div>
      ) : null}

      {txHash ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-semibold text-emerald-800">Transisi fase berhasil dicatat.</p>
          <a
            className="mt-1 inline-flex text-xs text-blue-700 underline"
            href={basescan.tx(txHash)}
            rel="noreferrer"
            target="_blank"
          >
            Lihat detail di Basescan ↗
          </a>
        </div>
      ) : null}
    </Card>
  )
}
