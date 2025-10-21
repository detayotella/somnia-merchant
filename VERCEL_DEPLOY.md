# Vercel Deployment Instructions

## Quick Fix for Current Error

The error you're seeing (`pnpm install` failing) is because Vercel needs to be configured to:
1. Use the `frontend` directory as the root
2. Use npm (not pnpm)

### Steps to Fix:

1. **Go to your Vercel project dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Click on your `somnia-merchant` project

2. **Update Project Settings**
   - Click on "Settings" tab
   - Scroll to "Build & Development Settings"
   - Find **"Root Directory"**
   - Click "Edit"
   - Enter: `frontend`
   - Click "Save"

3. **Verify Build Commands** (should auto-detect from vercel.json)
   - Install Command: `npm install --legacy-peer-deps`
   - Build Command: `npm run build`
   - Output Directory: `.next` (auto-detected)

4. **Redeploy**
   - Go to "Deployments" tab
   - Click "Redeploy" on the latest deployment
   - OR push a new commit to trigger auto-deploy

## Environment Variables

Don't forget to add these in Vercel dashboard under "Environment Variables":

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x6937F70036E499f56E819eb25658514D7d62C2F6
NEXT_PUBLIC_RPC_URL=https://dream-rpc.somnia.network/
NEXT_PUBLIC_NETWORK_ID=50312
NEXT_PUBLIC_WALLETCONNECT_ID=fa46a1de595c7f7d3d4d78aa3906acc9
```

## Success Criteria

Once deployed successfully, you should see:
- ✅ Build completes without errors
- ✅ Deployment URL is live
- ✅ Next.js app loads correctly
- ✅ Wallet connection works with Somnia testnet

## Troubleshooting

If you still see pnpm errors:
1. Clear Vercel build cache (Settings → Clear Cache)
2. Make sure Root Directory is set to `frontend`
3. Redeploy from scratch

If you need help, check the build logs for specific errors.
