import re

def process_ddpl(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    parts = re.split(r'### 2\.4\.\d+\s+', content)
    header = parts[0].strip()
    sections = parts[1:]
    
    section_map = {}
    for sec in sections:
        title_end = sec.find('\n')
        title = sec[:title_end].strip()
        body = sec[title_end:].strip()
        # strip the "---" separator at the end
        if body.endswith('---'):
            body = body[:-3].strip()
        section_map[title] = body

    # Helper function to create a new section body
    def create_section(desc, input_text, output_text, method_steps, img_path):
        lines = []
        if img_path:
            lines.append(f'[![Preview]({img_path})](<{img_path}>)\n')
        lines.append(f'Deskripsi\t:\t{desc}\n')
        lines.append(f'Input\t:\t{input_text}\n')
        lines.append(f'Output\t:\t{output_text}\n')
        lines.append('Method/Algoritma\t:\tOn `Get`')
        for i, step in enumerate(method_steps, 1):
            lines.append(f'{i}.\t{step}')
        return '\n'.join(lines)

    # NEW SECTIONS DATA
    # Admin - Daftar Proposal
    daftar_prop = create_section(
        "Antarmuka Daftar Proposal Pemilihan pada route `/admin/daftar-proposal` digunakan untuk melihat ringkasan seluruh proposal yang ada, memfilter berdasarkan status, dan memfasilitasi navigasi ke pengajuan baru atau detail.",
        "Filter status proposal, pencarian, dan klik baris tabel.",
        "Tabel daftar proposal, kartu metrik ringkasan, dan navigasi.",
        ["Sistem membaca daftar proposal dari mock store admin.", "Data difilter sesuai status yang dipilih.", "Klik baris membuka halaman detail proposal."],
        "/home/user/projects/Skripsi - Evoting/.docs/DESIGN FIGMA/admin/Admin - Daftar Proposal (Dashboard).png"
    )

    # Admin - Detail Proposal
    detail_prop = create_section(
        "Antarmuka Detail Proposal Pemilihan pada route `/admin/daftar-proposal/[id]` digunakan untuk menampilkan data lengkap sebuah proposal dalam mode baca saja (read-only).",
        "Navigasi kembali atau tombol aksi lanjutan.",
        "Formulir proposal dalam mode *read-only* dengan informasi lengkap.",
        ["Sistem mencocokkan ID proposal dari URL route.", "Formulir dimuat dan dikunci dari pengeditan.", "Jika proposal tidak ditemukan, halaman menampilkan pesan `notFound`."],
        ""
    )

    # Admin - Sunting Proposal
    sunting_prop = create_section(
        "Antarmuka Sunting Proposal Pemilihan pada route `/admin/daftar-proposal/[id]/edit` digunakan untuk mengubah data proposal yang sudah ada (misalnya yang masih draf atau perlu direvisi).",
        "Entri nama pemilihan, kategori, deskripsi, dan jadwal.",
        "Formulir proposal yang dapat disunting dan toast notifikasi sukses.",
        ["Sistem mencocokkan ID proposal dari URL route.", "Formulir dimuat dengan data sebelumnya untuk diedit.", "Sistem memvalidasi input saat form disubmit.", "Perubahan disimpan ke dalam store lokal simulatif."],
        ""
    )

    # Admin - Tambah Kandidat
    tambah_kandidat = create_section(
        "Antarmuka Tambah Kandidat pada route `/admin/manajemen-pemilihan/[id]/tambah-kandidat` digunakan oleh admin untuk menambahkan profil kandidat baru ke dalam sebuah ruang pemilihan.",
        "Entri nama kandidat, visi, misi, dan pas foto.",
        "Formulir penambahan kandidat dengan pratinjau gambar dan pesan validasi.",
        ["Sistem memeriksa status fase pemilihan.", "Jika form valid, data kandidat baru disimpan sementara ke store lokal.", "Pengguna diarahkan kembali ke tab kandidat di detail pemilihan."],
        ""
    )

    # Admin - Sunting Kandidat
    sunting_kandidat = create_section(
        "Antarmuka Sunting Kandidat pada route `/admin/manajemen-pemilihan/[id]/kandidat/[candidateId]/edit` digunakan untuk mengubah profil, visi, dan misi kandidat yang sudah terdaftar.",
        "Perubahan field teks dan/atau upload gambar baru.",
        "Formulir yang terisi data lama dan tombol simpan.",
        ["Sistem memuat data kandidat berdasarkan `candidateId`.", "Perubahan divalidasi pada sisi klien.", "Jika sukses disubmit, record kandidat pada store lokal diperbarui."],
        ""
    )

    # Super Admin - Detail Admin
    detail_admin = create_section(
        "Antarmuka Detail Admin Organisasi pada route `/superadmin/manajemen-admin/[id]` digunakan untuk melihat profil mendalam, metrik log aktivitas, dan cakupan akses spesifik dari seorang admin organisasi.",
        "Navigasi antar tab log atau akses.",
        "Ringkasan informasi admin, status blockchain identity, dan daftar log aktivitas terbaru.",
        ["Sistem mengambil data detail admin berdasarkan ID.", "Halaman merender komponen metrik, detail profil, dan tabel aktivitas terkait."],
        "/home/user/projects/Skripsi - Evoting/.docs/DESIGN FIGMA/superadmin/Detail Admin - Superadmin.png"
    )

    # Super Admin - Sunting Admin
    sunting_admin = create_section(
        "Antarmuka Sunting Admin Organisasi pada route `/superadmin/manajemen-admin/[id]/edit` digunakan untuk mengubah hak akses, detail organisasi, atau status dari admin terkait.",
        "Perubahan role, organisasi, dan status aktif.",
        "Formulir konfigurasi admin dan tombol simpan perubahan.",
        ["Sistem memuat form dengan status admin saat ini.", "Pengguna mengubah data, memvalidasi input.", "Perubahan disimpan ke store simulatif super admin."],
        ""
    )

    # Super Admin - Detail Review Proposal
    detail_review = create_section(
        "Antarmuka Detail Review Proposal pada route `/superadmin/manajemen-proposal/[id]` digunakan super admin untuk mengevaluasi data, dokumen, dan parameter keamanan proposal sebelum disetujui atau ditolak.",
        "Tombol setujui, tolak, atau minta revisi.",
        "Tampilan komprehensif dari proposal dan jejak rekam diskusi/review.",
        ["Sistem menarik data proposal berdasarkan ID.", "Super admin dapat memeriksa kelengkapan.", "Aksi persetujuan akan mengubah status proposal di platform."],
        ""
    )

    # Order of sections 
    # Let's map out the final ordered list
    ordered_titles = [
        "Antarmuka Masuk Sistem",
        "Antarmuka Dashboard Super Admin",
        "Antarmuka Kelola Admin Organisasi",
        "Antarmuka Detail Admin Organisasi (Super Admin)",
        "Antarmuka Sunting Admin Organisasi (Super Admin)",
        "Antarmuka Data Master Voter Platform",
        "Antarmuka Review Proposal Pemilihan",
        "Antarmuka Detail Review Proposal (Super Admin)",
        "Antarmuka Review Perubahan Material",
        "Antarmuka Daftar Manajemen Pemilihan (Super Admin)",
        "Antarmuka Moderasi Pemilihan (Super Admin)",
        "Antarmuka Investigasi Pemilihan (Super Admin)",
        "Antarmuka Laporan Final Pemilihan (Super Admin)",
        "Antarmuka Audit Log Platform (Super Admin)",
        "Antarmuka Profil dan Pengaturan Super Admin",
        "Antarmuka Dashboard Admin Organisasi",
        "Antarmuka Daftar Proposal Pemilihan (Admin)",
        "Antarmuka Pengajuan Proposal Pemilihan",
        "Antarmuka Detail Proposal Pemilihan (Admin)",
        "Antarmuka Sunting Proposal Pemilihan (Admin)",
        "Antarmuka Kelola Pemilihan",
        "Antarmuka Kelola Kandidat",
        "Antarmuka Tambah Kandidat (Admin)",
        "Antarmuka Sunting Kandidat (Admin)",
        "Antarmuka Kelola Whitelist Pemilihan",
        "Antarmuka Hasil Real-time Pemilihan (Admin)",
        "Antarmuka Monitoring Real-time Pemilihan (Admin)",
        "Antarmuka Sunting Profil Admin Organisasi",
        "Antarmuka Bantuan Admin Organisasi",
        "Antarmuka Publik Pemilihan",
        "Antarmuka Hasil Pemilihan",
        "Antarmuka Audit Trail Publik",
        "Antarmuka Masuk dan Onboarding Smart Wallet Voter",
        "Antarmuka Dashboard Voter",
        "Antarmuka Pilih Kandidat",
        "Antarmuka Tinjau dan Kirim Commit",
        "Antarmuka Bukti Commit Berhasil",
        "Antarmuka Reveal Vote",
        "Antarmuka Status Voting Voter",
        "Antarmuka Sunting Profil Voter",
        "Antarmuka Bantuan Voter"
    ]

    # Combine existing content and new contents
    section_map["Antarmuka Daftar Proposal Pemilihan (Admin)"] = daftar_prop
    section_map["Antarmuka Detail Proposal Pemilihan (Admin)"] = detail_prop
    section_map["Antarmuka Sunting Proposal Pemilihan (Admin)"] = sunting_prop
    section_map["Antarmuka Tambah Kandidat (Admin)"] = tambah_kandidat
    section_map["Antarmuka Sunting Kandidat (Admin)"] = sunting_kandidat
    section_map["Antarmuka Detail Admin Organisasi (Super Admin)"] = detail_admin
    section_map["Antarmuka Sunting Admin Organisasi (Super Admin)"] = sunting_admin
    section_map["Antarmuka Detail Review Proposal (Super Admin)"] = detail_review
    
    # Optional: ensure we didn't miss anything that was originally there but has a slightly different name
    # We can match closely or fallback
    
    # Rebuild Markdown
    output_lines = []
    
    if header:
        output_lines.append(header)
    
    for idx, title in enumerate(ordered_titles, 1):
        output_lines.append(f'### 2.4.{idx} {title}\n')
        
        body = section_map.get(title, section_map.get(title.replace(' (Admin)', '').replace(' (Super Admin)', ''), "Section Content Not Found"))
        if body == "Section Content Not Found":
            # Let's try partial matching if there's a slight title discrepancy
            for k in section_map.keys():
                if title.lower() in k.lower() or k.lower() in title.lower():
                    body = section_map[k]
                    break
                    
        output_lines.append(body + '\n')
        output_lines.append('---\n')

    with open('.docs/ddpl_formatted_2.4.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(output_lines))

if __name__ == '__main__':
    process_ddpl('.docs/ddpl_formatted_2.4.md')
