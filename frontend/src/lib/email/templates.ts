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
            src="https://e-votein.netlify.app/favicon.png"
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
      Votein — E-Voting Organisasi Mahasiswa
    </p>
  </div>
</div>`

  return { subject, html }
}

// ─── Proposal Submission Notification (to Superadmin) ────────────────────────

export function buildProposalSubmittedEmail(params: {
  adminName: string
  proposalTitle: string
  organizationName: string
  isResubmission: boolean
  proposalLink: string
}): { subject: string; html: string } {
  const action = params.isResubmission ? 'Diajukan Ulang' : 'Diajukan'
  const subject = `Proposal ${action}: ${params.proposalTitle} — Votein`

  const description = params.isResubmission
    ? `Admin <strong>${params.adminName}</strong> dari <strong>${params.organizationName}</strong> telah mengajukan ulang proposal pemilihan.`
    : `Admin <strong>${params.adminName}</strong> dari <strong>${params.organizationName}</strong> telah mengajukan proposal pemilihan baru.`

  const html = `<div style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Arial,sans-serif;color:#0F172A;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;padding:28px;">
      <div style="margin-bottom:24px;">
        <img
          src="https://e-votein.netlify.app/favicon.png"
          alt="Votein"
          width="44"
          height="44"
          style="display:block;width:44px;height:44px;border-radius:12px;background:#0F172A;"
        />
      </div>
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#94A3B8;">
        Notifikasi Proposal
      </p>
      <h2 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:600;color:#0F172A;">
        Proposal ${action}
      </h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">
        ${description}
      </p>
      <div style="margin:0 0 20px;padding:14px 16px;background:#F8FAFC;border:1px solid #F1F5F9;border-radius:8px;">
        <p style="margin:0 0 4px;font-size:12px;color:#94A3B8;">Judul Pemilihan</p>
        <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0F172A;">${params.proposalTitle}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#94A3B8;">Organisasi</p>
        <p style="margin:0;font-size:14px;color:#0F172A;">${params.organizationName}</p>
      </div>
      <a href="${params.proposalLink}"
         style="display:inline-block;width:100%;box-sizing:border-box;text-align:center;padding:12px 18px;background:#0F172A;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
        Tinjau Proposal
      </a>
      <div style="margin-top:20px;padding:14px 16px;background:#F8FAFC;border:1px solid #F1F5F9;border-radius:8px;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#475569;">
          Jika tombol tidak bisa dibuka, salin tautan berikut ke browser:
        </p>
        <p style="margin:8px 0 0;font-size:12px;line-height:1.6;word-break:break-all;color:#3B82F6;">
          ${params.proposalLink}
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
          src="https://e-votein.netlify.app/favicon.png"
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

