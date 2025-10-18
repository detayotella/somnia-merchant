# MerchantFactory Deployment Guide

## Overview
The MerchantFactory contract enables deploying multiple autonomous merchant NPCs from a single factory contract.

## Contract Information

### MerchantFactory.sol
- **Purpose**: Deploy and manage multiple MerchantNPC instances
- **Network**: Somnia Testnet (Chain ID: 50312)
- **Status**: ✅ Compiled, ✅ Tested (17/17 passing)
- **Deployment Status**: ⏳ Pending (needs wallet funding)

### Key Features
1. **Create Merchant with Inventory**: One-step deployment that creates merchant + initial item
2. **Ownership Tracking**: Maps merchants to owners and AI agents
3. **Global Registry**: Maintains list of all deployed merchants
4. **AI Agent Registration**: Owners can assign AI agents to their merchants

### Function Signatures

```solidity
function createMerchant(
    string memory merchantName,
    string memory itemName,
    uint256 initialStock,
    uint256 itemPrice
) external returns (address merchantAddress, uint256 tokenId)
```

**Parameters:**
- `merchantName`: Name for the merchant (1-32 chars)
- `itemName`: Name of the first inventory item
- `initialStock`: Initial quantity (minimum: 1)
- `itemPrice`: Price per item in wei (minimum: 0.001 STT = 1e15 wei)

**Returns:**
- `merchantAddress`: Address of the deployed MerchantNPC contract
- `tokenId`: NFT token ID representing merchant ownership

```solidity
function registerAIAgent(address merchantAddress, address aiAgent) external
```

**Requirements:**
- Only merchant owner can call
- Sets the AI agent that will manage the merchant

### View Functions

```solidity
function getAllMerchants() external view returns (address[] memory)
function getMerchantsByOwner(address owner) external view returns (address[] memory)
function getMerchantCount(address owner) external view returns (uint256)
function getMerchantDetails(address merchantAddress) external view returns (address owner, address aiAgent, bool isActive)
function isMerchant(address merchantAddress) external view returns (bool)
```

## Deployment Steps

### Prerequisites
1. Agent wallet with sufficient STT balance
2. Foundry toolchain installed
3. Private key set in `.env` file

### Step 1: Check Wallet Balance

```bash
cd contracts
cast balance 0x2331B698eeE9bEaE834B06B6bDCb2DF94c9a01A3 --rpc-url https://dream-rpc.somnia.network/
```

Current balance: `0.42 STT` (insufficient for large contract deployment)

**Note**: MerchantFactory is a large contract (~28KB) due to:
- MerchantNPC contract bytecode embedded (for deployment)
- Full OpenZeppelin dependencies
- Complete ERC721 + enumerable extensions

**Required balance**: ~0.5-1 STT (estimated)

### Step 2: Get Testnet Tokens

**Option 1**: Somnia Testnet Faucet
- Visit: https://somnia.network/faucet (if available)
- Request tokens for: `0x2331B698eeE9bEaE834B06B6bDCb2DF94c9a01A3`

**Option 2**: Request from Team
- Contact Somnia team in Discord/Telegram
- Provide wallet address: `0x2331B698eeE9bEaE834B06B6bDCb2DF94c9a01A3`

### Step 3: Deploy Factory Contract

```bash
cd contracts

# Deploy with broadcast
forge create src/MerchantFactory.sol:MerchantFactory \
  --rpc-url https://dream-rpc.somnia.network/ \
  --private-key $AI_AGENT_PRIVATE_KEY \
  --broadcast \
  --legacy

# Save the deployed address from output
```

Expected output:
```
Deployer: 0x2331B698eeE9bEaE834B06B6bDCb2DF94c9a01A3
Deployed to: 0x... (SAVE THIS ADDRESS)
Transaction hash: 0x...
```

### Step 4: Update Configuration

Update `ai_agent/config.json`:
```json
{
  "contract_address": "0x6937F70036E499f56E819eb25658514D7d62C2F6",
  "factory_address": "0x...(NEW_FACTORY_ADDRESS)",
  "use_factory": true,
  "rpc_url": "https://dream-rpc.somnia.network/",
  "poll_interval_seconds": 30,
  "use_llm": true,
  "model": "gemini-2.0-flash"
}
```

Update `frontend/.env`:
```bash
NEXT_PUBLIC_FACTORY_ADDRESS=0x...(NEW_FACTORY_ADDRESS)
```

### Step 5: Test Factory Deployment

```bash
# Get all merchants (should be empty initially)
cast call $FACTORY_ADDRESS "getAllMerchants()(address[])" \
  --rpc-url https://dream-rpc.somnia.network/

# Get factory owner
cast call $FACTORY_ADDRESS "owner()(address)" \
  --rpc-url https://dream-rpc.somnia.network/
```

## Using the Factory

### Create a New Merchant (from Frontend or CLI)

**Via Cast:**
```bash
cast send $FACTORY_ADDRESS \
  "createMerchant(string,string,uint256,uint256)(address,uint256)" \
  "Wizard's Shop" "Magic Scroll" 5 100000000000000000 \
  --rpc-url https://dream-rpc.somnia.network/ \
  --private-key $YOUR_PRIVATE_KEY
```

