'use client'

import { ShieldCheck, UserCog } from 'lucide-react'
import { notFound, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
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
import { useSuperadminAdminsStore } from '@/lib/superadmin-mock-store'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'

type AdminScope = 'all' | 'specific'
type AdminStatus = 'Aktif' | 'Menunggu' | 'Nonaktif'

function inferScope(accessDetail: string): AdminScope {
  return accessDetail === 'Pemilihan Tertentu' || accessDetail.includes('Space') ? 'specific' : 'all'
}

export default function SuperadminAdminEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { showToast } = useToast()
  const { admins } = useSuperadminAdminsStore()
  const admin = useMemo(() => admins.find((item) => item.id === params.id), [admins, params.id])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)

  if (!admin) notFound()

  const initialForm = {
    name: admin.name,
    email: admin.email,
    scope: inferScope(admin.accessDetail),
    status: admin.status as AdminStatus,
    accessLabel: admin.accessLabel,
    accessDetail: admin.accessDetail,
    password: '',
    confirmPassword: '',
  }

  const [formData, setFormData] = useState(initialForm)

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
      showToast({ tone: 'error', title: 'Email belum valid', description: 'Gunakan format email yang valid untuk simulasi edit admin.' })
      return
    }

    if (formData.password || formData.confirmPassword) {
      if (formData.password.length < 8) {
        showToast({ tone: 'error', title: 'Password terlalu singkat', description: 'Password baru minimal 8 karakter.' })
        return
      }

      if (formData.password !== formData.confirmPassword) {
        showToast({ tone: 'error', title: 'Konfirmasi password tidak cocok', description: 'Pastikan password baru dan konfirmasinya sama.' })
        return
      }
    }

    setConfirmOpen(true)
  }

  const handleConfirmSave = () => {
    setConfirmOpen(false)
    showToast({
      tone: 'success',
      title: 'Simulasi edit admin berhasil',
      description: 'Perubahan bisa diuji end-to-end, tetapi tidak disimpan ke data admin sebenarnya.',
    })
    window.setTimeout(() => {
      router.push(`/superadmin/manajemen-admin/${admin.id}`)
    }, 500)
  }

  const handleCancel = () => {
    if (!isDirty) {
      router.push(`/superadmin/manajemen-admin/${admin.id}`)
      return
    }
    setCancelConfirmOpen(true)
  }

  return (
    <SuperadminShell>
      <ScrollReveal variant="fade-up" duration={800}>
        <SuperadminPageHeader
          backHref={`/superadmin/manajemen-admin/${admin.id}`}
          backLabel="Kembali ke Detail Admin"
          title="Edit Admin"
          description="Halaman ini dibuat untuk simulasi end-to-end. Anda bisa mencoba mengubah data, tetapi hasilnya tidak akan memperbarui record admin secara permanen."
          actions={(
            <>
              <button type="button" onClick={handleCancel} className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-100 px-6 text-[15px] font-medium text-slate-700 hover:bg-slate-200">
                Batal
              </button>
              <SuperadminToolbarButton variant="primary" onClick={handleSaveClick}>
                Simpan Perubahan
              </SuperadminToolbarButton>
            </>
          )}
        />
      </ScrollReveal>

      <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_420px]">
        <div className="space-y-6">
          <SuperadminSectionCard>
            <SuperadminSectionHeading title="Informasi Admin" description="Gunakan data ini untuk mencoba alur edit seperti pada sistem nyata." />
            <div className="mt-8 grid gap-5 xl:grid-cols-2">
              <label className="block xl:col-span-2">
                <SuperadminFieldLabel>Nama Lengkap</SuperadminFieldLabel>
                <SuperadminTextInput value={formData.name} onChange={(event) => handleChange('name', event.target.value)} placeholder="Masukkan nama lengkap" />
              </label>

              <label className="block xl:col-span-2">
                <SuperadminFieldLabel>Email Institusi</SuperadminFieldLabel>
                <SuperadminTextInput value={formData.email} onChange={(event) => handleChange('email', event.target.value)} placeholder="nama@institusi.edu" />
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
            <SuperadminSectionHeading title="Cakupan Akses" description="Pilih mode akses untuk menyimulasikan perubahan hak admin." />
            <div className="mt-8 space-y-4">
              <SuperadminRadioCard
                active={formData.scope === 'all'}
                title="Semua Pemilihan"
                description="Mode ini mensimulasikan akses lintas ruang pemilihan tanpa pembatasan spesifik."
                onClick={() => handleChange('scope', 'all')}
              />
              <SuperadminRadioCard
                active={formData.scope === 'specific'}
                title="Pemilihan Tertentu"
                description="Mode ini mensimulasikan admin hanya mengelola ruang yang sudah ditentukan." 
                onClick={() => handleChange('scope', 'specific')}
              />
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard>
            <SuperadminSectionHeading title="Reset Kata Sandi (Opsional)" description="Biarkan kosong jika tidak ingin mensimulasikan pergantian password." />
            <div className="mt-8 grid gap-5 xl:grid-cols-2">
              <label className="block">
                <SuperadminFieldLabel>Password Baru</SuperadminFieldLabel>
                <SuperadminTextInput type="password" value={formData.password} onChange={(event) => handleChange('password', event.target.value)} placeholder="••••••••" />
              </label>
              <label className="block">
                <SuperadminFieldLabel>Konfirmasi Password Baru</SuperadminFieldLabel>
                <SuperadminTextInput type="password" value={formData.confirmPassword} onChange={(event) => handleChange('confirmPassword', event.target.value)} placeholder="••••••••" />
              </label>
            </div>
          </SuperadminSectionCard>
        </div>

        <div className="space-y-6">
          <SuperadminSectionCard>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-700">
                <UserCog className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-slate-900">Mode Simulasi Aktif</h2>
                <p className="mt-2 text-[15px] leading-7 text-slate-600">Setelah menekan simpan, Anda akan kembali ke halaman detail admin dengan notifikasi sukses. Data asli daftar admin tidak akan berubah.</p>
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
              <div className="mt-5 space-y-3 text-[14px] text-slate-600">
                <p><span className="font-semibold text-slate-900">Identitas blockchain:</span> {admin.blockchainIdentity}</p>
                <p><span className="font-semibold text-slate-900">Akses saat ini:</span> {formData.accessLabel} · {formData.accessDetail}</p>
                <p><span className="font-semibold text-slate-900">Mode akses:</span> {formData.scope === 'all' ? 'Semua Pemilihan' : 'Pemilihan Tertentu'}</p>
              </div>
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-slate-900">Guardrail Demo</h2>
                <ul className="mt-3 space-y-2 text-[14px] leading-7 text-slate-600">
                  <li>• Form bisa diisi dan divalidasi seperti alur asli.</li>
                  <li>• Tombol simpan hanya menampilkan hasil simulasi.</li>
                  <li>• Saat kembali ke detail admin, data akan tetap seperti semula.</li>
                </ul>
              </div>
            </div>
          </SuperadminSectionCard>
        </div>
      </StaggerContainer>

      <ConfirmDialog
        open={confirmOpen}
        title="Simpan perubahan admin ini?"
        description="Perubahan hanya digunakan untuk simulasi alur edit end-to-end dan tidak akan memperbarui data admin secara permanen."
        confirmLabel="Ya, Simpan Simulasi"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSave}
      />

      <ConfirmDialog
        open={cancelConfirmOpen}
        title="Batalkan perubahan?"
        description="Perubahan yang sedang Anda coba pada mode simulasi ini akan dibuang."
        confirmLabel="Ya, Batalkan"
        onCancel={() => setCancelConfirmOpen(false)}
        onConfirm={() => {
          setCancelConfirmOpen(false)
          showToast({ tone: 'info', title: 'Perubahan dibatalkan', description: 'Form edit admin dikembalikan tanpa menyimpan perubahan.' })
          window.setTimeout(() => {
            router.push(`/superadmin/manajemen-admin/${admin.id}`)
          }, 300)
        }}
      />
    </SuperadminShell>
  )
}
