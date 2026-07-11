import { redirect } from 'next/navigation'

/**
 * Laporan pemilihan nyata menggunakan halaman hasil publik yang membaca
 * proposal Supabase dan tally kontrak Base Sepolia. Rute lama berisi satu ID
 * contoh statis sehingga setiap pemilihan produksi berakhir di halaman 404.
 */
export default function SuperadminElectionFinalReportPage({ params }: { params: { id: string } }) {
  redirect(`/pemilihan/${encodeURIComponent(params.id)}/hasil`)
}
