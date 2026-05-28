export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY)
}

export function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'aktivasi@votein.app'
  const fromName = process.env.RESEND_FROM_NAME ?? 'Votein — Portal Admin'

  if (!apiKey) {
    return null
  }

  return { apiKey, fromEmail, fromName }
}
