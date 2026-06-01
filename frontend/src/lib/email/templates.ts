export function buildAdminActivationEmail(params: {
  displayName: string
  email: string
  activationLink: string
  expiresInDays: number
  role: 'admin' | 'super_admin'
}): { subject: string; html: string } {
  const isSuperadmin = params.role === 'super_admin'
  const roleName = isSuperadmin ? 'Superadmin' : 'Admin Organisasi'
  const subject = `Aktivasi Akun ${roleName} — Votein Portal Admin`

  const html = `<div style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Arial,sans-serif;color:#0F172A;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;padding:28px;">
      <div style="margin-bottom:24px;">
        <div style="margin-bottom:24px;">
          <img
            src="https://votein-evoting.vercel.app/favicon.png"
            alt="Votein"
            width="44"
            height="44"
            style="display:block;width:44px;height:44px;border-radius:12px;background:#0F172A;"
          />
        </div>
      </div>
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#94A3B8;">
        Undangan Portal Admin
      </p>
      <h2 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:600;color:#0F172A;">
        Aktivasi Akun ${roleName}
      </h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">
        Halo <strong>${params.displayName}</strong>, kamu telah diundang untuk menjadi <strong>${roleName.toLowerCase()}</strong> di platform Votein. 
        Silakan klik tombol di bawah ini untuk mengaktifkan akun dan membuat password kamu.
      </p>
      <a href="${params.activationLink}"
         style="display:inline-block;width:100%;box-sizing:border-box;text-align:center;padding:12px 18px;background:#0F172A;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
        Aktifkan Akun ${roleName}
      </a>
      <div style="margin-top:20px;padding:14px 16px;background:#F8FAFC;border:1px solid #F1F5F9;border-radius:8px;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#475569;">
          Jika tombol tidak bisa dibuka, salin tautan berikut ke browser:
        </p>
        <p style="margin:8px 0 0;font-size:12px;line-height:1.6;word-break:break-all;color:#3B82F6;">
          ${params.activationLink}
        </p>
      </div>
      <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#64748B;">
        Link aktivasi ini berlaku selama ${params.expiresInDays} hari. Jika kamu tidak merasa meminta akses ini, abaikan email ini.
      </p>
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #F1F5F9;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#94A3B8;">
          Terima kasih,<br />
          Tim Votein
        </p>
      </div>
    </div>
    <p style="margin:16px 0 0;text-align:center;font-size:11px;line-height:1.6;color:#94A3B8;">
      Votein — Portal Admin HIMAFORKA FTI UAJY
    </p>
  </div>
</div>`

  return { subject, html }
}

export function buildVoterActivationEmail(params: {
  displayName: string
  email: string
  activationLink: string
}): { subject: string; html: string } {
  const subject = 'Aktivasi Hak Suara Pemilih — Votein'

  const html = `<div style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Arial,sans-serif;color:#0F172A;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;padding:28px;">
      <div style="margin-bottom:24px;">
        <img
          src="https://votein-evoting.vercel.app/favicon.png"
          alt="Votein"
          width="44"
          height="44"
          style="display:block;width:44px;height:44px;border-radius:12px;background:#0F172A;"
        />
      </div>
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#94A3B8;">
        Aktivasi Pemilih
      </p>
      <h2 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:600;color:#0F172A;">
        Aktivasi Hak Suara Kamu
      </h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">
        Halo <strong>${params.displayName}</strong>, data kamu sudah disiapkan pada sistem Votein. Klik tombol di bawah untuk memulai aktivasi hak suara dengan 3 tahap singkat: sambungkan dompet, verifikasi akun kampus, lalu aktifkan hak suara.
      </p>
      <a href="${params.activationLink}"
         style="display:inline-block;width:100%;box-sizing:border-box;text-align:center;padding:12px 18px;background:#0F172A;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
        Mulai Aktivasi Pemilih
      </a>
      <div style="margin-top:20px;padding:14px 16px;background:#F8FAFC;border:1px solid #F1F5F9;border-radius:8px;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#475569;">
          Jika tombol tidak bisa dibuka, salin tautan berikut ke browser:
        </p>
        <p style="margin:8px 0 0;font-size:12px;line-height:1.6;word-break:break-all;color:#3B82F6;">
          ${params.activationLink}
        </p>
      </div>
      <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#64748B;">
        Gunakan email kampus dan dompet digital milikmu sendiri agar sistem dapat mengenali hak suara dengan benar.
      </p>
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #F1F5F9;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#94A3B8;">
          Terima kasih,<br />
          Tim Votein
        </p>
      </div>
    </div>
    <p style="margin:16px 0 0;text-align:center;font-size:11px;line-height:1.6;color:#94A3B8;">
      Votein — E-Voting Organisasi Mahasiswa
    </p>
  </div>
</div>`

  return { subject, html }
}

/**
 * @deprecated Use buildAdminActivationEmail instead
 */
export function buildSuperadminActivationEmail(params: {
  displayName: string
  email: string
  activationLink: string
  expiresInDays: number
}) {
  return buildAdminActivationEmail({ ...params, role: 'super_admin' })
}
