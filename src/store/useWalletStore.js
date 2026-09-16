import { create } from 'zustand';

/**
 * Wallet connection state. Reset between tests per project testing rules.
 */
export const useWalletStore = create((set) => ({
  address: null,
  chainId: null,
  isConnecting: false,
  error: null,
  setConnected: (address, chainId) =>
    set({ address, chainId, isConnecting: false, error: null }),
  setConnecting: (isConnecting) => set({ isConnecting }),
  setError: (error) => set({ error, isConnecting: false }),
  disconnect: () => set({ address: null, chainId: null, error: null }),
}));
