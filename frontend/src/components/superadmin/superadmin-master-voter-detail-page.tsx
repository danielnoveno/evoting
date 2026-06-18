'use client'

import { AlertTriangle, Loader2, Save, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AppSectionCard } from '@/components/ui/app-section-card'
import { useToast } from '@/components/ui/toast-provider'
import {
  SuperadminAvatar,
  SuperadminDetailIntro,
  SuperadminFieldLabel,
  SuperadminSectionHeading,
  SuperadminSelectInput,
  SuperadminShell,
  SuperadminTextInput,
  SuperadminToolbarButton,
} from '@/components/superadmin/superadmin-shell'
import { useMasterVoterDetail, useUpdateMasterVoter, type MasterVoter } from '@/hooks/use-master-voters-admin'

const PRODI_OPTIONS = [
  'Informatika',
  'Sistem Informasi',
  'Teknik Industri',
  'Arsitektur',
  'Teknik Sipil',
  'Manajemen',
  'Akuntansi',
  'Ekonomi Pembangunan',
  'Hukum',
  'Biologi',
  'Ilmu Komunikasi',
  'Sosiologi',
] as const

type FormState = {
  nim: string
  fullName: string
  prodi: string
  fakultas: string
  angkatan: string
  status: MasterVoter['status']
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'VT'
}