This creates:
- New MerchantNPC contract deployed
- Merchant NFT minted to you
- "Magic Scroll" item added (5 qty @ 0.1 STT)

**Via Frontend:**
- User clicks "Create Merchant" button
- Fills form: Merchant Name, First Item Name, Stock, Price
- Signs transaction with wallet
- Receives merchant NFT

### Register AI Agent

```bash
cast send $MERCHANT_ADDRESS \
  "transferOwnership(address)" \
  $FACTORY_ADDRESS \
  --rpc-url https://dream-rpc.somnia.network/ \
  --private-key $YOUR_PRIVATE_KEY

cast send $FACTORY_ADDRESS \
  "registerAIAgent(address,address)" \
  $MERCHANT_ADDRESS \
  $AI_AGENT_ADDRESS \
  --rpc-url https://dream-rpc.somnia.network/ \
  --private-key $YOUR_PRIVATE_KEY
```

## AI Agent Integration

### AgentManager (Multi-Merchant Support)

Located: `ai_agent/utils/agent_manager.py`

**Features:**
- Discovers all merchants from factory
- Filters merchants assigned to this agent
- Listens for MerchantCreated events
- Runs decision cycles for each managed merchant
- Tracks per-merchant memory and state

**Usage:**
```python
from utils.agent_manager import AgentManager

# Initialize
manager = AgentManager(w3, factory_address, agent_private_key)

# Discover merchants
await manager.discover_merchants()

# Listen for new merchants
await manager.listen_for_new_merchants()

# Run decisions for all managed merchants
await manager.run_decision_cycle(decision_engine)
```

## Frontend Integration

### Create Merchant UI

Add to `frontend/components/CreateMerchant.tsx`:

```typescript
import { useContractWrite } from 'wagmi';
import { FACTORY_ADDRESS, FACTORY_ABI } from '@/lib/constants';

export function CreateMerchant() {
  const { write: createMerchant } = useContractWrite({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'createMerchant',
  });

  const handleCreate = (merchantName, itemName, stock, price) => {
    createMerchant({
      args: [merchantName, itemName, stock, parseEther(price)],
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Display All Merchants

```typescript
const { data: merchants } = useContractRead({
  address: FACTORY_ADDRESS,
  abi: FACTORY_ABI,
  functionName: 'getAllMerchants',
});
```

## Testing

### Run Full Test Suite

```bash
cd contracts
forge test -vv
```

Expected output:
```
Ran 17 tests for test/MerchantFactory.t.sol:MerchantFactoryTest
[PASS] testCreateMerchant (gas: 4629600)
[PASS] testCreateMultipleMerchants (gas: 9178934)
[PASS] testRegisterAIAgent (gas: 4655907)
...
Suite result: ok. 17 passed; 0 failed; 0 skipped
```

### Specific Factory Tests

```bash
forge test --match-contract MerchantFactoryTest -vvv
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│           MerchantFactory Contract              │
│  - Deploy new MerchantNPC instances             │
│  - Track ownership & AI agent assignments       │
│  - Emit MerchantCreated events                  │
└────────────────┬────────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
┌─────────────────┐  ┌─────────────────┐
│  MerchantNPC 1  │  │  MerchantNPC 2  │
│  Owner: Alice   │  │  Owner: Bob     │
│  Agent: 0x233.. │  │  Agent: 0x233.. │
│  Items: 3       │  │  Items: 5       │
└─────────────────┘  └─────────────────┘
         │                │
         └────────┬───────┘
                  ▼
         ┌─────────────────┐
         │  AI Agent       │
         │  AgentManager   │
         │  - Monitor both │
         │  - Make trades  │
         │  - Restock      │
         └─────────────────┘
```

## Troubleshooting

### Deployment Fails: "insufficient balance"
- Get more testnet STT from faucet
- Current balance: 0.42 STT, need ~0.5-1 STT

### Gas Estimation Too High
- Use `--legacy` flag for non-EIP-1559 transactions
- Set manual gas limit: `--gas-limit 15000000`

### Contract Too Large
- Already optimized with Solidity 0.8.27
- Using minimal OpenZeppelin v4.9.6 imports
- Cannot reduce further without breaking functionality

### Event Not Detected
- Check block confirmations: wait 2-3 blocks
- Verify factory address in config
- Check RPC connection

## Next Steps

1. ✅ Deploy MerchantFactory contract (pending wallet funding)
2. ✅ Update configs with factory address
3. ✅ Test merchant creation from CLI
4. ✅ Integrate AgentManager into agent.py
5. ✅ Add frontend UI for merchant creation
6. ✅ Test multi-merchant AI management

## Resources

- **Contract Address** (Single Merchant): `0x6937F70036E499f56E819eb25658514D7d62C2F6`
- **Factory Address**: TBD (awaiting deployment)
- **Agent Wallet**: `0x2331B698eeE9bEaE834B06B6bDCb2DF94c9a01A3`
- **RPC URL**: `https://dream-rpc.somnia.network/`
- **Chain ID**: `50312`
- **Block Explorer**: TBD
