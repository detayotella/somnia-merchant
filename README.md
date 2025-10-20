# Somnia Autonomous Merchant

AI-powered autonomous merchant NPCs on Somnia testnet combining smart contracts and AI.

---

## Quick summary

- V2 contracts (initializable pattern) are deployed on Somnia testnet and integrated with the frontend and AI agent.
- Frontend: Next.js 14 (App Router), wagmi/viem, Tailwind.
- AI agent: Python + Gemini (optional — requires API keys).

### Key V2 addresses

- MerchantFactoryCoreV2: `0xA59c20a794D389Fac2788cB1e41D185093443D36`
- MerchantNPCCoreV2: `0xc9ec0e2eA1a44928b1d5AA3D0e117569CC1e756b`

Network: Somnia Testnet (chainId: 50312)
RPC: https://dream-rpc.somnia.network/

---

## Getting started (local dev)

Prereqs: Node 18+, pnpm/npm, Python 3.13+, Foundry (forge)

1. Clone repo

```bash
git clone https://github.com/detayotella/somnia-merchant.git
cd somnia-merchant
```

2. Smart contracts (optional — artifacts included)

```bash
cd contracts
forge install
forge build
```

Extract ABI for frontend (if you rebuild contracts):

```bash
# after forge build
cat out/MerchantFactoryCoreV2.sol/MerchantFactoryCoreV2.json | jq '.abi' > ../frontend/src/contracts/MerchantFactoryCoreV2.json
cat out/MerchantNPCCoreV2.sol/MerchantNPCCoreV2.json | jq '.abi' > ../frontend/src/contracts/MerchantNPCCoreV2.json
```

3. AI agent (optional)

```bash
cd ai_agent
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# create ai_agent/.env with your keys
python agent.py
```

4. Frontend

```bash
cd frontend
pnpm install
cp .env.example .env.local  # or create .env.local w/ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
pnpm dev
```

Visit http://localhost:3000

---

## Git & push checklist

Before pushing to GitHub, ensure:

1. Secrets and env files are ignored (see `.gitignore`).
2. Only `README.md` is tracked among markdown docs; other `.md` files are ignored.
3. Build artifacts (`frontend/.next`, `contracts/out`) and `node_modules` are ignored.

Recommended commit/push flow:

```bash
git checkout -b my-changes
git add -A
git commit -m "chore: prepare repo for publish — update .gitignore and README"
git push origin my-changes
# then open a PR
```

To preview what will be pushed:

```bash
git status --short
git ls-files --others --exclude-standard
```

---

## Notes & dev tips

- If you accidentally committed a secret, rotate credentials and remove the file from history with `git filter-repo` or `BFG Repo-Cleaner`.
- To ensure ABIs are valid JSON, extract them from `out/` artifacts (see commands above) — `forge inspect` can print human-formatted tables which are not valid JSON.

---

If you want, I can:

1. Run `git status` and show which files would be committed.
2. Stage and create a commit for the `.gitignore` and `README.md` updates.
3. Push the branch to GitHub (I won't push without your confirmation).

