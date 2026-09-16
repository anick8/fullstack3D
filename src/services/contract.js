import { BrowserProvider, Contract } from 'ethers';
import exampleAbi from '../data/abi/example.json';
import { DEFAULT_CHAIN_ID, getChainConfig } from '../data/chains';

/**
 * Error thrown for every expected wallet/chain failure path so callers can
 * branch on `error.code` instead of parsing message strings.
 */
export class Web3Error extends Error {
  /**
   * @param {string} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = 'Web3Error';
    this.code = code;
  }
}

/**
 * @returns {Promise<import('ethers').BrowserProvider>}
 */
export async function getProvider() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Web3Error('NO_WALLET', 'No injected wallet was found.');
  }
  return new BrowserProvider(window.ethereum);
}

/**
 * Requests accounts, verifies the connected chain matches the expected
 * chain id, and returns a signer. Never assume the chain — always check.
 * @param {number} [expectedChainId]
 * @returns {Promise<import('ethers').JsonRpcSigner>}
 */
export async function getSigner(expectedChainId = DEFAULT_CHAIN_ID) {
  const provider = await getProvider();

  try {
    await provider.send('eth_requestAccounts', []);
  } catch (err) {
    if (err?.code === 4001 || err?.code === 'ACTION_REJECTED') {
      throw new Web3Error('USER_REJECTED', 'Connection request was rejected.');
    }
    throw err;
  }

  const network = await provider.getNetwork();
  if (Number(network.chainId) !== expectedChainId) {
    throw new Web3Error(
      'WRONG_NETWORK',
      `Please switch your wallet to chain ${expectedChainId}.`
    );
  }

  return provider.getSigner();
}

/**
 * @param {import('ethers').Signer | import('ethers').Provider} runner
 * @param {number} [chainId]
 * @returns {import('ethers').Contract}
 */
export function getExampleContract(runner, chainId = DEFAULT_CHAIN_ID) {
  const config = getChainConfig(chainId);
  if (!config?.contractAddress) {
    throw new Web3Error('NO_CONTRACT', `No contract configured for chain ${chainId}.`);
  }
  return new Contract(config.contractAddress, exampleAbi, runner);
}
