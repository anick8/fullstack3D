---
paths:
  - "**/*.test.{js,jsx}"
  - "**/*.spec.{js,jsx}"
  - "**/__tests__/**"
  - "test/**"
  - "vitest.config.*"
  - "vitest.setup.*"
---

# Testing Rules

## Stack

- Vitest + React Testing Library + `jsdom`.
- JavaScript only — test files are `.test.js` / `.test.jsx`, no TypeScript.

## Running

- Full suite: `npm test` (`vitest run` — one-shot, not watch mode).
- Single file: `npm test -- <path>` or `npx vitest run <path>`.
- Run the relevant tests after every change; run the full suite before declaring a task done.

## File Layout

- Co-locate tests next to the code: `Button.jsx` → `Button.test.jsx`.
- Use `__tests__/` only when a folder has many related tests.
- Shared fixtures and mocks go in `test/fixtures/` and `test/mocks/`.

## Writing Tests

- Test behavior, not implementation: assert on what the user sees or what the function returns.
- Query by role, label, or visible text (`getByRole`, `getByText`, `getByLabelText`); `data-testid` only as a last resort.
- Use `userEvent` to simulate interaction; `await findBy*` for async UI.
- One behavior per `it(...)`. Name tests as sentences: `it('shows an error when the wallet is on the wrong network')`.
- Arrange / Act / Assert — keep each test readable top to bottom.
- Cover the edge cases that matter here: no wallet installed, wrong chain id, user-rejected transaction, pending/failed transaction, empty and error states.
- No snapshot tests for UI unless explicitly asked — they break on every style change and catch little.

## Mocking

- Mock at the boundary: `src/services/api.js`, `src/services/contract.js`, `fetch`, and timers.
- Never mock the unit under test or its internal helpers.
- Mock `window.ethereum` and the ethers provider in `vitest.setup.js`, not per test.
- Use `vi.useFakeTimers()` for countdowns/debounces/polling and always restore real timers after.
- 3D: don't render a real `<Canvas>` in jsdom — there is no WebGL context. Test scene logic as plain functions and mock `@react-three/fiber` where a component must mount.

## State

- Reset Zustand stores between tests — no state leaking across tests.
- Each test sets up its own data; never depend on test execution order.

## Don't

- Don't delete, skip (`.skip`), or loosen a failing test to make the suite green — fix the code or ask.
- Don't commit `.only`.
- Don't leave `console.log` in tests.
- Don't hit a real RPC endpoint, a live chain, or any third-party API from tests.
