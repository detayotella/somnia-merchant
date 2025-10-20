# Quick Deployment Reference

## 🚀 Deploy Frontend to Vercel (5 minutes)

### Method 1: Vercel Dashboard (Easiest)
1. Visit: https://vercel.com/new
2. Import GitHub repo: `somnia-merchant`
3. Root Directory: **`frontend`**
4. Add env vars (see below)
5. Click Deploy ✅

### Method 2: Vercel CLI
```bash
npm install -g vercel
cd frontend
vercel
```

### Required Environment Variables
```
NEXT_PUBLIC_CONTRACT_ADDRESS = 0xc9ec0e2eA1a44928b1d5AA3D0e117569CC1e756b
NEXT_PUBLIC_FACTORY_ADDRESS = 0xA59c20a794D389Fac2788cB1e41D185093443D36
NEXT_PUBLIC_RPC_URL = https://dream-rpc.somnia.network/
NEXT_PUBLIC_NETWORK_ID = 50312
NEXT_PUBLIC_WALLETCONNECT_ID = [Get from https://cloud.walletconnect.com/]
```

---

## 🤖 Run AI Agent

### Local (Testing)
```bash
cd ai_agent
source venv/bin/activate
python agent.py
```

### Railway (Production)
1. Visit: https://railway.app/new
2. Deploy from GitHub
3. Root: `ai_agent`
4. Start: `python agent.py`
5. Add env vars:
   - `AI_AGENT_PRIVATE_KEY`
   - `GOOGLE_API_KEY`

### Render (Alternative)
1. Visit: https://render.com
2. New Web Service → Connect GitHub
3. Root: `ai_agent`
4. Build: `pip install -r requirements.txt`
5. Start: `python agent.py`
6. Add env vars

---

## 🔑 Get API Keys

### WalletConnect (Required for Frontend)
1. Visit: https://cloud.walletconnect.com/
2. Create project
3. Copy Project ID

### Google Gemini (Required for AI Agent)
1. Visit: https://aistudio.google.com/app/apikey
2. Create API Key
3. Copy key to agent `.env`

---

## ✅ Verification

**Frontend:**
- Visit your Vercel URL
- Connect wallet
- Test merchant creation

**AI Agent:**
- Check logs for "Connected to blockchain"
- Wait 5 minutes for first decision cycle
- Verify transactions on explorer

---

## 📚 Full Guide
See **DEPLOYMENT_GUIDE.md** for detailed instructions and troubleshooting.

---

## 🆘 Quick Fixes

**Frontend build fails:**
```bash
cd frontend
rm -rf .next node_modules
pnpm install
pnpm build
```

**Agent won't start:**
```bash
cd ai_agent
pip install -r requirements.txt
python agent.py
```

**Transactions failing:**
- Check wallet balance (need ~0.5 ETH)
- Verify gas limits in agent code
- Check contract addresses

---

## 📞 Support

Issues? Check:
1. Vercel deployment logs
2. Agent terminal output
3. Browser console (F12)
4. DEPLOYMENT_GUIDE.md

---

**Total deployment time: ~10 minutes** 🚀
