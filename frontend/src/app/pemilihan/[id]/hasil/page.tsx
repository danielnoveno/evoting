import { PublicPage } from '@/components/public/site-shell'
import { HasilSections } from './hasil-sections'

export default function DetailHasilPage({ params }: { params: { id: string } }) {
  return (
    <PublicPage activePath="/pemilihan">
      <HasilSections id={params.id} />
    </PublicPage>
  )
}
