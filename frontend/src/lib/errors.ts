const CONTRACT_ERRORS: Record<string, string> = {
  NotRegistered: 'Wallet kamu belum terdaftar sebagai pemilih di space ini.',
  AlreadyVoted: 'Kamu sudah melakukan voting di space ini.',
  AlreadyCommitted: 'Kamu sudah mengirim commit. Tunggu fase Reveal.',
  CommitmentMismatch:
    'Salt tidak cocok dengan komitmen. Pastikan kamu membuka dari browser yang sama.',
  WrongPhase: 'Aksi ini tidak tersedia di fase voting saat ini.',
  NotAdmin: 'Hanya admin yang bisa melakukan aksi ini.',
  NotAuthorized: 'Wallet kamu tidak memiliki izin admin untuk aksi ini.',
  NotSuperAdmin: 'Aksi ini hanya dapat dilakukan oleh superadmin.',
  VotingStillActive: 'Hasil belum tersedia — voting masih berlangsung.',
  AlreadyRegistered: 'Alamat wallet ini sudah terdaftar.',
  ElectionSuspended: 'Space sedang ditangguhkan oleh superadmin.',
  ElectionTerminated: 'Space telah ditutup permanen oleh superadmin.',
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    for (const [key, message] of Object.entries(CONTRACT_ERRORS)) {
      if (error.message.includes(key)) {
        return message
      }
    }

    if (error.message.includes('User rejected')) return 'Transaksi dibatalkan.'
    if (error.message.includes('insufficient funds')) return 'Saldo testnet ETH tidak cukup.'
  }

  return 'Transaksi gagal. Coba lagi atau lihat detail di Basescan.'
}
