import { PublicPage, SectionTitle } from '@/components/public/site-shell'

export default function KebijakanPrivasiPage() {
  return (
    <PublicPage activePath="/kebijakan-privasi">
      <section className="public-section">
        <div className="public-container">
          <SectionTitle
            title="Kebijakan Privasi"
            body="Halaman ini menjelaskan bahwa mode demo Votein hanya menggunakan data dummy lokal untuk simulasi alur pemilihan kampus dan tidak memproses data pribadi nyata."
          />
        </div>
      </section>
    </PublicPage>
  )
}
