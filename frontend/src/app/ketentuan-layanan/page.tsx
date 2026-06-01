import { PublicPage, SectionTitle } from '@/components/public/site-shell'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'

export default function KetentuanLayananPage() {
  return (
    <PublicPage activePath="/ketentuan-layanan">
      <section className="public-section">
        <div className="public-container">
          <ScrollReveal>
            <SectionTitle
              title="Ketentuan Layanan"
              body="Aturan penggunaan platform Votein untuk pelaksanaan e-voting organisasi mahasiswa berbasis blockchain."
            />
          </ScrollReveal>

          <StaggerContainer className="mt-12 max-w-none text-gray-900" stagger={150}>
            <div className="mb-10">
              <h3 className="mb-4 text-xl font-bold text-black border-b border-gray-100 pb-2">1. Penerimaan Ketentuan</h3>
              <p className="leading-relaxed">
                Dengan mengakses dan menggunakan platform Votein, Anda setuju untuk terikat oleh Ketentuan Layanan ini. 
                Platform ini merupakan bagian dari penelitian skripsi mengenai sistem e-voting terdesentralisasi 
                untuk organisasi mahasiswa.
              </p>
            </div>

            <div className="mb-10">
              <h3 className="mb-4 text-xl font-bold text-black border-b border-gray-100 pb-2">2. Kelayakan Pengguna</h3>
              <p className="leading-relaxed">
                Layanan ini ditujukan bagi anggota organisasi mahasiswa yang terdaftar dalam Daftar Pemilih Tetap (DPT). 
                Pengguna wajib menggunakan alamat email institusi yang sah untuk proses verifikasi identitas dan 
                onboarding dompet digital.
              </p>
            </div>

            <div className="mb-10">
              <h3 className="mb-4 text-xl font-bold text-black border-b border-gray-100 pb-2">3. Transaksi Blockchain dan Finalitas</h3>
              <p className="leading-relaxed">
                Anda memahami bahwa setiap suara yang dikirimkan diproses melalui transaksi pada jaringan blockchain. 
                Karena sifat teknologi blockchain:
              </p>
              <ul className="mt-4 list-disc space-y-3 pl-6 leading-relaxed">
                <li>Transaksi bersifat <span className="font-bold text-black">irreversible</span> (tidak dapat dibatalkan) setelah dikonfirmasi oleh jaringan.</li>
                <li>Votein tidak dapat mengubah, menghapus, atau memanipulasi suara yang telah tercatat dalam smart contract.</li>
                <li>Keberhasilan transaksi bergantung pada stabilitas jaringan testnet (Base Sepolia).</li>
              </ul>
            </div>

            <div className="mb-10">
              <h3 className="mb-4 text-xl font-bold text-black border-b border-gray-100 pb-2">4. Kewajiban Tahapan Pemilihan</h3>
              <p className="leading-relaxed">
                Dalam mekanisme <span className="italic font-semibold text-black">commit-reveal</span>, pengguna bertanggung jawab penuh untuk:
              </p>
              <ul className="mt-4 list-disc space-y-3 pl-6 leading-relaxed">
                <li>Melakukan fase <span className="font-bold text-black">Commit</span> untuk mendaftarkan pilihan terenkripsi.</li>
                <li>Kembali ke platform pada jadwal yang ditentukan untuk melakukan fase <span className="font-bold text-black">Reveal</span> (pembukaan suara).</li>
                <li>Suara yang tidak melalui fase Reveal dianggap tidak sah dan tidak akan dihitung oleh smart contract.</li>
              </ul>
            </div>

            <div className="mb-10">
              <h3 className="mb-4 text-xl font-bold text-black border-b border-gray-100 pb-2">5. Batasan Tanggung Jawab</h3>
              <p className="leading-relaxed">
                Votein disediakan "sebagaimana adanya" (*as is*) sebagai prototipe riset. Pengembang tidak bertanggung jawab atas:
              </p>
              <ul className="mt-4 list-disc space-y-3 pl-6 leading-relaxed">
                <li>Kegagalan teknis yang disebabkan oleh gangguan pada pihak ketiga (misalnya: layanan RPC blockchain, dompet digital, atau infrastruktur cloud).</li>
                <li>Kehilangan akses ke akun akibat kelalaian pengguna dalam menjaga keamanan email atau sesi login.</li>
                <li>Kesalahan hasil perhitungan jika terjadi anomali pada jaringan blockchain testnet.</li>
              </ul>
            </div>

            <div className="mb-10">
              <h3 className="mb-4 text-xl font-bold text-black border-b border-gray-100 pb-2">6. Perilaku yang Dilarang</h3>
              <p className="leading-relaxed">Pengguna dilarang untuk:</p>
              <ul className="mt-4 list-disc space-y-3 pl-6 leading-relaxed">
                <li>Mencoba melakukan serangan *sybil* atau manipulasi identitas untuk mendapatkan hak pilih ganda.</li>
                <li>Melakukan reverse engineering atau mencoba mengeksploitasi kerentanan pada smart contract.</li>
                <li>Menggunakan platform untuk tujuan selain pemilihan yang telah ditentukan secara resmi oleh organisasi.</li>
              </ul>
            </div>

            <div className="mb-10">
              <h3 className="mb-4 text-xl font-bold text-black border-b border-gray-100 pb-2">7. Perubahan Ketentuan</h3>
              <p className="leading-relaxed">
                Pengembang berhak mengubah ketentuan ini sewaktu-waktu untuk menyesuaikan dengan perkembangan teknis 
                penelitian atau kebutuhan organisasi. Perubahan akan diinformasikan melalui platform.
              </p>
            </div>
          </StaggerContainer>
        </div>
      </section>
    </PublicPage>
  )
}
