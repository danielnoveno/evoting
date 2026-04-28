export const REGISTRY_ABI = [
  {
    type: 'function',
    name: 'isSuperAdmin',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
  },
  {
    type: 'function',
    name: 'spaceById',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
  },
] as const
