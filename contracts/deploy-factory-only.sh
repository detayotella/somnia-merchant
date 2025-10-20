#!/bin/bash

source ../ai_agent/.env

echo "Deploying MerchantFactoryV2..."
echo "Implementation: 0x6bc0Ab5E25D5E015D76528B798Eb87FBdCC232E8"

# Get factory bytecode
FACTORY_BYTECODE=$(forge inspect src/MerchantFactoryV2.sol:MerchantFactoryV2 bytecode)

# Encode constructor with implementation address
CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address)" "0x6bc0Ab5E25D5E015D76528B798Eb87FBdCC232E8")
CONSTRUCTOR_ARGS=${CONSTRUCTOR_ARGS:2}

# Combine
DEPLOYMENT_DATA="${FACTORY_BYTECODE}${CONSTRUCTOR_ARGS}"

echo "Bytecode size: $((${#DEPLOYMENT_DATA} / 2)) bytes"
echo "Deploying..."

# Deploy
cast send \
    --rpc-url https://dream-rpc.somnia.network/ \
    --private-key $AI_AGENT_PRIVATE_KEY \
    --legacy \
    --gas-limit 10000000 \
    --gas-price 6000000000 \
    --create $DEPLOYMENT_DATA