function getStatusLabel(status: MasterVoter['status']) {
  if (status === 'active') return 'Aktif'
  if (status === 'pending') return 'Menunggu'
  return 'Nonaktif'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function buildForm(voter: MasterVoter): FormState {
  return {
    nim: voter.nim,
    fullName: voter.fullName,
    prodi: voter.prodi,
    fakultas: voter.fakultas,
    angkatan: voter.angkatan ?? '',
    status: voter.status,
  }
}

function ReadOnlyField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className={`mt-2 break-all text-[15px] font-semibold text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

export function SuperadminMasterVoterDetailPage({ voterId }: { voterId: string }) {
  const { showToast } = useToast()
  const voterQuery = useMasterVoterDetail(voterId)
  const updateVoterMutation = useUpdateMasterVoter()
  const [form, setForm] = useState<FormState | null>(null)

  useEffect(() => {
    if (voterQuery.data) setForm(buildForm(voterQuery.data))
  }, [voterQuery.data])

  const voter = voterQuery.data
  const isDirty = useMemo(() => {
    if (!voter || !form) return false
    const initial = buildForm(voter)
    return JSON.stringify(initial) !== JSON.stringify(form)
  }, [voter, form])

  const handleSave = () => {
    if (!form) return
    if (!/^\d{8,10}$/.test(form.nim)) {
      showToast({ tone: 'error', title: 'NIM tidak valid', description: 'NIM harus berupa 8-10 digit angka.' })
      return
    }
    if (!form.fullName.trim() || !form.prodi.trim() || !form.fakultas.trim()) {
      showToast({ tone: 'error', title: 'Data belum lengkap', description: 'Nama, program studi, dan fakultas wajib diisi.' })
      return
    }
    if (form.angkatan.trim() && !/^\d{4}$/.test(form.angkatan.trim())) {
      showToast({ tone: 'error', title: 'Angkatan tidak valid', description: 'Isi tahun 4 digit, misalnya 2022.' })
      return
    }

    updateVoterMutation.mutate({
      id: voterId,
      nim: form.nim.trim(),
      fullName: form.fullName.trim(),
      prodi: form.prodi.trim(),
      fakultas: form.fakultas.trim(),
      angkatan: form.angkatan.trim() || null,
      status: form.status,
    }, {
      onSuccess: (updated) => {
        setForm(buildForm(updated))
        showToast({ tone: 'success', title: 'Data voter diperbarui', description: 'Email dan wallet tetap dikunci sesuai aturan identitas.' })
      },
      onError: (error) => {
        showToast({ tone: 'error', title: 'Gagal memperbarui voter', description: error.message })
      },
    })
  }

  return (
    <SuperadminShell>
      {voterQuery.isLoading ? (
        <div className="flex min-h-[420px] items-center justify-center rounded-[32px] border border-slate-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
        </div>
      ) : voterQuery.error || !voter || !form ? (
        <AppSectionCard>
          <div className="flex items-start gap-4 rounded-[24px] border border-red-100 bg-red-50 p-5 text-red-800">
            <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Detail voter tidak dapat dimuat</p>
              <p className="mt-1 text-[14px] leading-6">{voterQuery.error?.message ?? 'Data voter tidak ditemukan.'}</p>
            </div>
          </div>
        </AppSectionCard>
      ) : (
        <div className="space-y-8">
          <SuperadminDetailIntro
            backHref="/superadmin/data-voter"
            backLabel="Kembali ke Data Voter"
            chips={(
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">
                {getStatusLabel(voter.status)}
              </span>
            )}
            title={voter.fullName}
            meta={(
              <>
                <span className="font-mono">NIM {voter.nim}</span>
                <span>{voter.prodi}</span>
              </>
            )}
            description="Superadmin dapat memperbarui informasi akademik voter. Email institusi dan alamat wallet dikunci agar identitas login dan jejak aktivasi tidak berubah tanpa proses resmi."
            actions={(
              <SuperadminToolbarButton variant="primary" onClick={handleSave} disabled={!isDirty || updateVoterMutation.isPending}>
                {updateVoterMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan Perubahan
              </SuperadminToolbarButton>
            )}
          />

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <AppSectionCard>
              <div className="flex items-center gap-4">
                <SuperadminAvatar initials={getInitials(voter.fullName)} />
                <div>
                  <p className="text-[18px] font-semibold text-slate-900">{voter.fullName}</p>
                  <p className="mt-1 text-[14px] text-slate-500">Terakhir diperbarui {formatDate(voter.updatedAt)}</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <ReadOnlyField label="Email institusi (dikunci)" value={voter.email} mono />
                <ReadOnlyField label="Wallet address (dikunci)" value={voter.walletAddress ?? 'Belum terhubung'} mono />
                <ReadOnlyField label="Dibuat" value={formatDate(voter.createdAt)} />
              </div>
            </AppSectionCard>

            <AppSectionCard>
              <SuperadminSectionHeading
                title="Edit Informasi Voter"
                description="Perubahan hanya berlaku untuk data master voter. Email dan wallet tidak tersedia sebagai kolom edit."
              />

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <label className="block">
                  <SuperadminFieldLabel required>NIM</SuperadminFieldLabel>
                  <SuperadminTextInput value={form.nim} onChange={(event) => setForm((current) => current ? { ...current, nim: event.target.value.replace(/\D/g, '') } : current)} />
                </label>

                <label className="block">
                  <SuperadminFieldLabel required>Nama Lengkap</SuperadminFieldLabel>
                  <SuperadminTextInput value={form.fullName} onChange={(event) => setForm((current) => current ? { ...current, fullName: event.target.value } : current)} />
                </label>

                <label className="block">
                  <SuperadminFieldLabel required>Program Studi</SuperadminFieldLabel>
                  <SuperadminSelectInput value={form.prodi} onChange={(event) => setForm((current) => current ? { ...current, prodi: event.target.value } : current)}>
                    {PRODI_OPTIONS.map((prodi) => <option key={prodi} value={prodi}>{prodi}</option>)}
                    {!PRODI_OPTIONS.includes(form.prodi as (typeof PRODI_OPTIONS)[number]) ? <option value={form.prodi}>{form.prodi}</option> : null}
                  </SuperadminSelectInput>
                </label>

                <label className="block">
                  <SuperadminFieldLabel required>Fakultas</SuperadminFieldLabel>
                  <SuperadminTextInput value={form.fakultas} onChange={(event) => setForm((current) => current ? { ...current, fakultas: event.target.value } : current)} />
                </label>

                <label className="block">
                  <SuperadminFieldLabel>Angkatan</SuperadminFieldLabel>
                  <SuperadminTextInput value={form.angkatan} placeholder="Cth: 2022" onChange={(event) => setForm((current) => current ? { ...current, angkatan: event.target.value.replace(/\D/g, '').slice(0, 4) } : current)} />
                </label>

                <label className="block">
                  <SuperadminFieldLabel required>Status</SuperadminFieldLabel>
                  <SuperadminSelectInput value={form.status} onChange={(event) => setForm((current) => current ? { ...current, status: event.target.value as MasterVoter['status'] } : current)}>
                    <option value="active">Aktif</option>
                    <option value="pending">Menunggu</option>
                    <option value="inactive">Nonaktif</option>
                  </SuperadminSelectInput>
                </label>
              </div>

              <div className="mt-6 rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-[13px] leading-6 text-amber-800">
                <div className="flex gap-3">
                  <UserRound className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Email dan wallet address hanya ditampilkan untuk audit identitas. Jika perlu mengganti keduanya, lakukan proses aktivasi ulang yang terkontrol, bukan edit manual dari halaman ini.</p>
                </div>
              </div>
            </AppSectionCard>
          </div>
        </div>
      )}
    </SuperadminShell>
  )
}
