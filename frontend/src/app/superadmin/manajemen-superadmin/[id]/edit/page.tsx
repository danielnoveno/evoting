'use client'

import { ShieldAlert, ShieldCheck } from 'lucide-react'
import { notFound, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  SuperadminFieldLabel,
  SuperadminPageHeader,
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
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { useSuperadminAdminDirectory, useUpdateAdminRegistry } from '@/hooks/use-profile'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { mapDirectoryAdmin } from '@/lib/superadmin-admin-mapper'

type SuperadminStatus = 'Aktif' | 'Menunggu' | 'Nonaktif'

export default function SuperadminEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const superadminId = decodeURIComponent(params.id)
  const adminDirectoryQuery = useSuperadminAdminDirectory()
  const updateAdminMutation = useUpdateAdminRegistry()

  const directoryRecord = useMemo(
    () => adminDirectoryQuery.data?.find((item) => item.email === superadminId && item.role === 'super_admin') ?? null,
    [adminDirectoryQuery.data, superadminId],
  )

  const superadmin = useMemo(() => directoryRecord ? mapDirectoryAdmin(directoryRecord) : null, [directoryRecord])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)

  const initialForm = useMemo(() => ({
    name: directoryRecord?.displayName ?? '',
    email: directoryRecord?.email ?? '',
    walletAddress: directoryRecord?.walletAddress ?? directoryRecord?.profile?.walletAddress ?? '',
    status: (directoryRecord?.registryStatus === 'inactive'
      ? 'Nonaktif'
      : directoryRecord?.registryStatus === 'active' || directoryRecord?.profile
        ? 'Aktif'
        : 'Menunggu') as SuperadminStatus,
  }), [directoryRecord])

  const [formData, setFormData] = useState(initialForm)
  const editSource = searchParams.get('from')
  const backHref = editSource === 'list'
    ? '/superadmin/manajemen-superadmin'
    : `/superadmin/manajemen-superadmin/${encodeURIComponent(directoryRecord?.email ?? superadminId)}`
  const backLabel = editSource === 'list' ? 'Kembali ke Manajemen Superadmin' : 'Kembali ke Detail Superadmin'

  useEffect(() => {
    setFormData(initialForm)
  }, [initialForm])

  if (adminDirectoryQuery.isLoading) {
    return (
      <SuperadminShell>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-black" />
        </div>
      </SuperadminShell>
    )
  }

  if (!directoryRecord || !superadmin) notFound()

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialForm)

  const handleChange = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((current) => ({ ...current, [key]: value }))
  }

  const handleSaveClick = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.walletAddress.trim()) {
      showToast({ tone: 'error', title: 'Data superadmin belum lengkap', description: 'Nama, email, dan wallet address wajib diisi.' })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showToast({ tone: 'error', title: 'Email belum valid', description: 'Gunakan format email yang valid.' })
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.walletAddress)) {
      showToast({ tone: 'error', title: 'Wallet belum valid', description: 'Gunakan alamat wallet Ethereum yang valid (0x...).' })
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
          walletAddress: formData.walletAddress,
          status: formData.status === 'Nonaktif' ? 'inactive' : formData.status === 'Aktif' ? 'active' : 'pending',
        },
      },
      {
        onSuccess: (updated) => {
          setConfirmOpen(false)
          showToast({ tone: 'success', title: 'Perubahan superadmin berhasil disimpan', description: 'Data otoritas sudah diperbarui pada registry.' })
          router.push(editSource === 'list'
            ? '/superadmin/manajemen-superadmin'
            : `/superadmin/manajemen-superadmin/${encodeURIComponent(updated.email)}`)
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
          title="Edit Superadmin"
          description="Perbarui data identitas superadmin yang dipilih tanpa mengubah klaim akses di luar registry yang tersedia."
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
            <SuperadminSectionHeading title="Informasi Superadmin" description="Pastikan email institusi dan wallet address sesuai dengan pemilik otoritas yang dipilih." />
            <div className="mt-8 grid gap-5 xl:grid-cols-2">
              <label className="block xl:col-span-2">
                <SuperadminFieldLabel required>Nama Lengkap</SuperadminFieldLabel>
                <SuperadminTextInput value={formData.name} onChange={(event) => handleChange('name', event.target.value)} placeholder="Masukkan nama lengkap" />
              </label>

              <label className="block xl:col-span-2">
                <SuperadminFieldLabel required>Email Institusi</SuperadminFieldLabel>
                <SuperadminTextInput value={formData.email} onChange={(event) => handleChange('email', event.target.value)} placeholder="nama@institusi.ac.id" />
              </label>

              <label className="block xl:col-span-2">
                <SuperadminFieldLabel>Wallet Address (On-Chain Identity)</SuperadminFieldLabel>
                <SuperadminTextInput value={formData.walletAddress} onChange={(event) => handleChange('walletAddress', event.target.value)} placeholder="0x..." className="font-mono" />
                <p className="mt-2 text-[12px] text-slate-500 italic">Alamat wallet ini dipakai sebagai identitas transaksi blockchain untuk otoritas terkait.</p>
              </label>

              <label className="block xl:col-span-2">
                <SuperadminFieldLabel required>Status Akun</SuperadminFieldLabel>
                <SuperadminSelectInput value={formData.status} onChange={(event) => handleChange('status', event.target.value as SuperadminStatus)}>
                  <option value="Aktif">Aktif</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Nonaktif">Nonaktif</option>
                </SuperadminSelectInput>
              </label>
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard>
            <SuperadminSectionHeading title="Catatan Perubahan" description="Perubahan ini hanya memperbarui data registry superadmin. Tidak ada private key yang disimpan atau diubah oleh sistem." />
          </SuperadminSectionCard>
        </div>

        <div className="space-y-6">
          <SuperadminSectionCard>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-700">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-slate-900">Ringkasan Perubahan</h2>
                <p className="mt-2 text-[15px] leading-7 text-slate-800">Setelah disimpan, Anda akan kembali ke halaman detail superadmin untuk meninjau hasil pembaruan.</p>
              </div>
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Preview Status</p>
            <div className="mt-6 rounded-[24px] bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[18px] font-semibold text-slate-900">{formData.name || 'Super Admin'}</p>
                  <p className="mt-1 font-mono text-[14px] text-slate-500">{formData.email || '-'}</p>
                </div>
                <SuperadminStatusBadge status={formData.status} />
              </div>
              <div className="mt-5 space-y-3 text-[14px] text-slate-800">
                <p><span className="font-semibold text-slate-900">Wallet:</span> {formData.walletAddress || '-'}</p>
                <p><span className="font-semibold text-slate-900">Role registry:</span> Super Admin</p>
                <p><span className="font-semibold text-slate-900">Status saat ini:</span> {formData.status}</p>
              </div>
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard>
            <div className="flex items-start gap-4 rounded-[24px] border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[16px] font-semibold text-emerald-900">Akses tetap superadmin</p>
                <p className="mt-2 text-[14px] leading-6 text-emerald-800">Halaman ini hanya untuk mengubah identitas registry superadmin yang dipilih. Role tetap dipertahankan sebagai superadmin.</p>
              </div>
            </div>
          </SuperadminSectionCard>
        </div>
      </StaggerContainer>

      <ConfirmDialog
        open={confirmOpen}
        title="Simpan perubahan superadmin?"
        description="Pastikan nama, email, status, dan wallet address sudah benar sebelum menyimpan perubahan." 
        confirmLabel="Ya, Simpan"
        cancelLabel="Periksa Lagi"
        tone="default"
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmDialog
        open={cancelConfirmOpen}
        title="Batalkan perubahan?"
        description={editSource === 'list'
          ? 'Perubahan yang belum disimpan akan hilang jika Anda kembali ke halaman manajemen superadmin.'
          : 'Perubahan yang belum disimpan akan hilang jika Anda kembali ke halaman detail.'}
        confirmLabel="Ya, Batalkan"
        cancelLabel="Lanjut Edit"
        tone="default"
        onConfirm={() => router.push(backHref)}
        onCancel={() => setCancelConfirmOpen(false)}
      />
    </SuperadminShell>
  )
}
