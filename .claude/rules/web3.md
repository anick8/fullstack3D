---
paths:
  - "src/services/contract.js"
  - "src/services/**"
  - "src/hooks/**"
  - "src/data/abi/**"
  - "app/api/**"
---

# Web3 Rules

## Boundaries

- Every contract read/write goes through `src/services/contract.js`. Components never build a provider, signer, or `ethers.Contract`.
- ABIs live in `src/data/abi/`; addresses in `src/data/chains.js`, keyed by chain id. Never inline either.
- Server-side chain access uses `RPC_URL` inside `app/api/` route handlers — never a `NEXT_PUBLIC_` secret.

## Correctness

- Amounts are `bigint` end to end. `parseUnits` at input, `formatUnits` at display — never store formatted strings.
- Read the chain id before every write and refuse the transaction if it doesn't match `NEXT_PUBLIC_CHAIN_ID`.
- Await the receipt and check `status` before treating a write as successful; a sent transaction is not a confirmed one.
- Handle these explicitly, with a user-visible message each: no injected wallet, locked/no accounts, wrong network, user rejection (`ACTION_REJECTED`), insufficient funds, reverted transaction.
- Clean up event listeners and `provider.on` subscriptions on unmount.

## Safety

- Never generate, request, log, or persist a private key, seed phrase, or signed payload.
- Never send a mainnet transaction or run a deploy/verify script without asking first — default to a testnet.
- Don't request unlimited token approvals; approve the exact amount unless asked otherwise.
