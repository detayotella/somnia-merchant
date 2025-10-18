# 🤖 Somnia Autonomous Merchant

> AI-powered autonomous merchant NPCs on Somnia blockchain using Google Gemini and smart contracts

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.27-blue)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.13-blue)](https://python.org/)

An end-to-end autonomous trading system combining **AI decision-making** with **blockchain smart contracts** on Somnia testnet. Merchants are represented as ERC-721 NFTs that autonomously manage inventory and profits using Google Gemini AI.

## ✨ Features

- 🤖 **AI-Powered Decisions** - Google Gemini makes intelligent trading decisions
- ⛓️ **Smart Contract NFTs** - Each merchant is an ERC-721 NFT with on-chain inventory
- 💰 **Autonomous Trading** - Auto-manages stock, pricing, and profit withdrawals
- 🎨 **Real-time Dashboard** - Beautiful Next.js UI with live updates
- 🔐 **Non-custodial** - Merchants owned by users, controlled by AI agents

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend      │◄────►│   Smart Contract │◄────►│   AI Agent      │
│   (Next.js)     │      │   (Solidity)     │      │   (Python)      │
│                 │      │                  │      │                 │
│ • Dashboard     │      │ • MerchantNPC    │      │ • Gemini AI     │
│ • RainbowKit    │      │ • ERC-721        │      │ • web3.py       │
│ • Real-time UI  │      │ • Inventory      │      │ • Auto-trading  │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                        │                         │
         └────────────────────────┴─────────────────────────┘
                         Somnia Testnet
```

## 📁 Project Structure

```
somnia-merchant/
├── contracts/          # Smart contracts (Foundry)
│   ├── src/
│   │   └── MerchantNPC.sol    # ERC-721 merchant contract
│   ├── script/
│   ├── test/
│   └── foundry.toml
├── ai_agent/          # Python AI agent
│   ├── agent.py                # Main agent loop
│   ├── api_server.py          # FastAPI status server
│   ├── utils/
│   │   ├── decision_engine.py # Gemini AI integration
│   │   ├── web3_helpers.py    # Blockchain interactions
│   │   └── notifier.py        # Event logging
│   ├── config.json            # Agent configuration
│   └── requirements.txt
├── frontend/          # Next.js dashboard
│   ├── app/
│   │   ├── console/           # Main dashboard
│   │   └── merchant/[id]/     # Merchant details
│   ├── components/
│   ├── lib/
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.13+
- Foundry
- Somnia testnet tokens

### 1. Clone & Setup

```bash
git clone https://github.com/detayotella/somnia-merchant.git
cd somnia-merchant
```

### 2. Deploy Contract

```bash
cd contracts
forge install
forge build

# Deploy to Somnia
forge create src/MerchantNPC.sol:MerchantNPC \
  --rpc-url https://dream-rpc.somnia.network/ \
  --private-key YOUR_KEY \
  --legacy
```

### 3. Configure Agent

```bash
cd ai_agent
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy and edit .env
cp .env.example .env
# Add: AI_AGENT_PRIVATE_KEY and GOOGLE_API_KEY
```

### 4. Run Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with contract address
npm run dev
```

Visit http://localhost:3000/console 🎉

## 🔧 Key Technologies

- **Blockchain**: Somnia Testnet
- **Smart Contracts**: Solidity 0.8.27, OpenZeppelin v4.9.6
- **AI**: Google Gemini 2.0 Flash
- **Backend**: Python 3.13, web3.py, FastAPI
- **Frontend**: Next.js 14, RainbowKit, Tailwind CSS

## 📄 License

MIT

---

**Built for Somnia AI Hackathon** ⭐
