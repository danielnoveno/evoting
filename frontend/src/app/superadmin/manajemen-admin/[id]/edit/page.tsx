'use client'

import { ShieldCheck, UserCog } from 'lucide-react'
import { notFound, useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
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
import { useSuperadminAdminDirectory, useUpdateAdminRegistry } from '@/hooks/use-profile'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { mapDirectoryAdmin } from '@/lib/superadmin-admin-mapper'

type AdminStatus = 'Aktif' | 'Menunggu' | 'Nonaktif'

export default function SuperadminAdminEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const adminId = decodeURIComponent(params.id)
  const adminDirectoryQuery = useSuperadminAdminDirectory()
  const updateAdminMutation = useUpdateAdminRegistry()
  const directoryRecord = useMemo(() => adminDirectoryQuery.data?.find((item) => item.email === adminId && item.role === 'admin') ?? null, [adminDirectoryQuery.data, adminId])
  const admin = useMemo(() => directoryRecord ? mapDirectoryAdmin(directoryRecord) : null, [directoryRecord])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)

  const initialForm = useMemo(() => ({
    name: admin?.name ?? '',
    email: admin?.email ?? '',
    organizationName: directoryRecord?.organizationName ?? '',
    status: (admin?.status ?? 'Menunggu') as AdminStatus,
    accessLabel: admin?.accessLabel ?? 'Admin Organisasi',
    accessDetail: admin?.accessDetail ?? 'Pemilihan sendiri',
  }), [admin, directoryRecord])

  const [formData, setFormData] = useState(initialForm)
  const editSource = searchParams.get('from')
  const backHref = editSource === 'list'
    ? '/superadmin/manajemen-admin'
    : `/superadmin/manajemen-admin/${encodeURIComponent(adminId)}`
  const backLabel = editSource === 'list' ? 'Kembali ke Manajemen Admin' : 'Kembali ke Detail Admin'

  useMemo(() => {
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

  if (!admin || !directoryRecord) notFound()

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialForm)

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
          status: formData.status === 'Nonaktif' ? 'inactive' : formData.status === 'Aktif' ? 'active' : 'pending',
          description: formData.accessDetail,
        },
      },
      {
        onSuccess: async (updated) => {
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
                <SuperadminFieldLabel required>Nama Lengkap</SuperadminFieldLabel>
                <SuperadminTextInput value={formData.name} onChange={(event) => handleChange('name', event.target.value)} placeholder="Masukkan nama lengkap" maxLength={100} />
              </label>

              <label className="block xl:col-span-2">
                <SuperadminFieldLabel required>Email Institusi</SuperadminFieldLabel>
                <SuperadminTextInput value={formData.email} onChange={(event) => handleChange('email', event.target.value)} placeholder="nama@institusi.edu" maxLength={254} />
              </label>

              <label className="block xl:col-span-2">
                <SuperadminFieldLabel required>Nama Organisasi</SuperadminFieldLabel>
                <SuperadminTextInput value={formData.organizationName} onChange={(event) => handleChange('organizationName', event.target.value)} placeholder="Contoh: HIMAFORKA FTI UAJY" maxLength={100} />
              </label>

              <label className="block">
                <SuperadminFieldLabel required>Status Akun</SuperadminFieldLabel>
                <SuperadminSelectInput value={formData.status} onChange={(event) => handleChange('status', event.target.value as AdminStatus)}>
                  <option value="Aktif">Aktif</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Nonaktif">Nonaktif</option>
                </SuperadminSelectInput>
              </label>

              <label className="block">
                <SuperadminFieldLabel>Label Akses</SuperadminFieldLabel>
                <SuperadminTextInput value={formData.accessLabel} onChange={(event) => handleChange('accessLabel', event.target.value)} placeholder="Contoh: Global Access" maxLength={100} />
              </label>

              <label className="block xl:col-span-2">
                <SuperadminFieldLabel>Detail Akses</SuperadminFieldLabel>
                <SuperadminTextInput value={formData.accessDetail} onChange={(event) => handleChange('accessDetail', event.target.value)} placeholder="Contoh: Pemilihan sendiri" maxLength={200} />
              </label>
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard>
            <SuperadminSectionHeading title="Cakupan Akses" description="Admin hanya dapat mengelola pemilihan yang dibuatnya sendiri. Akses ini diterapkan secara otomatis oleh sistem." />
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-slate-900">Pemilihan Sendiri</p>
                  <p className="text-[13px] text-slate-500">Admin hanya melihat dan mengelola proposal pemilihan yang ia buat sendiri.</p>
                </div>
              </div>
            </div>
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
                  <p className="text-[18px] font-semibold text-slate-900">{formData.organizationName || admin.name}</p>
                  <p className="mt-1 font-mono text-[14px] text-slate-500">{formData.email || admin.email}</p>
                </div>
                <SuperadminStatusBadge status={formData.status} />
              </div>
              <div className="mt-5 space-y-3 text-[14px] text-slate-800">
                <p><span className="font-semibold text-slate-900">Identitas wallet:</span> {admin.blockchainIdentity}</p>
                <p><span className="font-semibold text-slate-900">Akses saat ini:</span> {formData.accessLabel} · {formData.accessDetail}</p>
                <p><span className="font-semibold text-slate-900">Mode akses:</span> Pemilihan sendiri</p>
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
