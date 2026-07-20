import { baseSepolia } from 'wagmi/chains'

type ConnectorInfo = { id?: string; type?: string }
type CapabilityValue = { status?: string; supported?: boolean }
type WalletCapabilities = {
  atomic?: CapabilityValue
  atomicBatch?: CapabilityValue
  paymasterService?: CapabilityValue
}

export type WalletTransactionSupport = {
  mode: 'disconnected' | 'checking' | 'send-calls' | 'standard' | 'unsupported' | 'wrong-chain'
  canTransact: boolean
  supportsPaymaster: boolean
  message: string | null
}

function asCapabilities(value: unknown): WalletCapabilities {
  return value && typeof value === 'object' ? value as WalletCapabilities : {}
}

export function isInjectedConnector(connector?: ConnectorInfo | null) {
  return connector?.type === 'injected' || connector?.id === 'injected'
}

export function isSuccessfulTransactionReceipt(receipt: unknown): receipt is { status: 'success' } {
  return Boolean(receipt && typeof receipt === 'object' && 'status' in receipt && receipt.status === 'success')
}

export function resolveWalletTransactionSupport({ account, chainId, connector, capabilities, capabilitiesPending }: {
  account?: string
  chainId?: number
  connector?: ConnectorInfo | null
  capabilities?: unknown
  capabilitiesPending?: boolean
}): WalletTransactionSupport {
  if (!account || !connector) {
    return { mode: 'disconnected', canTransact: false, supportsPaymaster: false, message: 'Sambungkan dompet aktivasi terlebih dahulu.' }
  }
  if (chainId === undefined) {
    return { mode: 'checking', canTransact: false, supportsPaymaster: false, message: null }
  }
  if (chainId !== baseSepolia.id) {
    return {
      mode: 'wrong-chain',
      canTransact: false,
      supportsPaymaster: false,
      message: 'Dompet tersambung ke jaringan lain. Pilih Base Sepolia (84532) langsung di dompet, lalu coba lagi.',
    }
  }

  // Injected EIP-1193 wallets use the standard transaction path. Other account
  // types must explicitly advertise wallet_sendCalls for this account + chain.
  if (isInjectedConnector(connector)) {
    return { mode: 'standard', canTransact: true, supportsPaymaster: false, message: null }
  }
  if (capabilitiesPending) {
    return { mode: 'checking', canTransact: false, supportsPaymaster: false, message: null }
  }

  const supported = asCapabilities(capabilities)
  const atomicStatus = supported.atomic?.status
  const supportsSendCalls = atomicStatus === 'supported'
    || atomicStatus === 'ready'
    || supported.atomicBatch?.supported === true

  if (supportsSendCalls) {
    return {
      mode: 'send-calls',
      canTransact: true,
      supportsPaymaster: supported.paymasterService?.supported === true,
      message: null,
    }
  }

  return {
    mode: 'unsupported',
    canTransact: false,
    supportsPaymaster: false,
    message: 'Akun dompet ini tidak mendukung transaksi Base Sepolia. Putuskan dompet, lalu pilih akun Coinbase Smart Wallet yang kompatibel atau dompet browser seperti MetaMask.',
  }
}

export function isAmbiguousTransactionError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return /(timeout|timed out|connection.*lost|disconnected|network error|failed to fetch|socket hang up)/.test(message)
}

export function getWalletTransactionErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''

  if (message.includes('base sepolia is not supported') || (message.includes('chain') && message.includes('not supported'))) {
    return 'Akun dompet ini ditolak oleh penyedia untuk Base Sepolia. Gunakan akun Coinbase Smart Wallet yang kompatibel atau dompet browser seperti MetaMask.'
  }
  if (message.includes('user rejected') || message.includes('user denied') || message.includes('cancelled')) {
    return 'Transaksi dibatalkan. Tidak ada transaksi yang dikirim.'
  }
  if (message.includes('insufficient funds')) {
    return 'Saldo ETH uji coba tidak cukup. Isi saldo Base Sepolia pada dompet ini, lalu coba lagi.'
  }
  if (isAmbiguousTransactionError(error)) {
    return 'Status pengiriman belum pasti karena koneksi terputus. Jangan kirim ulang sekarang. Periksa aktivitas dompet dan Basescan terlebih dahulu.'
  }
  if (message.includes('wrong chain') || message.includes('chain mismatch')) {
    return 'Jaringan dompet tidak sesuai. Pilih Base Sepolia (84532) langsung di dompet, lalu coba lagi.'
  }
  if (message.includes('notregistered') || message.includes('notwhitelisted')) {
    return 'Dompet aktivasi belum terdaftar sebagai pemilih untuk pemilihan ini.'
  }
  if (message.includes('alreadycommitted') || message.includes('alreadyvoted')) {
    return 'Dompet ini sudah pernah menyimpan pilihan untuk pemilihan ini.'
  }
  if (message.includes('wrongphase')) {
    return 'Aksi ini tidak tersedia pada tahap pemilihan saat ini.'
  }
  if (message.includes('reverted') || message.includes('receipt transaksi gagal') || message.includes('status panggilan gagal')) {
    return 'Transaksi ditolak saat diproses di Base Sepolia. Suara belum tersimpan. Periksa status pemilihan dan whitelist dompet.'
  }
  if (message.includes('bukti transaksi berhasil tidak tersedia')) {
    return 'Dompet menyatakan proses selesai, tetapi bukti transaksi berhasil tidak tersedia. Jangan anggap suara sudah tersimpan; periksa Basescan atau hubungi admin.'
  }
  return 'Transaksi belum berhasil. Periksa jaringan Base Sepolia, status pemilihan, dan whitelist dompet sebelum mencoba lagi.'
}
