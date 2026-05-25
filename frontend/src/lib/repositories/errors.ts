export class RepositoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RepositoryError'
  }
}

export function getRepositoryErrorMessage(error: unknown, fallback = 'Data belum dapat dimuat.'): string {
  if (error instanceof RepositoryError) return error.message

  if (error instanceof Error) {
    if (error.message.toLowerCase().includes('permission')) {
      return 'Kamu tidak memiliki akses ke data ini.'
    }

    if (error.message.toLowerCase().includes('auth')) {
      return 'Sesi kamu sudah berakhir. Silakan masuk lagi.'
    }
  }

  return fallback
}
