export class RepositoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RepositoryError'
  }
}

export function getRepositoryErrorMessage(error: unknown, fallback = 'Data belum dapat dimuat.'): string {
  if (error instanceof RepositoryError) return error.message

  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    
    // Pass-through specific informative messages
    if (msg.length > 0 && !msg.includes('object object')) {
      return error.message
    }

    if (msg.includes('permission')) {
      return 'Kamu tidak memiliki akses ke data ini.'
    }

    if (msg.includes('auth')) {
      return 'Sesi kamu sudah berakhir. Silakan masuk lagi.'
    }
  }

  return fallback
}
