'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, SectionLabel } from '@/components/ui/Card'
import { Toggle } from '@/components/ui/Toggle'
import { UploadZone } from '@/components/ui/UploadZone'

const tabs = [
  { label: 'Beranda', href: '/beranda' },
  { label: 'Buat Space', href: '/space/create' },
]

export default function CreateSpacePage() {
  return (
    <AppShell mainClassName="py-8" tabs={tabs}>
        <h1 className="text-xl font-semibold text-slate-900">Buat Ruang Voting Baru</h1>
        <p className="mt-1 text-sm text-slate-400">Konfigurasi voting baru untuk organisasi atau kelompokmu</p>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <Card>
            <SectionLabel>INFORMASI DASAR</SectionLabel>
            <div className="space-y-3">
              <input className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm" placeholder="Nama Voting" />
              <textarea className="min-h-20 w-full rounded-md border border-slate-200 p-3 text-sm" placeholder="Deskripsi (Opsional)" />
            </div>
          </Card>

          <Card>
            <SectionLabel>DAFTAR PEMILIH</SectionLabel>
            <UploadZone />
          </Card>

          <Card>
            <SectionLabel>KEAMANAN</SectionLabel>
            <div className="space-y-4">
              <Toggle checked onChange={() => undefined} subtitle="Sembunyikan pilihan sampai fase reveal." title="Commit-Reveal Scheme" />
              <Toggle checked onChange={() => undefined} subtitle="Satu wallet unik per pemilih." title="One-time Wallet" />
              <Toggle checked onChange={() => undefined} subtitle="Hanya wallet terdaftar yang bisa voting." title="Whitelist Pemilih" />
            </div>
          </Card>

          <Card>
            <SectionLabel>KANDIDAT</SectionLabel>
            <p className="text-[13px] text-slate-400">Belum ada kandidat. Tambahkan kandidat pertama.</p>
          </Card>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost">Simpan Draft</Button>
          <Button variant="secondary">Preview</Button>
          <Button variant="primary">Deploy Space →</Button>
        </div>
    </AppShell>
  )
}
