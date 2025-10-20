#!/bin/bash

# Somnia Merchant NPC - Quick Deployment Script
# This script helps you deploy the frontend to Vercel

set -e

echo "=========================================="
echo "Somnia Merchant NPC - Deployment Helper"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "ai_agent" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Pre-deployment Checklist:"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "⚠️  Git repository not initialized. Initializing..."
    git init
    git add .
    git commit -m "Initial commit"
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "⚠️  You have uncommitted changes. Committing them..."
    git add .
    git commit -m "Prepare for deployment"
fi

# Check if remote is set
if ! git remote | grep -q "origin"; then
    echo ""
    echo "❌ No git remote 'origin' found."
    echo "Please add your GitHub repository remote:"
    echo ""
    echo "  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
    echo "  git push -u origin main"
    echo ""
    exit 1
fi

# Push to GitHub
echo ""
echo "📤 Pushing code to GitHub..."
git push origin main || {
    echo "⚠️  Push failed. You may need to pull first or set up authentication."
    echo "Try: git pull origin main --rebase && git push origin main"
}

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "=========================================="
echo "Next Steps for Vercel Deployment:"
echo "=========================================="
echo ""
echo "1. Go to https://vercel.com/new"
echo ""
echo "2. Import your GitHub repository: somnia-merchant"
echo ""
echo "3. Configure the project:"
echo "   - Framework: Next.js"
echo "   - Root Directory: frontend"
echo "   - Build Command: pnpm install && pnpm build"
echo ""
echo "4. Add Environment Variables:"
echo "   NEXT_PUBLIC_CONTRACT_ADDRESS=0xc9ec0e2eA1a44928b1d5AA3D0e117569CC1e756b"
echo "   NEXT_PUBLIC_FACTORY_ADDRESS=0xA59c20a794D389Fac2788cB1e41D185093443D36"
echo "   NEXT_PUBLIC_RPC_URL=https://dream-rpc.somnia.network/"
echo "   NEXT_PUBLIC_NETWORK_ID=50312"
echo "   NEXT_PUBLIC_WALLETCONNECT_ID=[Get from https://cloud.walletconnect.com/]"
echo ""
echo "5. Click 'Deploy' and wait 2-3 minutes"
echo ""
echo "=========================================="
echo "Optional: Deploy via Vercel CLI"
echo "=========================================="
echo ""
echo "1. Install Vercel CLI:"
echo "   npm install -g vercel"
echo ""
echo "2. Login:"
echo "   vercel login"
echo ""
echo "3. Deploy from frontend directory:"
echo "   cd frontend"
echo "   vercel"
echo ""
echo "=========================================="
echo "AI Agent Deployment"
echo "=========================================="
echo ""
echo "The AI agent must run separately on:"
echo "  - Local machine (for testing)"
echo "  - Railway (recommended): https://railway.app"
echo "  - Render: https://render.com"
echo ""
echo "To run locally:"
echo "  cd ai_agent"
echo "  source venv/bin/activate"
echo "  python agent.py"
echo ""
echo "See DEPLOYMENT_GUIDE.md for detailed instructions."
echo ""
echo "✅ Ready to deploy!"
