/**
 * Deterministic Key Derivation untuk VoteChain
 *
 * Private key TIDAK PERNAH disimpan. Key di-derive secara real-time
 * dari kombinasi user_id + master secret menggunakan Keccak-256.
 *
 * Keamanan:
 * - Master secret hanya ada di environment variables backend
 * - Private key hanya ada SEMENTARA saat transaksi
 * - Tidak ada private key yang tersimpan di database
 */

import { keccak256, toBytes, encodePacked, type Address } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

/**
 * Derive private key dari user ID dan master secret.
 * Function ini hanya boleh dipanggil di backend (server-side).
 *
 * @param userId - UUID user dari Supabase Auth
 * @param masterSecret - Master secret dari environment variables
 * @returns Private key dalam format hex
 */
export function derivePrivateKey(
  userId: string,
  masterSecret: string,
): `0x${string}` {
  if (!masterSecret || masterSecret.length < 32) {
    throw new Error('WALLET_MASTER_SECRET tidak valid atau belum diatur')
  }

  // Gabungkan user_id dan master secret, lalu hash dengan Keccak-256
  const userIdHash = keccak256(toBytes(userId))
  const masterHash = keccak256(toBytes(masterSecret))

  // Derive key menggunakan encodePacked untuk determinisme
  const derivedKey = keccak256(
    encodePacked(['bytes32', 'bytes32'], [userIdHash, masterHash]),
  )

  return derivedKey
}

/**
 * Derive wallet address dari user ID.
 * Address selalu sama untuk user yang sama (deterministic).
 *
 * @param userId - UUID user dari Supabase Auth
 * @param masterSecret - Master secret dari environment variables
 * @returns Wallet address
 */
export function deriveWalletAddress(
  userId: string,
  masterSecret: string,
): Address {
  const privateKey = derivePrivateKey(userId, masterSecret)
  const account = privateKeyToAccount(privateKey)
  return account.address
}

/**
 * Sign message menggunakan derived private key.
 * Hanya untuk operasi off-chain (commitment, dll).
 *
 * @param userId - UUID user
 * @param masterSecret - Master secret
 * @param message - Message yang akan ditandatangani
 * @returns Signature
 */
export async function signMessage(
  userId: string,
  masterSecret: string,
  message: string,
): Promise<string> {
  const privateKey = derivePrivateKey(userId, masterSecret)
  const account = privateKeyToAccount(privateKey)
  return account.signMessage({ message })
}

/**
 * Get viem account object dari user ID.
 * Berguna untuk signing transaksi on-chain.
 *
 * @param userId - UUID user
 * @param masterSecret - Master secret
 * @returns Viem account object
 */
export function getDerivedAccount(userId: string, masterSecret: string) {
  const privateKey = derivePrivateKey(userId, masterSecret)
  return privateKeyToAccount(privateKey)
}

/**
 * Validate master secret format.
 *
 * @param secret - Master secret to validate
 * @returns true if valid
 */
export function isValidMasterSecret(secret: string | undefined): boolean {
  if (!secret) return false
  // Must be 64 hex characters (32 bytes)
  return /^[0-9a-fA-F]{64}$/.test(secret)
}
