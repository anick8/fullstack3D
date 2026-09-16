/**
 * Supported chains, keyed by chain id. Add contract addresses here per
 * chain — never inline an address in a component.
 */
export const CHAINS = {
  11155111: {
    name: 'Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || '',
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
  },
  1: {
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || '',
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
  },
};

export const DEFAULT_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID || 11155111
);

/**
 * @param {number} chainId
 * @returns {{ name: string, rpcUrl: string, contractAddress: string } | undefined}
 */
export function getChainConfig(chainId) {
  return CHAINS[chainId];
}
