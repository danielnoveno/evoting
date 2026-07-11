import type { ServiceClient } from '@/app/api/_lib/auth'

function uniqueWallets(wallets: Array<string | null | undefined>) {
  return Array.from(new Set(wallets
    .map((wallet) => wallet?.trim().toLowerCase() ?? '')
    .filter((wallet) => /^0x[a-f0-9]{40}$/.test(wallet))))
}

export async function notifyWhitelistAdded(
  client: ServiceClient,
  params: { proposalId: string; proposalTitle?: string | null; wallets: Array<string | null | undefined> },
) {
  const wallets = uniqueWallets(params.wallets)
  if (wallets.length === 0) return

  const title = params.proposalTitle?.trim() || 'pemilihan ini'
  const { error } = await client.from('notification_jobs').insert(wallets.map((wallet) => ({
    target_wallet: wallet,
    channel: 'in_app' as const,
    template_key: 'whitelist_added',
    status: 'sent' as const,
    payload: {
      proposalId: params.proposalId,
      eventType: 'whitelist_added',
      title: 'Anda ditambahkan sebagai pemilih',
      description: `Akun Anda terdaftar sebagai pemilih untuk "${title}".`,
      type: 'success',
      link: '/pemilih',
    },
  })))

  if (error) console.error('[notifications] Failed to create whitelist notifications:', error)
}

export async function notifyDeployedElectionVoters(
  client: ServiceClient,
  params: { proposalId: string; proposalTitle: string; spaceAddress?: string | null; wallets: Array<string | null | undefined> },
) {
  const wallets = uniqueWallets(params.wallets)
  if (wallets.length === 0) return

  const link = params.spaceAddress ? `/pemilih/pemilihan/${params.spaceAddress}/pilih-kandidat` : '/pemilih'
  const { error } = await client.from('notification_jobs').insert(wallets.map((wallet) => ({
    target_wallet: wallet,
    channel: 'in_app' as const,
    template_key: 'voter_election_deployed',
    status: 'sent' as const,
    payload: {
      proposalId: params.proposalId,
      eventType: 'election_deployed',
      title: 'Pemilihan baru tersedia',
      description: `Anda terdaftar sebagai pemilih untuk "${params.proposalTitle}". Silakan cek detail pemilihan.`,
      type: 'success',
      link,
    },
  })))

  if (error) console.error('[notifications] Failed to create deployed voter notifications:', error)
}
