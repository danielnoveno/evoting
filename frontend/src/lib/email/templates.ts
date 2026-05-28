export function buildSuperadminActivationEmail(params: {
  displayName: string
  email: string
  activationLink: string
  expiresInDays: number
}): { subject: string; html: string } {
  const subject = 'Aktivasi Akun Superadmin — Votein Portal Admin'

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aktivasi Akun Superadmin</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid #E2E8F0;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding:32px 32px 0 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="width:48px;height:48px;background-color:#0F172A;border-radius:14px;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:1px;">V</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td align="center" style="padding:24px 32px 0 32px;">
              <h1 style="margin:0;font-size:20px;font-weight:600;color:#0F172A;line-height:1.3;">
                Aktivasi Akun Superadmin
              </h1>
              <p style="margin:8px 0 0 0;font-size:14px;line-height:1.6;color:#475569;">
                Anda telah diundang sebagai superadmin di platform Votein.
              </p>
            </td>
          </tr>

          <!-- Info box -->
          <tr>
            <td align="center" style="padding:24px 32px 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#EFF6FF;border-radius:8px;border:1px solid #BFDBFE;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:12px;font-weight:600;color:#1D4ED8;text-transform:uppercase;letter-spacing:0.06em;">
                      Penerima Undangan
                    </p>
                    <p style="margin:6px 0 0 0;font-size:14px;font-weight:600;color:#0F172A;">
                      ${params.displayName}
                    </p>
                    <p style="margin:4px 0 0 0;font-size:13px;color:#475569;">
                      ${params.email}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:28px 32px 0 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#0F172A;border-radius:8px;padding:0;">
                    <a href="${params.activationLink}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;line-height:1;">
                      Aktifkan Akun Superadmin
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td align="center" style="padding:16px 32px 0 32px;">
              <p style="margin:0;font-size:12px;color:#94A3B8;">
                Atau salin link ini ke browser:
              </p>
              <p style="margin:4px 0 0 0;font-size:11px;font-family:monospace;color:#64748B;word-break:break-all;">
                ${params.activationLink}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 32px 32px 32px;border-top:1px solid #F1F5F9;margin-top:24px;">
              <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.5;">
                Link aktivasi berlaku selama ${params.expiresInDays} hari. Abaikan email ini jika Anda tidak merasa mendaftar.
              </p>
            </td>
          </tr>
        </table>

        <!-- Brand footer -->
        <table width="480" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:16px 0;">
              <p style="margin:0;font-size:11px;color:#94A3B8;">
                Votein — Portal Admin HIMAFORKA FTI UAJY
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html }
}
