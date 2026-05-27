import { PublicPage, SectionTitle } from '@/components/public/site-shell'

export default function KetentuanLayananPage() {
  return (
    <PublicPage activePath="/ketentuan-layanan">
      <section className="public-section">
        <div className="public-container">
          <SectionTitle
            title="Ketentuan Layanan"
            body="Seluruh fitur Votein pada environment pengembangan digunakan untuk simulasi skripsi e-voting kampus. Keputusan organisasi hanya sah jika memakai data dan transaksi yang telah diverifikasi."
          />
        </div>
      </section>
    </PublicPage>
  )
}
