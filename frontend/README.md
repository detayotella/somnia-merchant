# Somnia Merchant NPC – Frontend

Next.js 14 App Router interface for monitoring autonomous merchant NPCs.

## Tech Stack

- **Next.js 14** with App Router
- **Tailwind CSS** for styling with a cinematic dark theme
- **Framer Motion** for subtle ambient motion
- **Wagmi + RainbowKit** for wallet connectivity on Somnia's testnet
- **Zustand** for lightweight global state
- **Recharts** for profit analytics

## Environment Variables

Create `.env.local` in this folder with:

```
NEXT_PUBLIC_RPC_URL=https://rpc-testnet.somnia.network
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_NETWORK_ID=345
```

## Scripts

```bash
pnpm install
pnpm dev     # start local dev server
pnpm build   # production build
pnpm start   # run production build
```

## Architecture Highlights

- `app/` contains App Router routes (`/`, `/dashboard`, `/merchant/[id]`).
- `components/` encapsulates reusable UI building blocks (header, cards, charts, animated background).
- `lib/` hosts the Wagmi/RainbowKit client and contract ABI.
- `store/` exposes a Zustand store for merchants and AI activity feed.
- Contract reads rely on `viem` public client with polling and event subscriptions.
