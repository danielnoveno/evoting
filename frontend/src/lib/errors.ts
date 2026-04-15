const CONTRACT_ERRORS: Record<string, string> = {
  NotRegistered: 'Wallet kamu belum terdaftar sebagai pemilih di ruang ini.',
  AlreadyCommitted: 'Kamu sudah mengirim commit. Tunggu fase Konfirmasi.',
  AlreadyRevealed: 'Kamu sudah melakukan konfirmasi suara.',
  CommitmentMismatch: 'Salt tidak cocok dengan komitmen. Periksa data commit kamu.',
  WrongPhase: 'Aksi ini tidak tersedia di fase voting saat ini.',
  NotAdmin: 'Hanya admin yang bisa melakukan aksi ini.',
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    for (const [key, value] of Object.entries(CONTRACT_ERRORS)) {
      if (error.message.includes(key)) return value
    }

    if (error.message.includes('User rejected')) return 'Transaksi dibatalkan.'
    if (error.message.toLowerCase().includes('insufficient funds')) {
      return 'Saldo testnet ETH tidak cukup.'
    }
  }

  return 'Transaksi gagal. Coba lagi atau lihat detail di Basescan.'
}
