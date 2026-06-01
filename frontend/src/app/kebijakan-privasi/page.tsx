import { PublicPage, SectionTitle } from '@/components/public/site-shell'

export default function KebijakanPrivasiPage() {
  return (
    <PublicPage activePath="/kebijakan-privasi">
      <section className="public-section">
        <div className="public-container">
          <SectionTitle
            title="Kebijakan Privasi"
            body="Halaman ini menjelaskan bagaimana Votein mengelola data Anda untuk mendukung proses pemungutan suara yang transparan dan aman berbasis blockchain."
          />

          <div className="mt-12 max-w-none text-gray-900">
            <div className="mb-10">
              <h3 className="mb-4 text-xl font-bold text-black border-b border-gray-100 pb-2">1. Pendahuluan</h3>
              <p className="leading-relaxed">
                Votein berkomitmen untuk melindungi privasi Anda dalam pelaksanaan e-voting. Kebijakan ini menjelaskan 
                bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda dalam konteks platform 
                e-voting berbasis blockchain yang digunakan untuk keperluan organisasi mahasiswa.
              </p>
            </div>

            <div className="mb-10">
              <h3 className="mb-4 text-xl font-bold text-black border-b border-gray-100 pb-2">2. Data yang Kami Kumpulkan</h3>
              <p className="mb-4 leading-relaxed font-medium">Kami mengumpulkan informasi terbatas yang diperlukan untuk validasi hak pilih dan operasional sistem:</p>
              <ul className="list-disc space-y-3 pl-6 leading-relaxed">
                <li><strong className="text-black">Data Identitas:</strong> Alamat email institusi (UAJY) yang digunakan untuk proses login dan pengiriman notifikasi.</li>
                <li><strong className="text-black">Data Blockchain:</strong> Alamat dompet digital (wallet address) yang dihasilkan secara otomatis untuk mewakili identitas Anda di jaringan blockchain.</li>
                <li><strong className="text-black">Data Pemilihan:</strong> Bukti komitmen suara (*commit hash*) dan pilihan suara yang diungkapkan (*reveal data*) pada fase yang ditentukan.</li>
                <li><strong className="text-black">Data Teknis:</strong> Informasi browser, alamat IP (untuk keamanan sesi), dan log aktivitas transaksi blockchain.</li>
              </ul>
            </div>

            <div className="mb-10">
              <h3 className="mb-4 text-xl font-bold text-black border-b border-gray-100 pb-2">3. Transparansi Blockchain</h3>
              <p className="leading-relaxed">
                Penting untuk dipahami bahwa Votein menggunakan jaringan blockchain publik (Base Sepolia). Segala transaksi 
                yang dikirimkan ke blockchain bersifat <span className="font-bold text-black">permanen dan publik</span>. Alamat dompet Anda dan bukti transaksi 
                dapat dilihat oleh siapa saja melalui *block explorer*. Namun, identitas asli Anda (nama/email) tidak 
                tersimpan secara publik di dalam *smart contract*.
              </p>
            </div>

            <div className="mb-10">
              <h3 className="mb-4 text-xl font-bold text-black border-b border-gray-100 pb-2">4. Kerahasiaan Pilihan (Mekanisme Commit-Reveal)</h3>
              <p className="leading-relaxed">
                Untuk menjamin prinsip kerahasiaan dalam pemungutan suara, Votein menerapkan mekanisme <span className="italic font-semibold text-black">commit-reveal</span>. 
                Pada fase pemungutan suara, Anda hanya mengirimkan hash kriptografi dari pilihan Anda. Pilihan asli 
                Anda hanya akan diketahui oleh sistem dan dicatat di blockchain setelah Anda melakukan fase <span className="italic font-semibold text-black">reveal</span> 
                atau pengungkapan suara saat masa pemilihan telah berakhir.
              </p>
            </div>

            <div className="mb-10">
              <h3 className="mb-4 text-xl font-bold text-black border-b border-gray-100 pb-2">5. Penggunaan dan Penyimpanan Data</h3>
              <p className="mb-4 leading-relaxed font-medium">Data Anda digunakan untuk:</p>
              <ul className="list-disc space-y-3 pl-6 leading-relaxed">
                <li>Memverifikasi apakah Anda terdaftar dalam Daftar Pemilih Tetap (DPT).</li>
                <li>Mencegah terjadinya pemungutan suara ganda (*double voting*).</li>
                <li>Menyajikan jejak audit (*audit trail*) yang transparan bagi penyelenggara dan pemilih.</li>
              </ul>
              <p className="mt-4 leading-relaxed">
                Data administratif (seperti profil dan pengaturan) disimpan secara aman di layanan basis data Supabase, 
                sementara data pemungutan suara inti disimpan secara permanen di blockchain Ethereum.
              </p>
            </div>

            <div className="mb-10">
              <h3 className="mb-4 text-xl font-bold text-black border-b border-gray-100 pb-2">6. Hak Anda</h3>
              <p className="leading-relaxed">
                Sebagai pemilih, Anda berhak untuk memverifikasi bahwa suara Anda telah tercatat dengan benar di blockchain 
                melalui ID Transaksi yang diberikan. Karena sifat blockchain yang tidak dapat diubah (<span className="italic font-semibold text-black">immutable</span>), 
                data pemilihan yang telah dikirimkan tidak dapat dihapus atau diubah.
              </p>
            </div>

            <div className="mb-10">
              <h3 className="mb-4 text-xl font-bold text-black border-b border-gray-100 pb-2">7. Kontak</h3>
              <p className="leading-relaxed">
                Jika Anda memiliki pertanyaan mengenai kebijakan privasi ini atau implementasi teknis Votein dalam skripsi ini, 
                Anda dapat menghubungi pengembang melalui kanal komunikasi internal organisasi mahasiswa terkait.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicPage>
  )
}
