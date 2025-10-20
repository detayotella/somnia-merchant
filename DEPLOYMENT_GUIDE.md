# Deployment Guide: Frontend on Vercel & AI Agent

This guide covers deploying the Somnia Merchant NPC frontend to Vercel and running the AI agent.

---

## Part 1: Deploy Frontend to Vercel

### Prerequisites
- GitHub account with this repository
- Vercel account (sign up at https://vercel.com)
- WalletConnect Project ID (get from https://cloud.walletconnect.com/)

### Step 1: Prepare Environment Variables

The frontend needs these environment variables:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xc9ec0e2eA1a44928b1d5AA3D0e117569CC1e756b
NEXT_PUBLIC_FACTORY_ADDRESS=0xA59c20a794D389Fac2788cB1e41D185093443D36
NEXT_PUBLIC_RPC_URL=https://dream-rpc.somnia.network/
NEXT_PUBLIC_NETWORK_ID=50312
NEXT_PUBLIC_WALLETCONNECT_ID=your-walletconnect-project-id-here
```

**Get WalletConnect Project ID:**
1. Go to https://cloud.walletconnect.com/
2. Sign up / Log in
3. Create a new project
4. Copy the Project ID

### Step 2: Deploy to Vercel via GitHub

**Option A: Deploy via Vercel Dashboard (Recommended)**

1. **Push your code to GitHub** (if not already done):
   ```bash
   cd /home/adetayo/somnia_ai_hackathon
   git add .
   git commit -m "prepare for vercel deployment"
   git push origin main
   ```

2. **Go to Vercel:**
   - Visit https://vercel.com/new
   - Click "Import Project"
   - Connect your GitHub account if not already connected
   - Select the `somnia-merchant` repository

3. **Configure Project:**
   - **Framework Preset:** Next.js (should auto-detect)
   - **Root Directory:** `frontend` (IMPORTANT!)
   - **Build Command:** `pnpm install && pnpm build`
   - **Output Directory:** `.next`

4. **Add Environment Variables:**
   Click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS = 0xc9ec0e2eA1a44928b1d5AA3D0e117569CC1e756b
   NEXT_PUBLIC_FACTORY_ADDRESS = 0xA59c20a794D389Fac2788cB1e41D185093443D36
   NEXT_PUBLIC_RPC_URL = https://dream-rpc.somnia.network/
   NEXT_PUBLIC_NETWORK_ID = 50312
   NEXT_PUBLIC_WALLETCONNECT_ID = [your-project-id]
   ```

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your site will be live at `https://your-project.vercel.app`

**Option B: Deploy via Vercel CLI**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd /home/adetayo/somnia_ai_hackathon/frontend
   vercel
   ```

4. **Follow prompts:**
   - Setup and deploy? Yes
   - Which scope? Select your account
   - Link to existing project? No
   - Project name? somnia-merchant-frontend
   - Directory containing code? `./` (current directory)
   - Override settings? Yes
   - Build Command? `pnpm install && pnpm build`
   - Output Directory? `.next`

5. **Add environment variables:**
   ```bash
   vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS
   # Enter: 0xc9ec0e2eA1a44928b1d5AA3D0e117569CC1e756b
   
   vercel env add NEXT_PUBLIC_FACTORY_ADDRESS
   # Enter: 0xA59c20a794D389Fac2788cB1e41D185093443D36
   
   vercel env add NEXT_PUBLIC_RPC_URL
   # Enter: https://dream-rpc.somnia.network/
   
   vercel env add NEXT_PUBLIC_NETWORK_ID
   # Enter: 50312
   
   vercel env add NEXT_PUBLIC_WALLETCONNECT_ID
   # Enter: your-walletconnect-project-id
   ```

6. **Redeploy with environment variables:**
   ```bash
   vercel --prod
   ```

### Step 3: Verify Deployment

1. **Visit your deployment URL**
2. **Test wallet connection:**
   - Click "Connect Wallet"
   - Connect with MetaMask/WalletConnect
   - Verify Somnia testnet is available
   
3. **Test merchant features:**
   - View merchant list
   - Create a merchant
   - Add items
   - Purchase items

---

## Part 2: Run AI Agent

The AI agent **cannot** run on Vercel (it's a long-running process). You need to run it on:
- **Your local machine** (for testing)
- **A VPS/Cloud server** (for production)
- **Railway/Render/Fly.io** (Platform-as-a-Service)

### Option A: Run Locally (Testing)

1. **Navigate to agent directory:**
   ```bash
   cd /home/adetayo/somnia_ai_hackathon/ai_agent
   ```

2. **Ensure environment variables are set:**
   ```bash
   cat .env
   ```
   
   Should contain:
   ```env
   AI_AGENT_PRIVATE_KEY=0x36be4dc1ebaf2835f9759f124ab5196abe0185e759dfe128f1f094bb17fd1062
   GOOGLE_API_KEY=your_actual_google_api_key_here
   ```

3. **Activate virtual environment:**
   ```bash
   source venv/bin/activate
   ```

4. **Run the agent:**
   ```bash
   python agent.py
   ```

5. **Agent will:**
   - Connect to Somnia testnet
   - Discover merchants created by the agent wallet
   - Make decisions every 300 seconds (5 minutes)
   - Execute buy/restock/add_item actions autonomously

6. **Keep running in background (optional):**
   ```bash
   # Using screen
   screen -S ai-agent
   python agent.py
   # Press Ctrl+A then D to detach
   
   # Or using tmux
   tmux new -s ai-agent
   python agent.py
   # Press Ctrl+B then D to detach
   
   # Or using nohup
   nohup python agent.py > agent.log 2>&1 &
   ```

### Option B: Deploy Agent to Railway (Recommended for Production)

Railway is a Platform-as-a-Service that can run long-running processes.

1. **Create Railway account:**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

3. **Login:**
   ```bash
   railway login
   ```

4. **Create project:**
   ```bash
   cd /home/adetayo/somnia_ai_hackathon
   railway init
   ```

5. **Add Procfile for agent:**
   ```bash
   cat > Procfile << 'EOF'
   agent: cd ai_agent && python agent.py
   EOF
   ```

6. **Add runtime.txt:**
   ```bash
   echo "python-3.13" > runtime.txt
   ```

7. **Add environment variables:**
   ```bash
   railway variables set AI_AGENT_PRIVATE_KEY=0x36be4dc1ebaf2835f9759f124ab5196abe0185e759dfe128f1f094bb17fd1062
   railway variables set GOOGLE_API_KEY=your_actual_google_api_key_here
   ```

8. **Deploy:**
   ```bash
   railway up
   ```

9. **Agent will run continuously** on Railway servers

**Alternative: Railway Dashboard Method**
1. Go to https://railway.app/new
2. Select "Deploy from GitHub repo"
3. Choose your `somnia-merchant` repository
4. Set root directory to `ai_agent`
5. Add environment variables in dashboard
6. Set start command: `python agent.py`
7. Deploy

### Option C: Deploy Agent to Render

1. **Create Render account:**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create new Web Service:**
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Select `somnia-merchant`

3. **Configure:**
   - **Name:** somnia-ai-agent
   - **Root Directory:** `ai_agent`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python agent.py`

4. **Add Environment Variables:**
   ```
   AI_AGENT_PRIVATE_KEY = 0x36be4dc1ebaf2835f9759f124ab5196abe0185e759dfe128f1f094bb17fd1062
   GOOGLE_API_KEY = your_actual_google_api_key_here
   ```

5. **Create Web Service**

---

## Part 3: Get Google Gemini API Key

The AI agent needs a valid Gemini API key for LLM-powered decisions.

1. **Go to Google AI Studio:**
   - Visit https://aistudio.google.com/app/apikey

2. **Sign in with Google account**

3. **Create API Key:**
   - Click "Create API Key"
   - Select a project or create new one
   - Copy the API key

4. **Add to agent `.env`:**
   ```bash
   cd /home/adetayo/somnia_ai_hackathon/ai_agent
   nano .env
   ```
   
   Update:
   ```env
   GOOGLE_API_KEY=AIzaSy... (your actual key)
   ```

5. **Restart agent** to use LLM decisions

---

## Part 4: Verify Everything Works

### Frontend Checklist
- [ ] Frontend accessible at Vercel URL
- [ ] Wallet connection works
- [ ] Can view merchants
- [ ] Can create merchants
- [ ] Can add items to merchants
- [ ] Can purchase items
- [ ] Transactions succeed on Somnia testnet

### AI Agent Checklist
- [ ] Agent connects to Somnia RPC
- [ ] Agent discovers merchants from factory
- [ ] Agent makes decisions every 5 minutes
- [ ] Buy transactions execute successfully
- [ ] Merchant inventory updates on-chain
- [ ] Profit tracking works

### Test Complete Flow
1. **Frontend:** Create a new merchant with items
2. **AI Agent:** Wait for agent cycle (max 5 minutes)
3. **Agent:** Should detect the merchant and make decisions
4. **Frontend:** Refresh and verify inventory/profit changes
5. **Explorer:** Check transactions on block explorer

---

## Troubleshooting

### Frontend Issues

**Build fails on Vercel:**
- Check that root directory is set to `frontend`
- Verify all environment variables are set
- Check build logs for specific errors

**Wallet connection fails:**
- Verify WalletConnect Project ID is correct
- Check that Somnia testnet RPC URL is accessible
- Ensure NEXT_PUBLIC_NETWORK_ID is 50312

**Contract calls fail:**
- Verify contract addresses are correct
- Check that wallet is connected to Somnia testnet
- Ensure wallet has testnet tokens

### AI Agent Issues

**Agent won't start:**
```bash
# Check Python version
python --version  # Should be 3.13

# Reinstall dependencies
cd ai_agent
pip install -r requirements.txt

# Check environment variables
cat .env
```

**"API key not valid" error:**
- Get a new Gemini API key from https://aistudio.google.com/app/apikey
- Update `.env` file
- Restart agent

**"Connection refused" to RPC:**
- Check internet connection
- Verify Somnia RPC URL: https://dream-rpc.somnia.network/
- Try increasing timeout in `web3_helpers.py`

**Transactions reverting:**
- Check wallet has sufficient balance (~0.5 ETH)
- Verify gas limits are sufficient (current: 2M for buy)
- Check contract state (inventory, ownership)

**No merchants discovered:**
- Verify agent wallet address matches merchant creator
- Check factory address is correct
- Ensure merchants exist on-chain

---

## Cost Estimates

### Vercel (Frontend)
- **Free tier:** Sufficient for testing/development
- **Hobby:** $20/month for production
- Includes: Unlimited bandwidth, 100 GB-hours compute

### Railway (AI Agent)
- **Free tier:** $5 credit/month
- **Pro:** $20/month
- Estimated cost: ~$10-15/month for agent

### Render (AI Agent Alternative)
- **Free tier:** 750 hours/month
- **Starter:** $7/month
- Good for testing, may sleep after 15 min inactivity

### Google Gemini API
- **Free tier:** 60 requests/minute
- Agent uses ~12 requests/hour (1 per 5 min cycle)
- **Cost:** Free for our usage

---

## Deployment Checklist

- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] Wallet connection tested
- [ ] Contract interactions verified
- [ ] AI agent running (local or cloud)
- [ ] Gemini API key configured
- [ ] Agent making decisions
- [ ] Transactions executing successfully
- [ ] End-to-end flow tested

---

## Support

If you encounter issues:

1. **Check logs:**
   - Vercel: Dashboard → Project → Deployments → View logs
   - Railway: Dashboard → Project → Logs
   - Agent: `tail -f agent.log` or check terminal output

2. **Test locally first:**
   - Run frontend: `cd frontend && pnpm dev`
   - Run agent: `cd ai_agent && python agent.py`
   - Verify everything works before deploying

3. **Common fixes:**
   - Clear browser cache
   - Restart agent
   - Redeploy with updated environment variables
   - Check network connectivity

---

**Ready to deploy!** Follow the steps above and your Somnia Merchant NPC system will be live on Vercel with an autonomous AI agent managing merchants.
