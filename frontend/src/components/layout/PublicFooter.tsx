import { BrandLogo } from '@/components/layout/BrandLogo'
import { SiteContainer } from '@/components/layout/SiteContainer'

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-100 py-10">
      <SiteContainer className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <BrandLogo className="h-7" />

        <nav className="flex flex-wrap gap-4 text-[11px] uppercase tracking-[0.06em] text-slate-400">
          <a href="/cara-kerja">Panduan Pemilih</a>
          <a href="/pemilihan">Daftar Pemilihan</a>
          <a href="https://sepolia.basescan.org" rel="noreferrer" target="_blank">
            Basescan ↗
          </a>
        </nav>

        <p className="text-xs text-slate-400">Sistem e-voting berbasis Base Sepolia untuk organisasi mahasiswa.</p>
      </SiteContainer>
    </footer>
  )
}
