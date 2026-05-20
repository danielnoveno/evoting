import { PublicPage, SectionTitle } from '@/components/public/site-shell'

export default function KebijakanPrivasiPage() {
  return (
    <PublicPage activePath="/kebijakan-privasi">
      <section className="public-section">
        <div className="public-container">
          <SectionTitle
            title="Kebijakan Privasi"
            body="Halaman ini menjelaskan bagaimana Votein menggunakan data akun, data pemilihan, dan bukti transaksi untuk mendukung proses voting yang aman."
          />
        </div>
      </section>
    </PublicPage>
  )
}
