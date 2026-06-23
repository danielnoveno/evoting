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

  const activationInstruction = isSuperadmin
    ? 'Silakan klik tombol di bawah ini untuk verifikasi menggunakan akun kampus (SSO) dan mengaktifkan akses portal admin.'
    : 'Silakan klik tombol di bawah ini untuk membuat password dan mengaktifkan akun admin organisasi kamu.'

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
        ${activationInstruction}
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
        Halo <strong>${params.displayName}</strong>, data kamu sudah disiapkan pada sistem Votein. Klik tombol di bawah untuk memulai aktivasi hak suara: verifikasi akun kampus (SSO) terlebih dahulu, lalu sambungkan dompet digital.
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
function buildSuperadminActivationEmail(params: {
  displayName: string
  email: string
  activationLink: string
  expiresInDays: number
}) {
  return buildAdminActivationEmail({ ...params, role: 'super_admin' })
}

// ─── Election Notification Templates ─────────────────────────────────────────

export function buildCommitReminderEmail(params: {
  voterName: string
  electionTitle: string
  commitEndsAt: string
  siteUrl: string
}): { subject: string; html: string } {
  const subject = `Pengingat: Pemilihan ${params.electionTitle} Segera Dimulai`
  const siteUrl = params.siteUrl.replace(/\/$/, '')

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
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#F59E0B;">
        Pengingat Pemilihan
      </p>
      <h2 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:600;color:#0F172A;">
        Pemilihan Segera Dimulai
      </h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">
        Halo <strong>${params.voterName}</strong>, kamu terdaftar sebagai pemilih pada pemilihan <strong>${params.electionTitle}</strong>.
        Pencoblosan akan dibuka pada <strong>${params.commitEndsAt}</strong>.
        Siapkan dompet digital kamu dan ikut pemilihan tepat waktu.
      </p>
      <a href="${siteUrl}"
         style="display:inline-block;width:100%;box-sizing:border-box;text-align:center;padding:12px 18px;background:#0F172A;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
        Buka Votein
      </a>
      <div style="margin-top:20px;padding:14px 16px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#92400E;">
          <strong>Penting:</strong> Pastikan dompet digital kamu sudah terhubung sebelum pemilihan dimulai agar bisa langsung ikut.
        </p>
      </div>
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

export function buildElectionResultsEmail(params: {
  voterName: string
  electionTitle: string
  winnerName: string
  totalVotes: number
  candidates: Array<{ name: string; voteCount: number; percentage: string }>
  siteUrl: string
}): { subject: string; html: string } {
  const subject = `Hasil Pemilihan: ${params.electionTitle} — ${params.winnerName} Terpilih`
  const siteUrl = params.siteUrl.replace(/\/$/, '')

  const candidateRows = params.candidates
    .map((c) => `
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#0F172A;border-bottom:1px solid #F1F5F9;">
          ${c.name}
        </td>
        <td style="padding:10px 16px;font-size:14px;color:#0F172A;border-bottom:1px solid #F1F5F9;text-align:center;">
          ${c.voteCount} suara
        </td>
        <td style="padding:10px 16px;font-size:14px;color:#0F172A;border-bottom:1px solid #F1F5F9;text-align:right;font-weight:600;">
          ${c.percentage}%
        </td>
      </tr>`)
    .join('')

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
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#10B981;">
        Hasil Pemilihan
      </p>
      <h2 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:600;color:#0F172A;">
        Hasil ${params.electionTitle}
      </h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">
        Halo <strong>${params.voterName}</strong>, pemilihan telah selesai dan perhitungan suara sudah dilakukan. Berikut adalah hasil resminya:
      </p>
      <div style="margin-bottom:20px;padding:16px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#166534;text-transform:uppercase;font-weight:600;letter-spacing:0.06em;">Terpilih</p>
        <p style="margin:8px 0 0;font-size:20px;font-weight:700;color:#166534;">${params.winnerName}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr>
            <th style="padding:10px 16px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#94A3B8;text-align:left;border-bottom:2px solid #E2E8F0;">Kandidat</th>
            <th style="padding:10px 16px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#94A3B8;text-align:center;border-bottom:2px solid #E2E8F0;">Perolehan</th>
            <th style="padding:10px 16px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#94A3B8;text-align:right;border-bottom:2px solid #E2E8F0;">Persentase</th>
          </tr>
        </thead>
        <tbody>
          ${candidateRows}
        </tbody>
      </table>
      <p style="margin:0 0 20px;font-size:13px;color:#64748B;text-align:center;">Total ${params.totalVotes} suara sah tercatat</p>
      <a href="${siteUrl}"
         style="display:inline-block;width:100%;box-sizing:border-box;text-align:center;padding:12px 18px;background:#0F172A;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
        Lihat Detail di Votein
      </a>
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

export function buildPhaseChangeEmail(params: {
  adminName: string
  electionTitle: string
  newPhase: string
  siteUrl: string
}): { subject: string; html: string } {
  const phaseLabels: Record<string, string> = {
    commit: 'Pencoblosan Dimulai',
    reveal: 'Perhitungan Suara Dimulai',
    ended: 'Pemilihan Selesai',
  }
  const phaseLabel = phaseLabels[params.newPhase] || params.newPhase
  const subject = `[${phaseLabel}] ${params.electionTitle} — Votein`
  const siteUrl = params.siteUrl.replace(/\/$/, '')

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
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#3B82F6;">
        Pembaruan Fase
      </p>
      <h2 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:600;color:#0F172A;">
        ${phaseLabel}
      </h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">
        Halo <strong>${params.adminName}</strong>, pemilihan <strong>${params.electionTitle}</strong> telah memasuki fase baru: <strong>${phaseLabel}</strong>.
      </p>
      <a href="${siteUrl}"
         style="display:inline-block;width:100%;box-sizing:border-box;text-align:center;padding:12px 18px;background:#0F172A;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
        Lihat Dashboard
      </a>
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
