import { PublicPage, SectionTitle } from '@/components/public/site-shell'

export default function KetentuanLayananPage() {
  return (
    <PublicPage activePath="/ketentuan-layanan">
      <section className="public-section">
        <div className="public-container">
          <SectionTitle
            title="Ketentuan Layanan"
            body="Seluruh fitur pada demo Votein digunakan untuk simulasi skripsi e-voting kampus. Tidak ada transaksi blockchain nyata atau keputusan organisasi yang diproses secara resmi pada mode ini."
          />
        </div>
      </section>
    </PublicPage>
  )
}
