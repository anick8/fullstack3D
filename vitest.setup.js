import '@testing-library/jest-dom/vitest';

// Mock window.ethereum so tests never touch a real wallet or RPC endpoint.
// Individual tests should override methods as needed via vi.spyOn.
if (typeof window !== 'undefined' && !window.ethereum) {
  window.ethereum = {
    isMetaMask: true,
    request: async () => {
      throw new Error('window.ethereum.request is not mocked for this test');
    },
    on: () => {},
    removeListener: () => {},
  };
}
