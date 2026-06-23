'use client'

import { Check, Search, Users, X, Loader2, Filter } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ModalShell } from '@/components/ui/modal-shell'
import { useMasterVoters, useMasterVoterProdiOptions, useAddMasterVoterToWhitelist } from '@/hooks/use-master-voters'
import { useToast } from '@/components/ui/toast-provider'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import type { MasterVoterRecord } from '@/lib/repositories/types'
import { getInitials } from '@/lib/repositories/helpers'

interface PilihDariMasterVoterModalProps {
  open: boolean
  onClose: () => void
  proposalDraftId: string
  existingWallets: Set<string>
  onSuccess: () => void
}

export function PilihDariMasterVoterModal({ open, onClose, proposalDraftId, existingWallets, onSuccess }: PilihDariMasterVoterModalProps) {
  const { showToast } = useToast()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProdi, setFilterProdi] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  const masterVotersQuery = useMasterVoters({
    prodi: filterProdi || undefined,
    search: searchTerm || undefined,
  })
  const prodiOptionsQuery = useMasterVoterProdiOptions()
  const addToWhitelistMutation = useAddMasterVoterToWhitelist(proposalDraftId)

  const voters = masterVotersQuery.data ?? []
  const prodiOptions = prodiOptionsQuery.data ?? []

  // Separate voters: already whitelisted vs available
  const { alreadyWhitelisted, available } = useMemo(() => {
    const whitelisted: MasterVoterRecord[] = []
    const availableList: MasterVoterRecord[] = []
    for (const voter of voters) {
      if (voter.walletAddress && existingWallets.has(voter.walletAddress.toLowerCase())) {
        whitelisted.push(voter)
      } else if (!voter.walletAddress) {
        // Voters without wallet are shown but can't be added
        whitelisted.push(voter)
      } else {
        availableList.push(voter)
      }
    }
    return { alreadyWhitelisted: whitelisted, available: availableList }
  }, [voters, existingWallets])

  const selectedAvailable = useMemo(
    () => available.filter((v) => selectedIds.has(v.id)),
    [available, selectedIds],
  )

  const allAvailableSelected = available.length > 0 && available.every((v) => selectedIds.has(v.id))

  const toggleSelectAll = () => {
    if (allAvailableSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(available.map((v) => v.id)))
    }
  }

  const toggleVoter = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleAdd = () => {
    if (selectedAvailable.length === 0) return

    addToWhitelistMutation.mutate(
      { proposalDraftId, masterVoterIds: selectedAvailable.map((v) => v.id) },
      {
        onSuccess: (result) => {
          showToast({
            tone: 'success',
            title: 'Pemilih ditambahkan dari master data',
            description: `${result.added} pemilih berhasil ditambahkan ke whitelist.${result.skipped > 0 ? ` ${result.skipped} dilewati (sudah ada atau tanpa wallet).` : ''}`,
          })
          setSelectedIds(new Set())
          setSearchTerm('')
          setFilterProdi('')
          onSuccess()
          onClose()
        },
        onError: (error) => {
          showToast({
            tone: 'error',
            title: 'Gagal menambahkan pemilih',
            description: getRepositoryErrorMessage(error, 'Terjadi kesalahan saat menambahkan pemilih dari master data.'),
          })
        },
      },
    )
  }

  const handleClose = () => {
    if (addToWhitelistMutation.isPending) return
    setSelectedIds(new Set())
    setSearchTerm('')
    setFilterProdi('')
    onClose()
  }

  return (
    <ModalShell
      open={open}
      title="Pilih dari Data Master Voter"
      description="Pilih pemilih dari daftar mahasiswa terdaftar berdasarkan program studi atau fakultas."
      onClose={handleClose}
    >
      <div className="space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan NPM, nama, atau email..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-[14px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-100 px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-200"
          >
            <Filter className="h-3.5 w-3.5" />
            Filter Prodi
            {filterProdi && (
              <span className="ml-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                {filterProdi}
              </span>
            )}
          </button>
          <span className="text-[12px] text-slate-500">
            {available.length} tersedia / {voters.length} total
          </span>
        </div>

        {/* Prodi Filter */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <button
              type="button"
              onClick={() => setFilterProdi('')}
              className={`inline-flex h-8 items-center rounded-xl px-3 text-[12px] font-medium transition ${
                !filterProdi ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua
            </button>
            {prodiOptions.map((prodi) => (
              <button
                key={prodi}
                type="button"
                onClick={() => setFilterProdi(prodi === filterProdi ? '' : prodi)}
                className={`inline-flex h-8 items-center rounded-xl px-3 text-[12px] font-medium transition ${
                  filterProdi === prodi ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {prodi}
              </button>
            ))}
          </div>
        )}

        {/* Selected summary */}
        {selectedAvailable.length > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
            <span className="text-[13px] font-medium text-blue-800">
              {selectedAvailable.length} pemilih dipilih
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-[12px] font-medium text-blue-600 hover:text-blue-800"
            >
              Batalkan Pilihan
            </button>
          </div>
        )}

        {/* Voter list */}
        <div className="max-h-[400px] overflow-y-auto rounded-2xl border border-slate-100">
          {masterVotersQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              <span className="ml-2 text-[13px] text-slate-500">Memuat data voter...</span>
            </div>
          ) : voters.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-[14px] text-slate-500">Tidak ada data master voter ditemukan.</p>
            </div>
          ) : (
            <>
              {/* Select All */}
              {available.length > 0 && (
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allAvailableSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-[13px] font-medium text-slate-700">Pilih Semua ({available.length})</span>
                </div>
              )}

              {/* Available voters */}
              {available.length > 0 && (
                <div className="divide-y divide-slate-100">
                  {available.map((voter) => (
                    <label
                      key={voter.id}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-slate-50 ${
                        selectedIds.has(voter.id) ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(voter.id)}
                        onChange={() => toggleVoter(voter.id)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[12px] font-semibold text-slate-600">
                        {getInitials(voter.fullName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-medium text-slate-900">{voter.fullName}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            {voter.prodi}
                          </span>
                          {voter.angkatan && (
                            <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-400">
                              {voter.angkatan}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-slate-500">
                          <span className="font-mono">{voter.nim}</span>
                          <span>·</span>
                          <span className="truncate">{voter.email}</span>
                        </div>
                      </div>
                      {selectedIds.has(voter.id) && (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              )}

              {/* Already whitelisted / no wallet */}
              {alreadyWhitelisted.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[12px] font-medium text-slate-500">
                    {alreadyWhitelisted.length} voter tidak dapat dipilih (sudah di whitelist atau belum punya wallet)
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={addToWhitelistMutation.isPending}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-5 text-[14px] font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={selectedAvailable.length === 0 || addToWhitelistMutation.isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-black px-5 text-[14px] font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addToWhitelistMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                Tambahkan {selectedAvailable.length > 0 ? `${selectedAvailable.length} ` : ''}Pemilih
              </>
            )}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}
