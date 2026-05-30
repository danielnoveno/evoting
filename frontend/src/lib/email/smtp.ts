export function getSmtpConfig() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '465')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD
  const fromEmail = process.env.EMAIL_FROM
  const fromName = process.env.EMAIL_FROM_NAME || 'Votein — Portal Admin'

  if (!user || !pass || !fromEmail) {
    return null
  }

  return { host, port, user, pass, fromEmail, fromName }
}

export function isSmtpConfigured() {
  const config = getSmtpConfig()
  return config !== null
}
