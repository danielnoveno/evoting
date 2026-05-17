import { PublicPage } from '@/components/public/site-shell'
import { CaraKerjaSections } from './cara-kerja-sections'

export default function CaraKerjaPage() {
  return (
    <PublicPage activePath="/cara-kerja">
      <CaraKerjaSections />
    </PublicPage>
  )
}