export function buildVoterWhitelistEmail(params: {
  voterName: string
  electionTitle: string
  electionDescription: string
  commitDate: string
  revealDate: string
  siteUrl: string
}): { subject: string; html: string } {
  const subject = `Kamu Terdaftar sebagai Pemilih — ${params.electionTitle}`
  const siteUrl = params.siteUrl.replace(/\/$/, '')

  const html = `<div style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Arial,sans-serif;color:#0F172A;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;padding:28px;">
      <div style="margin-bottom:24px;">
        <img
          src="https://e-votein.netlify.app/favicon.png"
          alt="Votein"
          width="44"
          height="44"
          style="display:block;width:44px;height:44px;border-radius:12px;background:#0F172A;"
        />
      </div>
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#3B82F6;">
        Informasi Pemilihan
      </p>
      <h2 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:600;color:#0F172A;">
        Kamu Terdaftar sebagai Pemilih
      </h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">
        Halo <strong>${params.voterName}</strong>, kamu telah terdaftar sebagai pemilih pada pemilihan <strong>${params.electionTitle}</strong>.
        Kamu berhak ikut serta dalam pemilihan ini. Berikut informasi umumnya:
      </p>
      <div style="margin-bottom:20px;padding:16px;background:#F8FAFC;border:1px solid #F1F5F9;border-radius:8px;">
        <p style="margin:0 0 8px;font-size:13px;color:#64748B;">Tentang Pemilihan</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#0F172A;">${params.electionDescription || 'Tidak ada deskripsi.'}</p>
      </div>
      <div style="margin-bottom:20px;padding:16px;background:#F8FAFC;border:1px solid #F1F5F9;border-radius:8px;">
        <p style="margin:0 0 8px;font-size:13px;color:#64748B;">Jadwal Pencoblosan</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#0F172A;">
          Dibuka: <strong>${params.commitDate}</strong><br />
          Ditutup & Perhitungan: <strong>${params.revealDate}</strong>
        </p>
      </div>
      <div style="margin-bottom:20px;padding:14px 16px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#92400E;">
          <strong>Yang perlu disiapkan:</strong> Pastikan kamu sudah mengaktifkan akun Votein dan menghubungkan dompet digital sebelum jadwal pencoblosan.
        </p>
      </div>
      <a href="${siteUrl}"
         style="display:inline-block;width:100%;box-sizing:border-box;text-align:center;padding:12px 18px;background:#0F172A;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
        Buka Votein
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
          src="https://e-votein.netlify.app/favicon.png"
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
          src="https://e-votein.netlify.app/favicon.png"
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
          src="https://e-votein.netlify.app/favicon.png"
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

// ─── Deadline Reminder (commit phase ending soon) ───────────────────────────

export function buildDeadlineReminderEmail(params: {
  voterName: string
  electionTitle: string
  commitEndsAt: string
  siteUrl: string
}): { subject: string; html: string } {
  const subject = `⏰ Pengingat: Pencoblosan ${params.electionTitle} Segera Ditutup`
  const siteUrl = params.siteUrl.replace(/\/$/, '')

  const html = `<div style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Arial,sans-serif;color:#0F172A;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;padding:28px;">
      <div style="margin-bottom:24px;">
        <img
          src="https://e-votein.netlify.app/favicon.png"
          alt="Votein"
          width="44"
          height="44"
          style="display:block;width:44px;height:44px;border-radius:12px;background:#0F172A;"
        />
      </div>
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#DC2626;">
        Pengingat Mendesak
      </p>
      <h2 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:600;color:#0F172A;">
        Pencoblosan Segera Ditutup
      </h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">
        Halo <strong>${params.voterName}</strong>, masa pencoblosan untuk pemilihan <strong>${params.electionTitle}</strong> akan berakhir pada <strong>${params.commitEndsAt}</strong>. Jika kamu belum memberikan suara, segera buka Votein dan coblos sekarang.
      </p>
      <a href="${siteUrl}"
         style="display:inline-block;width:100%;box-sizing:border-box;text-align:center;padding:12px 18px;background:#DC2626;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
        Coblos Sekarang
      </a>
      <div style="margin-top:20px;padding:14px 16px;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#991B1B;">
          <strong>Penting:</strong> Setelah masa pencoblosan berakhir, suara tidak dapat lagi diterima. Pastikan kamu sudah submit commit sebelum batas waktu.
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

// ─── Proposal Status Update (to Admin who created it) ──────────────────────

export function buildProposalStatusEmail(params: {
  adminName: string
  proposalTitle: string
  status: 'approved' | 'rejected' | 'revision_requested' | 'deployed'
  message?: string | null
  proposalLink: string
  electionLink?: string | null
}): { subject: string; html: string } {
  const statusLabels: Record<string, string> = {
    approved: 'Disetujui',
    rejected: 'Ditolak',
    revision_requested: 'Perlu Revisi',
    deployed: 'Berhasil Di-deploy',
  }
  const statusColors: Record<string, string> = {
    approved: '#16A34A',
    rejected: '#DC2626',
    revision_requested: '#D97706',
    deployed: '#3B82F6',
  }
  const label = statusLabels[params.status] || params.status
  const color = statusColors[params.status] || '#0F172A'
  const subject = `Proposal ${label}: ${params.proposalTitle} — Votein`

  const statusBanner = `<div style="display:inline-block;padding:4px 12px;border-radius:4px;background:${color};color:#FFFFFF;font-size:12px;font-weight:700;letter-spacing:0.04em;">${label}</div>`

  const isDeployed = params.status === 'deployed'
  const bodyText = isDeployed
    ? `Proposal kamu telah berhasil di-deploy ke blockchain oleh superadmin. Pemilihan <strong>${params.proposalTitle}</strong> sekarang sudah aktif dan pemilih bisa mulai berpartisipasi.`
    : `Proposal kamu telah <strong>${label.toLowerCase()}</strong> oleh superadmin.`
  const buttonLabel = isDeployed ? 'Lihat Pemilihan' : 'Lihat Proposal'
  const buttonLink = isDeployed && params.electionLink ? params.electionLink : params.proposalLink

  const messageBlock = params.message
    ? `<div style="margin:0 0 20px;padding:14px 16px;background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#92400E;">Pesan dari Superadmin</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#78350F;">${params.message}</p>
      </div>`
    : ''

  const html = `<div style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Arial,sans-serif;color:#0F172A;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;padding:28px;">
      <div style="margin-bottom:24px;">
        <img src="https://e-votein.netlify.app/favicon.png" alt="Votein" width="44" height="44" style="display:block;width:44px;height:44px;border-radius:12px;background:#0F172A;" />
      </div>
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#94A3B8;">Status Proposal</p>
      ${statusBanner}
      <h2 style="margin:12px 0 12px;font-size:22px;line-height:1.3;font-weight:600;color:#0F172A;">${params.proposalTitle}</h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">
        Halo <strong>${params.adminName}</strong>, ${bodyText}
      </p>
      ${messageBlock}
      <a href="${buttonLink}" style="display:inline-block;width:100%;box-sizing:border-box;text-align:center;padding:12px 18px;background:#0F172A;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
        ${buttonLabel}
      </a>
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #F1F5F9;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#94A3B8;">Terima kasih,<br />Tim Votein</p>
      </div>
    </div>
    <p style="margin:16px 0 0;text-align:center;font-size:11px;line-height:1.6;color:#94A3B8;">Votein — E-Voting Organisasi Mahasiswa</p>
  </div>
</div>`

  return { subject, html }
}
