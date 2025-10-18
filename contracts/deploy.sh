#!/bin/bash

# Somnia Merchant NPC Deployment Script
# This script helps you deploy the contract and configure the application

set -e

echo "==================================="
echo "Somnia Merchant NPC Deployment"
echo "==================================="
echo ""

# Check if we're in the contracts directory
if [ ! -f "foundry.toml" ]; then
    echo "❌ Error: Please run this script from the contracts directory"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "📝 Please edit contracts/.env and add:"
    echo "   - PRIVATE_KEY: Your wallet's private key"
    echo "   - MERCHANT_OWNER: Your wallet address"
    echo "   - SOMNIA_RPC_URL: https://dream-rpc.somnia.network/"
    echo ""
    echo "Then run this script again."
    exit 0
fi

# Source the .env file
source .env

# Check if required variables are set
if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" == "your-private-key-here" ]; then
    echo "❌ Error: PRIVATE_KEY not set in .env"
    echo "Please edit contracts/.env and add your private key"
    exit 1
fi

if [ -z "$MERCHANT_OWNER" ] || [ "$MERCHANT_OWNER" == "your-wallet-address-here" ]; then
    echo "❌ Error: MERCHANT_OWNER not set in .env"
    echo "Please edit contracts/.env and add your wallet address"
    exit 1
fi

echo "🔍 Checking RPC connection..."
CHAIN_ID=$(curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
    $SOMNIA_RPC_URL | grep -o '"result":"0x[^"]*"' | cut -d'"' -f4)

if [ -z "$CHAIN_ID" ]; then
    echo "❌ Error: Cannot connect to Somnia RPC"
    echo "RPC URL: $SOMNIA_RPC_URL"
    exit 1
fi

CHAIN_ID_DEC=$((16#${CHAIN_ID:2}))
echo "✅ Connected to Somnia (Chain ID: $CHAIN_ID_DEC)"
echo ""

echo "🔨 Compiling contracts..."
forge build
echo "✅ Contracts compiled"
echo ""

echo "🚀 Deploying MerchantNPC contract..."
echo "   - RPC: $SOMNIA_RPC_URL"
echo "   - Owner: $MERCHANT_OWNER"
echo ""

# Deploy the contract
DEPLOY_OUTPUT=$(forge script script/Deploy.s.sol \
    --rpc-url $SOMNIA_RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    -vvv 2>&1)

echo "$DEPLOY_OUTPUT"

# Extract contract address from output
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -o "Contract deployed at: 0x[a-fA-F0-9]*" | grep -o "0x[a-fA-F0-9]*" || echo "")

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "⚠️  Could not extract contract address from deployment output"
    echo "Please check the output above for the deployed contract address"
    echo ""
    echo "📝 Next steps:"
    echo "1. Find the contract address in the output above"
    echo "2. Update frontend/.env.local with the contract address"
    echo "3. Restart the frontend dev server"
    exit 0
fi

echo ""
echo "✅ Deployment successful!"
echo "📝 Contract Address: $CONTRACT_ADDRESS"
echo ""

# Update frontend .env.local
FRONTEND_ENV="../frontend/.env.local"
if [ -f "$FRONTEND_ENV" ]; then
    echo "🔄 Updating frontend configuration..."
    sed -i "s|NEXT_PUBLIC_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_CONTRACT_ADDRESS=$CONTRACT_ADDRESS|g" "$FRONTEND_ENV"
    echo "✅ Updated $FRONTEND_ENV"
else
    echo "⚠️  Frontend .env.local not found at $FRONTEND_ENV"
    echo "Please manually create it and add:"
    echo "NEXT_PUBLIC_CONTRACT_ADDRESS=$CONTRACT_ADDRESS"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Summary:"
echo "   - Contract: $CONTRACT_ADDRESS"
echo "   - Chain ID: $CHAIN_ID_DEC"
echo "   - RPC: $SOMNIA_RPC_URL"
echo ""
echo "🚀 Next steps:"
echo "1. Restart your frontend dev server: cd ../frontend && pnpm dev"
echo "2. (Optional) Run the AI agent: cd ../ai_agent && python agent.py"
echo ""
