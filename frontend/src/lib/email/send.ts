import nodemailer from 'nodemailer'
import { getSmtpConfig } from '@/lib/email/smtp'
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
  const config = getSmtpConfig()
  
  if (!config) {
    console.warn('[Email] SMTP is not configured. Email sending skipped.')
    return { success: false, error: 'Konfigurasi SMTP (Gmail) belum lengkap.' }
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465, // true for 465, false for other ports
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })

  const { subject, html } = buildSuperadminActivationEmail({
    displayName: params.displayName,
    email: params.email,
    activationLink: params.activationLink,
    expiresInDays: 7,
  })

  try {
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: params.email,
      subject,
      html,
    })

    console.log('[Email] Activation email sent successfully:', info.messageId)
    return { success: true, emailId: info.messageId }
  } catch (err) {
    console.error('[Email] Failed to send activation email:', err)
    const message = err instanceof Error ? err.message : 'Gagal mengirim email aktivasi via SMTP.'
    return { success: false, error: message }
  }
}
