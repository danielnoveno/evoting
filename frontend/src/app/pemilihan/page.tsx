import { PublicPage } from '@/components/public/site-shell'
import { PemilihanSections } from './pemilihan-sections'

export default function PemilihanPage() {
  return (
    <PublicPage activePath="/pemilihan">
      <PemilihanSections />
    </PublicPage>
  )
}
