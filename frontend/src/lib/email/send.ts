import { Resend } from 'resend'
import { getResendConfig } from '@/lib/email/resend'
import { buildSuperadminActivationEmail } from '@/lib/email/templates'

export interface SendActivationEmailResult {
  success: boolean
  emailId?: string
  error?: string
}

export async function sendSuperadminActivationEmail(params: {
  displayName: string
  email: string
  activationLink: string
}): Promise<SendActivationEmailResult> {
  const config = getResendConfig()
  if (!config) {
    return { success: false, error: 'RESEND_API_KEY belum dikonfigurasi.' }
  }

  const resend = new Resend(config.apiKey)
  const { subject, html } = buildSuperadminActivationEmail({
    displayName: params.displayName,
    email: params.email,
    activationLink: params.activationLink,
    expiresInDays: 7,
  })

  try {
    const { data, error } = await resend.emails.send({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: params.email,
      subject,
      html,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, emailId: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal mengirim email aktivasi.'
    return { success: false, error: message }
  }
}
