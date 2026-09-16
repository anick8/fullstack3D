# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**fullstacketh3D** — a full-stack Ethereum dApp with an interactive 3D interface: wallet-connected on-chain data rendered through react-three-fiber.

**Primary goals (in priority order):**
1. A reliable wallet + contract layer — connect, read, and write to Ethereum without silent failures.
2. A smooth, performant 3D scene that stays at 60fps on mid-range hardware.
3. A clean full-stack seam — Next.js route handlers as the only server boundary.

## Tech Stack

- **Language:** JavaScript (not TypeScript)
- **Frontend:** Next.js (App Router)
- **3D:** react-three-fiber + drei (Three.js)
- **Web3:** ethers + wagmi
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Backend:** Next.js route handlers (`app/api/`)
- **Database:** none
- **Testing:** Vitest + React Testing Library (jsdom)
- **Deployment:** Vercel
- **Package manager:** npm

## Repository Layout

```
/
├── app/               # Next.js App Router — routes, layouts, api/ route handlers
├── src/
│   ├── components/    # reusable UI components
│   ├── scene/         # react-three-fiber canvas, meshes, materials, loaders
│   ├── services/      # API client + contract calls — all network/chain calls go here
│   ├── lib/           # helpers
│   ├── hooks/         # custom hooks (wallet, contract, frame loops)
│   ├── store/         # Zustand stores
│   └── data/          # static content, ABIs, chain + contract constants
├── public/            # static assets, glTF/GLB models, textures
└── CLAUDE.md
```

## Commands

```bash
npm install
npm run dev          # next dev — http://localhost:3000
npm run build        # next build — MUST pass before deploy
npm run lint         # next lint (eslint)
npm test             # vitest run
npm test -- <path>   # single test file
```

Before considering any task done: run `lint`, `test`, and `build`. All must pass.

## Environment Variables

- `NEXT_PUBLIC_CHAIN_ID` — target chain (e.g. `1` mainnet, `11155111` Sepolia).
- `NEXT_PUBLIC_RPC_URL` — public RPC endpoint used by the browser provider.
- `NEXT_PUBLIC_CONTRACT_ADDRESS` — deployed contract address for the active chain.
- `RPC_URL` — server-side RPC endpoint for route handlers (never exposed to the client).

Keep secrets in `.env.local` (gitignored). Never hardcode keys, RPC URLs, or contract addresses.
Only `NEXT_PUBLIC_*` vars reach the browser — never prefix a secret.

## Conventions

**React / Next.js**
- Functional components with hooks only — no class components.
- Server Components by default; add `'use client'` only where hooks, wallet access, or the canvas require it.
- One component per file; named exports for components (default export only where the router requires it).
- Document component props with JSDoc `@param` so intent is clear without type checking.
- Co-locate component-specific helpers; promote to `lib/` only when reused.
- Mobile-first: build the small-screen layout first, then add breakpoints.

**3D (react-three-fiber)**
- The `<Canvas>` is a client component and is never server-rendered.
- Never allocate inside `useFrame` — hoist vectors, matrices, and colors outside the loop and mutate them.
- Reuse geometries and materials; use `useMemo` for anything constructed per render.
- Load models/textures with drei loaders + `<Suspense>`; keep assets in `public/`.
- Dispose of anything created manually; prefer declarative JSX over imperative `scene.add`.

**Web3**
- All contract reads/writes go through `src/services/contract.js` — never instantiate `new ethers.Contract` inside a component.
- ABIs and addresses live in `src/data/` keyed by chain id — never inline in a component.
- Always handle the three failure paths: no wallet, wrong network, user-rejected transaction.
- Treat every chain value as `bigint`; format for display only at the edge, never in state.
- Never generate, store, or ask for a private key or seed phrase.

**Styling**
- Tailwind utility classes. No inline `style={}` except for genuinely dynamic values.
- Extract repeated class strings into a component, not a global CSS class.

**JavaScript**
- ES modules only (`import`/`export`) — no `require`. `const`/`let`, never `var`.
- 2-space indentation.
- No compiler safety net: guard against undefined/null before access; keep functions small and predictable.
- JSDoc on non-trivial functions to document inputs/outputs.

**Data / API**
- All HTTP calls go through `src/services/api.js` — never call `fetch` directly in components.
- Content and constants live in `src/data/` — never hardcoded into JSX.

## Git Conventions

- Conventional commits: `feat:`, `fix:`, `chore:`, `style:`, `refactor:`, `docs:`, `test:`.
- Small, focused commits — one logical change each.
- Never commit `.env*`, `node_modules`, `.next`, or `.claude/settings.local.json`.

## Do / Don't

**Do**
- Ask before adding a new dependency.
- Match the existing pattern in neighboring files before introducing a new one.
- Run lint + test + build before declaring work complete.

**Don't**
- Don't add TypeScript — this is a JavaScript project by choice.
- Don't introduce a new styling system or state library without asking.
- Don't send a transaction against mainnet, or run a deploy, without asking.
- Don't leave `console.log` or commented-out code in committed files.
