import nodemailer from 'nodemailer'
import { getSmtpConfig } from '@/lib/email/smtp'
import { buildAdminActivationEmail, buildVoterActivationEmail } from '@/lib/email/templates'

export interface SendActivationEmailResult {
  success: boolean
  emailId?: string
  error?: string
}

export async function sendAdminActivationEmail(params: {
  displayName: string
  email: string
  activationLink: string
  role: 'admin' | 'super_admin'
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

  const { subject, html } = buildAdminActivationEmail({
    displayName: params.displayName,
    email: params.email,
    activationLink: params.activationLink,
    expiresInDays: 7,
    role: params.role,
  })

  try {
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: params.email,
      subject,
      html,
    })

    console.log(`[Email] ${params.role} activation email sent successfully:`, info.messageId)
    return { success: true, emailId: info.messageId }
  } catch (err) {
    console.error(`[Email] Failed to send ${params.role} activation email:`, err)
    const message = err instanceof Error ? err.message : 'Gagal mengirim email aktivasi via SMTP.'
    return { success: false, error: message }
  }
}

export async function sendVoterActivationEmail(params: {
  displayName: string
  email: string
  activationLink: string
}): Promise<SendActivationEmailResult> {
  const config = getSmtpConfig()

  if (!config) {
    console.warn('[Email] SMTP is not configured. Voter email sending skipped.')
    return { success: false, error: 'Konfigurasi SMTP (Gmail) belum lengkap.' }
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })

  const { subject, html } = buildVoterActivationEmail(params)

  try {
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: params.email,
      subject,
      html,
    })

    console.log('[Email] voter activation email sent successfully:', info.messageId)
    return { success: true, emailId: info.messageId }
  } catch (err) {
    console.error('[Email] Failed to send voter activation email:', err)
    const message = err instanceof Error ? err.message : 'Gagal mengirim email aktivasi voter via SMTP.'
    return { success: false, error: message }
  }
}

/**
 * @deprecated Use sendAdminActivationEmail instead
 */
export async function sendSuperadminActivationEmail(params: {
  displayName: string
  email: string
  activationLink: string
}): Promise<SendActivationEmailResult> {
  return sendAdminActivationEmail({ ...params, role: 'super_admin' })
}
