export const CONTRACTS = {
  cdiOracle: '0x4b937A83f72201560BcC91f0dBa9a03Dd57B36e7' as `0x${string}`,
  rendexToken: '0x3B485F4c487C0D3C346352714b44F1dD11d7eC1e' as `0x${string}`,
  owner: '0x8Edc25658FB3E000f16F7122BB56a4F6cF860A38' as `0x${string}`,
}

export const CDI_ORACLE_ABI = [
  { name: 'getCDI', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'getLastUpdateTime', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const

export const RENDEX_TOKEN_ABI = [
  { name: 'sharesPerToken', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'INITIAL_SHARES_PER_TOKEN', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'owner', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'rebase', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  {
    name: 'RebaseExecuted',
    type: 'event',
    inputs: [
      { name: 'rebaseCount', type: 'uint256', indexed: true },
      { name: 'cdiRate', type: 'uint256', indexed: false },
      { name: 'rebaseRate', type: 'uint256', indexed: false },
      { name: 'newSharesPerToken', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const
