// @ts-nocheck
import { ChainNotConfiguredError, createConnector } from '@wagmi/core'
import { getAddress, numberToHex, SwitchChainError, UserRejectedRequestError } from 'viem'

type BaseAccountParameters = {
  appName: string
  appLogoUrl?: string | null
  preference?: Record<string, unknown>
}

type WalletConnectResponse = {
  accounts: Array<{
    address: string
    capabilities?: Record<string, unknown>
  }>
  chainIds: string[]
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    return typeof message === 'string' ? message : ''
  }
  return ''
}

function isUserRejected(error: unknown) {
  const maybeCode = typeof error === 'object' && error !== null && 'code' in error
    ? (error as { code?: unknown }).code
    : undefined
  return maybeCode === 4001 || /(user closed modal|accounts received is empty|wallet must has at least one account|user denied account|request rejected)/i.test(getErrorMessage(error))
}

function removeProviderListener(
  provider,
  event: 'accountsChanged' | 'chainChanged' | 'disconnect',
  listener: ((payload: string[]) => void) | ((payload: string) => void) | ((payload: Error) => void) | undefined,
) {
  if (!listener || !provider.removeListener) return
  provider.removeListener(event, listener as (payload: never) => void)
}

export function baseAccountConnector(parameters: BaseAccountParameters) {
  let walletProvider: RemovableProvider | undefined
  let accountsChanged: ((accounts: string[]) => void) | undefined
  let chainChanged: ((chainId: string) => void) | undefined
  let disconnect: ((error: Error) => void) | undefined

  return createConnector((config) => ({
    id: 'baseAccount',
    name: 'Base Account',
    rdns: 'app.base.account',
    type: 'baseAccount',

    async connect({ chainId, withCapabilities } = {}) {
      try {
        const provider = await this.getProvider()
        const targetChainId = chainId ?? config.chains[0]?.id
        if (!targetChainId) throw new ChainNotConfiguredError()

        const response = await provider.request({
          method: 'wallet_connect',
          params: [
            {
              capabilities: {},
              chainIds: [
                numberToHex(targetChainId),
                ...config.chains
                  .filter((chain) => chain.id !== targetChainId)
                  .map((chain) => numberToHex(chain.id)),
              ],
            },
          ],
        }) as WalletConnectResponse

        if (!response.accounts.length) {
          throw new UserRejectedRequestError(new Error('wallet must has at least one account'))
        }

        const accounts = response.accounts.map((account) => ({
          address: getAddress(account.address),
          capabilities: account.capabilities ?? {},
        }))
        let currentChainId = Number(response.chainIds[0])

        if (!accountsChanged) {
          accountsChanged = this.onAccountsChanged.bind(this)
          provider.on('accountsChanged', accountsChanged)
        }
        if (!chainChanged) {
          chainChanged = this.onChainChanged.bind(this)
          provider.on('chainChanged', chainChanged)
        }
        if (!disconnect) {
          disconnect = this.onDisconnect.bind(this)
          provider.on('disconnect', disconnect)
        }

        if (chainId && currentChainId !== chainId) {
          const chain = await this.switchChain({ chainId }).catch((error) => {
            if (error instanceof UserRejectedRequestError) throw error
            return { id: currentChainId }
          })
          currentChainId = chain?.id ?? currentChainId
        }

        return {
          accounts: withCapabilities ? accounts : accounts.map((account) => account.address),
          chainId: currentChainId,
        }
      } catch (error) {
        if (isUserRejected(error)) throw new UserRejectedRequestError(error)
        throw error
      }
    },

    async disconnect() {
      const provider = await this.getProvider()
      removeProviderListener(provider, 'accountsChanged', accountsChanged)
      removeProviderListener(provider, 'chainChanged', chainChanged)
      removeProviderListener(provider, 'disconnect', disconnect)
      accountsChanged = undefined
      chainChanged = undefined
      disconnect = undefined
      await provider.disconnect()
    },

    async getAccounts() {
      const provider = await this.getProvider()
      const accounts = await provider.request({ method: 'eth_accounts' })
      return asStringArray(accounts).map((account) => getAddress(account))
    },

    async getChainId() {
      const provider = await this.getProvider()
      const chainId = await provider.request({ method: 'eth_chainId' })
      return Number(chainId)
    },

    async getProvider() {
      if (!walletProvider) {
        // Guard: wallet extensions (MetaMask/Rabby) define window.ethereum as
        // a read-only getter. Base Account SDK's requestProvider tries to SET
        // it, which throws TypeError. Make it writable before SDK loads.
        if (typeof window !== 'undefined' && window.ethereum) {
          try {
            Object.defineProperty(window, 'ethereum', {
              value: window.ethereum,
              writable: true,
              configurable: true,
            })
          } catch {
            // Already configurable or non-redefinable — proceed anyway
          }
        }

        const { createBaseAccountSDK } = await import('@base-org/account')
        const sdk = createBaseAccountSDK({
          ...parameters,
          appChainIds: config.chains.map((chain) => chain.id),
          preference: parameters.preference,
        })
        walletProvider = sdk.getProvider()
      }
      return walletProvider
    },

    async isAuthorized() {
      try {
        const accounts = await this.getAccounts()
        return accounts.length > 0
      } catch {
        return false
      }
    },

    async switchChain({ addEthereumChainParameter, chainId }) {
      const chain = config.chains.find((item) => item.id === chainId)
      if (!chain) throw new SwitchChainError(new ChainNotConfiguredError())

      const provider = await this.getProvider()
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: numberToHex(chain.id) }],
        })
        return chain
      } catch (error) {
        const maybeError = error as { code?: number }
        if (maybeError.code === 4902) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  blockExplorerUrls: addEthereumChainParameter?.blockExplorerUrls ?? (chain.blockExplorers?.default.url ? [chain.blockExplorers.default.url] : []),
                  chainId: numberToHex(chainId),
                  chainName: addEthereumChainParameter?.chainName ?? chain.name,
                  iconUrls: addEthereumChainParameter?.iconUrls,
                  nativeCurrency: addEthereumChainParameter?.nativeCurrency ?? chain.nativeCurrency,
                  rpcUrls: addEthereumChainParameter?.rpcUrls?.length ? addEthereumChainParameter.rpcUrls : [chain.rpcUrls.default?.http[0] ?? ''],
                },
              ],
            })
            return chain
          } catch (addError) {
            throw new UserRejectedRequestError(addError)
          }
        }
        throw new SwitchChainError(error)
      }
    },

    onAccountsChanged(accounts) {
      if (accounts.length === 0) this.onDisconnect()
      else config.emitter.emit('change', { accounts: accounts.map((account) => getAddress(account)) })
    },

    onChainChanged(chainId) {
      config.emitter.emit('change', { chainId: Number(chainId) })
    },

    async onDisconnect() {
      config.emitter.emit('disconnect')
      const provider = await this.getProvider()
      removeProviderListener(provider, 'accountsChanged', accountsChanged)
      removeProviderListener(provider, 'chainChanged', chainChanged)
      removeProviderListener(provider, 'disconnect', disconnect)
      accountsChanged = undefined
      chainChanged = undefined
      disconnect = undefined
    },
  }))
}
