'use client'

import { ShieldCheck, UserCog } from 'lucide-react'
import { notFound, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  SuperadminFieldLabel,
  SuperadminPageHeader,
  SuperadminRadioCard,
  SuperadminSectionCard,
  SuperadminSectionHeading,
  SuperadminSelectInput,
  SuperadminShell,
  SuperadminStatusBadge,
  SuperadminTextInput,
  SuperadminToolbarButton,
} from '@/components/superadmin/superadmin-shell'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import { useSuperadminAdminDirectory, useUpdateAdminRegistry } from '@/hooks/use-profile'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { mapDirectoryAdmin } from '@/lib/superadmin-admin-mapper'
import { useAdminProposalList } from '@/hooks/use-admin-proposal-list'
import { syncAdminSpaces } from '@/lib/repositories/adminAccessRepository'
import { Checkbox } from '@/components/ui/checkbox'
import type { ProposalDraftRecord } from '@/lib/repositories/types'

type AdminScope = 'all' | 'specific'
type AdminStatus = 'Aktif' | 'Menunggu' | 'Nonaktif'

function inferScope(accessDetail: string): AdminScope {
  return accessDetail === 'Pemilihan Tertentu' || accessDetail.includes('Space') ? 'specific' : 'all'
}

export default function SuperadminAdminEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const adminId = decodeURIComponent(params.id)
  const adminDirectoryQuery = useSuperadminAdminDirectory()
  const updateAdminMutation = useUpdateAdminRegistry()
  const proposalDraftsQuery = useAdminProposalList()
  const directoryRecord = useMemo(() => adminDirectoryQuery.data?.find((item) => item.email === adminId && item.role === 'admin') ?? null, [adminDirectoryQuery.data, adminId])
  const admin = useMemo(() => directoryRecord ? mapDirectoryAdmin(directoryRecord) : null, [directoryRecord])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)

  const initialForm = useMemo(() => ({
    name: admin?.name ?? '',
    email: admin?.email ?? '',
    organizationName: directoryRecord?.organizationName ?? '',
    scope: directoryRecord?.accessScope ?? (admin ? inferScope(admin.accessDetail) : 'all' as AdminScope),
    status: (admin?.status ?? 'Menunggu') as AdminStatus,
    accessLabel: admin?.accessLabel ?? 'Admin Organisasi',
    accessDetail: admin?.accessDetail ?? 'Pemilihan Tertentu',
  }), [admin, directoryRecord])

  const [formData, setFormData] = useState(initialForm)
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>([])
  const editSource = searchParams.get('from')
  const backHref = editSource === 'list'
    ? '/superadmin/manajemen-admin'
    : `/superadmin/manajemen-admin/${encodeURIComponent(adminId)}`
  const backLabel = editSource === 'list' ? 'Kembali ke Manajemen Admin' : 'Kembali ke Detail Admin'

  useEffect(() => {
    setFormData(initialForm)
    if (directoryRecord?.assignedSpaces) {
      setSelectedSpaceIds(directoryRecord.assignedSpaces.map(s => s.proposalDraftId))
    }
  }, [initialForm, directoryRecord])

  if (adminDirectoryQuery.isLoading) {
    return (
      <SuperadminShell>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-black" />
        </div>
      </SuperadminShell>
    )
  }

  if (!admin || !directoryRecord) notFound()

  const isSpacesDirty = useMemo(() => {
    const initialIds = (directoryRecord.assignedSpaces || []).map(s => s.proposalDraftId).sort()
    const currentIds = [...selectedSpaceIds].sort()
    return JSON.stringify(initialIds) !== JSON.stringify(currentIds)
  }, [directoryRecord.assignedSpaces, selectedSpaceIds])

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialForm) || isSpacesDirty

  const handleChange = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((current) => ({ ...current, [key]: value }))
  }

  const handleSaveClick = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast({ tone: 'error', title: 'Data admin belum lengkap', description: 'Nama lengkap dan email institusi wajib diisi.' })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showToast({ tone: 'error', title: 'Email belum valid', description: 'Gunakan format email yang valid.' })
      return
    }

    if (formData.scope === 'specific' && selectedSpaceIds.length === 0) {
      showToast({ tone: 'error', title: 'Akses pemilihan belum dipilih', description: 'Pilih minimal satu pemilihan untuk admin dengan akses terbatas.' })
      return
    }

    setConfirmOpen(true)
  }

  const handleConfirmSave = () => {
    updateAdminMutation.mutate(
      {
        currentEmail: directoryRecord.email,
        input: {
          email: formData.email,
          displayName: formData.name,
          organizationName: formData.organizationName,
          accessScope: formData.scope,
          status: formData.status === 'Nonaktif' ? 'inactive' : formData.status === 'Aktif' ? 'active' : 'pending',
          description: formData.accessDetail,
        },
      },
      {
        onSuccess: async (updated) => {
          // Sync specific space access if needed
          if (formData.scope === 'specific') {
            try {
              await syncAdminSpaces(updated.email, selectedSpaceIds)
            } catch (error) {
              console.error('Failed to sync spaces:', error)
              showToast({ tone: 'info', title: 'Akses pemilihan gagal disimpan', description: 'Profil diperbarui, tetapi daftar akses pemilihan gagal disinkronkan.' })
            }
          } else if (formData.scope === 'all' && isSpacesDirty) {
            // Clear spaces if scope changed to 'all'
            try {
              await syncAdminSpaces(updated.email, [])
            } catch (error) {
              console.error('Failed to clear spaces:', error)
            }
          }

          setConfirmOpen(false)
          showToast({
            tone: 'success',
            title: 'Perubahan admin berhasil disimpan',
            description: 'Registry admin organisasi sudah diperbarui.',
          })
          router.push(editSource === 'list'
            ? '/superadmin/manajemen-admin'
            : `/superadmin/manajemen-admin/${encodeURIComponent(updated.email)}`)
        },
        onError: (error) => {
          setConfirmOpen(false)
          showToast({ tone: 'error', title: 'Gagal menyimpan perubahan', description: getRepositoryErrorMessage(error) })
        },
      },
    )
  }

  const handleCancel = () => {
    if (!isDirty) {
      router.push(backHref)
      return
    }
    setCancelConfirmOpen(true)
  }

  return (
    <SuperadminShell>
      <ScrollReveal variant="fade-up" duration={800}>
        <SuperadminPageHeader
          backHref={backHref}
          backLabel={backLabel}
          title="Edit Admin"
          description="Perbarui data admin dan tinjau kembali hak akses yang berlaku."
          actions={(
            <>
              <button type="button" onClick={handleCancel} className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-100 px-6 text-[15px] font-medium text-slate-700 hover:bg-slate-200">
                Batal
              </button>
              <SuperadminToolbarButton variant="primary" onClick={handleSaveClick} disabled={updateAdminMutation.isPending}>
                {updateAdminMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </SuperadminToolbarButton>
            </>
          )}
        />
      </ScrollReveal>

      <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_420px]">
        <div className="space-y-6">
          <SuperadminSectionCard>
            <SuperadminSectionHeading title="Informasi Admin" description="Gunakan data ini untuk memperbarui informasi admin." />
            <div className="mt-8 grid gap-5 xl:grid-cols-2">
              <label className="block xl:col-span-2">
                <SuperadminFieldLabel>Nama Lengkap</SuperadminFieldLabel>
                <SuperadminTextInput value={formData.name} onChange={(event) => handleChange('name', event.target.value)} placeholder="Masukkan nama lengkap" />
              </label>

              <label className="block xl:col-span-2">
                <SuperadminFieldLabel>Email Institusi</SuperadminFieldLabel>
                <SuperadminTextInput value={formData.email} onChange={(event) => handleChange('email', event.target.value)} placeholder="nama@institusi.edu" />
              </label>

              <label className="block xl:col-span-2">
                <SuperadminFieldLabel>Nama Organisasi</SuperadminFieldLabel>
                <SuperadminTextInput value={formData.organizationName} onChange={(event) => handleChange('organizationName', event.target.value)} placeholder="Contoh: HIMAFORKA FTI UAJY" />
              </label>

              <label className="block">
                <SuperadminFieldLabel>Status Akun</SuperadminFieldLabel>
                <SuperadminSelectInput value={formData.status} onChange={(event) => handleChange('status', event.target.value as AdminStatus)}>
                  <option value="Aktif">Aktif</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Nonaktif">Nonaktif</option>
                </SuperadminSelectInput>
              </label>

              <label className="block">
                <SuperadminFieldLabel>Label Akses</SuperadminFieldLabel>
                <SuperadminTextInput value={formData.accessLabel} onChange={(event) => handleChange('accessLabel', event.target.value)} placeholder="Contoh: Global Access" />
              </label>

              <label className="block xl:col-span-2">
                <SuperadminFieldLabel>Detail Akses</SuperadminFieldLabel>
                <SuperadminTextInput value={formData.accessDetail} onChange={(event) => handleChange('accessDetail', event.target.value)} placeholder="Contoh: Semua Pemilihan" />
              </label>
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard>
            <SuperadminSectionHeading title="Cakupan Akses" description="Pilih cakupan akses admin untuk ruang pemilihan." />
            <div className="mt-8 space-y-4">
              <SuperadminRadioCard
                active={formData.scope === 'all'}
                title="Semua Pemilihan"
                description="Admin dapat mengakses seluruh ruang pemilihan yang tersedia."
                onClick={() => handleChange('scope', 'all')}
              />
              <SuperadminRadioCard
                active={formData.scope === 'specific'}
                title="Pemilihan Tertentu"
                description="Admin hanya mengelola ruang pemilihan yang telah ditentukan." 
                onClick={() => handleChange('scope', 'specific')}
              />
            </div>

            {formData.scope === 'specific' && (
              <div className="mt-8 border-t border-slate-100 pt-8">
                <SuperadminFieldLabel>Daftar Pemilihan Tersedia</SuperadminFieldLabel>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {proposalDraftsQuery.isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-50" />
                    ))
                  ) : (proposalDraftsQuery.data as ProposalDraftRecord[] | undefined)?.length === 0 ? (
                    <p className="col-span-full text-[14px] text-slate-500 italic">Belum ada pemilihan yang dibuat di sistem.</p>
                  ) : (
                    (proposalDraftsQuery.data as ProposalDraftRecord[] | undefined)?.map((proposal) => (
                      <label
                        key={proposal.id}
                        className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${
                          selectedSpaceIds.includes(proposal.id)
                            ? 'border-black bg-slate-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Checkbox
                          checked={selectedSpaceIds.includes(proposal.id)}
                          onCheckedChange={(checked) => {
                            setSelectedSpaceIds(current =>
                              checked
                                ? [...current, proposal.id]
                                : current.filter(id => id !== proposal.id)
                            )
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-slate-900">{proposal.title}</p>
                          <p className="truncate text-[12px] text-slate-500">{proposal.organizationName || 'Tanpa Organisasi'}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </SuperadminSectionCard>

          <SuperadminSectionCard>
            <SuperadminSectionHeading title="Aktivasi Wallet" description="Wallet tetap ditautkan oleh admin organisasi sendiri saat masuk ke halaman Hubungkan Wallet. Super admin tidak mengisi private key atau wallet pengguna." />
          </SuperadminSectionCard>
        </div>

        <div className="space-y-6">
          <SuperadminSectionCard>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-700">
                <UserCog className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-slate-900">Ringkasan Perubahan</h2>
                <p className="mt-2 text-[15px] leading-7 text-slate-800">Setelah menekan simpan, Anda akan kembali ke halaman detail admin dengan notifikasi sukses.</p>
              </div>
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Preview Status Saat Ini</p>
            <div className="mt-6 rounded-[24px] bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[18px] font-semibold text-slate-900">{admin.name}</p>
                  <p className="mt-1 font-mono text-[14px] text-slate-500">{admin.email}</p>
                </div>
                <SuperadminStatusBadge status={formData.status} />
              </div>
              <div className="mt-5 space-y-3 text-[14px] text-slate-800">
                <p><span className="font-semibold text-slate-900">Identitas wallet:</span> {admin.blockchainIdentity}</p>
                <p><span className="font-semibold text-slate-900">Akses saat ini:</span> {formData.accessLabel} · {formData.accessDetail}</p>
                <p><span className="font-semibold text-slate-900">Mode akses:</span> {formData.scope === 'all' ? 'Semua Pemilihan' : 'Pemilihan Tertentu'}</p>
                {formData.scope === 'specific' && (
                  <p className="text-emerald-600 font-medium">· {selectedSpaceIds.length} pemilihan dipilih</p>
                )}
              </div>
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-slate-900">Catatan Perubahan</h2>
                <ul className="mt-3 space-y-2 text-[14px] leading-7 text-slate-800">
                  <li>• Form dapat diisi dan divalidasi sebelum disimpan.</li>
                  <li>• Tinjau kembali status akun, organisasi, dan akses sebelum konfirmasi.</li>
                  <li>• Setelah disimpan, Anda akan kembali ke halaman detail admin.</li>
                </ul>
              </div>
            </div>
          </SuperadminSectionCard>
        </div>
      </StaggerContainer>

      <ConfirmDialog
        open={confirmOpen}
        title="Simpan perubahan admin ini?"
        description="Perubahan ini akan memperbarui data admin yang sedang Anda sunting."
        confirmLabel="Ya, Simpan"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSave}
      />

      <ConfirmDialog
        open={cancelConfirmOpen}
        title="Batalkan perubahan?"
        description={editSource === 'list'
          ? 'Perubahan yang sedang Anda buat akan dibuang dan Anda akan kembali ke halaman manajemen admin.'
          : 'Perubahan yang sedang Anda buat akan dibuang dan Anda akan kembali ke halaman detail admin.'}
        confirmLabel="Ya, Batalkan"
        onCancel={() => setCancelConfirmOpen(false)}
        onConfirm={() => {
          setCancelConfirmOpen(false)
          showToast({ tone: 'info', title: 'Perubahan dibatalkan', description: 'Form edit admin dikembalikan tanpa menyimpan perubahan.' })
          window.setTimeout(() => {
            router.push(backHref)
          }, 300)
        }}
      />
    </SuperadminShell>
  )
}
