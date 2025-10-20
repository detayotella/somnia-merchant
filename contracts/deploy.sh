#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Somnia Merchant NPC Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Load environment variables
source ../ai_agent/.env

# Network configuration
RPC_URL="https://dream-rpc.somnia.network/"
CHAIN_ID="50312"
GAS_PRICE="6000000000" # 6 gwei
GAS_LIMIT_IMPL="20000000"
GAS_LIMIT_FACTORY="10000000"

echo -e "${YELLOW}Network:${NC} Somnia Testnet"
echo -e "${YELLOW}RPC URL:${NC} $RPC_URL"
echo -e "${YELLOW}Chain ID:${NC} $CHAIN_ID"
echo -e "${YELLOW}Deployer:${NC} $(cast wallet address --private-key $AI_AGENT_PRIVATE_KEY)"
echo -e "${YELLOW}Balance:${NC} $(cast balance $(cast wallet address --private-key $AI_AGENT_PRIVATE_KEY) --rpc-url $RPC_URL) wei\n"

# Step 1: Get MerchantNPC bytecode
echo -e "${YELLOW}Step 1: Compiling MerchantNPC...${NC}"
forge build --silent

IMPL_BYTECODE=$(forge inspect src/MerchantNPC.sol:MerchantNPC bytecode)
IMPL_SIZE=${#IMPL_BYTECODE}

echo -e "${GREEN}✓ MerchantNPC bytecode compiled${NC}"
echo -e "  Bytecode size: $((IMPL_SIZE / 2)) bytes\n"

# Step 2: Deploy MerchantNPC Implementation
echo -e "${YELLOW}Step 2: Deploying MerchantNPC implementation...${NC}"

IMPL_TX=$(cast send \
    --rpc-url $RPC_URL \
    --private-key $AI_AGENT_PRIVATE_KEY \
    --legacy \
    --gas-limit $GAS_LIMIT_IMPL \
    --gas-price $GAS_PRICE \
    --create $IMPL_BYTECODE \
    --json)

IMPL_STATUS=$(echo $IMPL_TX | jq -r '.status')
IMPL_ADDRESS=$(echo $IMPL_TX | jq -r '.contractAddress')
IMPL_TX_HASH=$(echo $IMPL_TX | jq -r '.transactionHash')
IMPL_GAS_USED=$(echo $IMPL_TX | jq -r '.gasUsed')

if [ "$IMPL_STATUS" = "0x1" ] || [ "$IMPL_STATUS" = "1" ]; then
    echo -e "${GREEN}✓ MerchantNPC deployed successfully!${NC}"
    echo -e "  Address: ${GREEN}$IMPL_ADDRESS${NC}"
    echo -e "  TX Hash: $IMPL_TX_HASH"
    echo -e "  Gas Used: $IMPL_GAS_USED\n"
else
    echo -e "${RED}✗ MerchantNPC deployment failed!${NC}"
    echo -e "  TX Hash: $IMPL_TX_HASH"
    echo -e "  Status: $IMPL_STATUS"
    exit 1
fi

# Verify implementation has code
sleep 2
IMPL_CODE=$(cast code $IMPL_ADDRESS --rpc-url $RPC_URL)
if [ ${#IMPL_CODE} -lt 10 ]; then
    echo -e "${RED}✗ Implementation has no code!${NC}"
    exit 1
fi

# Step 3: Deploy MerchantFactoryV2
echo -e "${YELLOW}Step 3: Deploying MerchantFactoryV2...${NC}"

FACTORY_BYTECODE=$(forge inspect src/MerchantFactoryV2.sol:MerchantFactoryV2 bytecode)
FACTORY_SIZE=${#FACTORY_BYTECODE}

echo -e "${GREEN}✓ MerchantFactoryV2 bytecode compiled${NC}"
echo -e "  Bytecode size: $((FACTORY_SIZE / 2)) bytes"

# Encode constructor arguments
CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address)" "$IMPL_ADDRESS")
# Remove 0x prefix from constructor args
CONSTRUCTOR_ARGS=${CONSTRUCTOR_ARGS:2}

# Combine bytecode with constructor arguments
FACTORY_DEPLOYMENT_DATA="${FACTORY_BYTECODE}${CONSTRUCTOR_ARGS}"

echo -e "${YELLOW}Deploying factory with implementation: $IMPL_ADDRESS${NC}\n"

FACTORY_TX=$(cast send \
    --rpc-url $RPC_URL \
    --private-key $AI_AGENT_PRIVATE_KEY \
    --legacy \
    --gas-limit $GAS_LIMIT_FACTORY \
    --gas-price $GAS_PRICE \
    --create $FACTORY_DEPLOYMENT_DATA \
    --json)

FACTORY_STATUS=$(echo $FACTORY_TX | jq -r '.status')
FACTORY_ADDRESS=$(echo $FACTORY_TX | jq -r '.contractAddress')
FACTORY_TX_HASH=$(echo $FACTORY_TX | jq -r '.transactionHash')
FACTORY_GAS_USED=$(echo $FACTORY_TX | jq -r '.gasUsed')

if [ "$FACTORY_STATUS" = "0x1" ] || [ "$FACTORY_STATUS" = "1" ]; then
    echo -e "${GREEN}✓ MerchantFactoryV2 deployed successfully!${NC}"
    echo -e "  Address: ${GREEN}$FACTORY_ADDRESS${NC}"
    echo -e "  TX Hash: $FACTORY_TX_HASH"
    echo -e "  Gas Used: $FACTORY_GAS_USED\n"
else
    echo -e "${RED}✗ MerchantFactoryV2 deployment failed!${NC}"
    echo -e "  TX Hash: $FACTORY_TX_HASH"
    echo -e "  Status: $FACTORY_STATUS"
    
    # Get revert reason if available
    echo -e "\n${YELLOW}Fetching transaction receipt...${NC}"
    cast receipt $FACTORY_TX_HASH --rpc-url $RPC_URL
    exit 1
fi

# Verify factory has code
sleep 2
FACTORY_CODE=$(cast code $FACTORY_ADDRESS --rpc-url $RPC_URL)
if [ ${#FACTORY_CODE} -lt 10 ]; then
    echo -e "${RED}✗ Factory has no code!${NC}"
    exit 1
fi

# Step 4: Update configuration files
echo -e "${YELLOW}Step 4: Updating configuration files...${NC}"

# Update frontend constants
FRONTEND_CONSTANTS="../frontend/lib/constants.ts"
if [ -f "$FRONTEND_CONSTANTS" ]; then
    sed -i "s/export const CONTRACT_ADDRESS = .*/export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? \"$FACTORY_ADDRESS\") as \`0x\${string}\`;/" $FRONTEND_CONSTANTS
    sed -i "s/export const FACTORY_ADDRESS = .*/export const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? \"$FACTORY_ADDRESS\") as \`0x\${string}\`;/" $FRONTEND_CONSTANTS
    echo -e "${GREEN}✓ Updated frontend constants${NC}"
fi

# Update AI agent .env
AI_AGENT_ENV="../ai_agent/.env"
if [ -f "$AI_AGENT_ENV" ]; then
    sed -i "s/FACTORY_ADDRESS=.*/FACTORY_ADDRESS=$FACTORY_ADDRESS/" $AI_AGENT_ENV
    echo -e "${GREEN}✓ Updated AI agent config${NC}"
fi

# Create deployment info file
cat > deployment-info.json << EOF
{
  "network": "Somnia Testnet",
  "chainId": $CHAIN_ID,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployer": "$(cast wallet address --private-key $AI_AGENT_PRIVATE_KEY)",
  "contracts": {
    "MerchantNPC": {
      "address": "$IMPL_ADDRESS",
      "txHash": "$IMPL_TX_HASH",
      "gasUsed": "$IMPL_GAS_USED"
    },
    "MerchantFactoryV2": {
      "address": "$FACTORY_ADDRESS",
      "txHash": "$FACTORY_TX_HASH",
      "gasUsed": "$FACTORY_GAS_USED"
    }
  }
}
EOF

echo -e "${GREEN}✓ Created deployment-info.json${NC}\n"

# Final summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}     DEPLOYMENT SUCCESSFUL! 🎉${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}Deployed Contracts:${NC}"
echo -e "  MerchantNPC Implementation: ${GREEN}$IMPL_ADDRESS${NC}"
echo -e "  MerchantFactoryV2:          ${GREEN}$FACTORY_ADDRESS${NC}\n"

echo -e "${YELLOW}Explorer Links:${NC}"
echo -e "  Implementation: https://explorer.somnia.network/address/$IMPL_ADDRESS"
echo -e "  Factory:        https://explorer.somnia.network/address/$FACTORY_ADDRESS\n"

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Verify contracts on explorer"
echo -e "  2. Test merchant creation via frontend"
echo -e "  3. Start AI agent with: cd ../ai_agent && npm start\n"
