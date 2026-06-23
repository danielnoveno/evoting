import nodemailer from 'nodemailer'
import { getSmtpConfig } from '@/lib/email/smtp'
import {
  buildAdminActivationEmail,
  buildVoterActivationEmail,
  buildCommitReminderEmail,
  buildElectionResultsEmail,
  buildPhaseChangeEmail,
} from '@/lib/email/templates'

export interface SendActivationEmailResult {
  success: boolean
  emailId?: string
  error?: string
}

function createTransporter() {
  const config = getSmtpConfig()
  if (!config) return null
  return {
    transporter: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    }),
    from: `"${config.fromName}" <${config.fromEmail}>`,
  }
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

// ─── Election Notification Emails ────────────────────────────────────────────

export async function sendCommitReminderEmail(params: {
  email: string
  voterName: string
  electionTitle: string
  commitEndsAt: string
  siteUrl: string
}): Promise<SendActivationEmailResult> {
  const setup = createTransporter()
  if (!setup) {
    return { success: false, error: 'Konfigurasi SMTP (Gmail) belum lengkap.' }
  }

  const { subject, html } = buildCommitReminderEmail(params)

  try {
    const info = await setup.transporter.sendMail({
      from: setup.from,
      to: params.email,
      subject,
      html,
    })
    console.log('[Email] Commit reminder sent:', info.messageId)
    return { success: true, emailId: info.messageId }
  } catch (err) {
    console.error('[Email] Failed to send commit reminder:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Gagal mengirim email pengingat commit.' }
  }
}

export async function sendElectionResultsEmail(params: {
  email: string
  voterName: string
  electionTitle: string
  winnerName: string
  totalVotes: number
  candidates: Array<{ name: string; voteCount: number; percentage: string }>
  siteUrl: string
}): Promise<SendActivationEmailResult> {
  const setup = createTransporter()
  if (!setup) {
    return { success: false, error: 'Konfigurasi SMTP (Gmail) belum lengkap.' }
  }

  const { subject, html } = buildElectionResultsEmail(params)

  try {
    const info = await setup.transporter.sendMail({
      from: setup.from,
      to: params.email,
      subject,
      html,
    })
    console.log('[Email] Election results sent:', info.messageId)
    return { success: true, emailId: info.messageId }
  } catch (err) {
    console.error('[Email] Failed to send election results:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Gagal mengirim email hasil pemilihan.' }
  }
}

export async function sendPhaseChangeEmail(params: {
  email: string
  adminName: string
  electionTitle: string
  newPhase: string
  siteUrl: string
}): Promise<SendActivationEmailResult> {
  const setup = createTransporter()
  if (!setup) {
    return { success: false, error: 'Konfigurasi SMTP (Gmail) belum lengkap.' }
  }

  const { subject, html } = buildPhaseChangeEmail(params)

  try {
    const info = await setup.transporter.sendMail({
      from: setup.from,
      to: params.email,
      subject,
      html,
    })
    console.log('[Email] Phase change notification sent:', info.messageId)
    return { success: true, emailId: info.messageId }
  } catch (err) {
    console.error('[Email] Failed to send phase change email:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Gagal mengirim email notifikasi fase.' }
  }
}
