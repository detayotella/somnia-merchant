# 🤖 Somnia Merchant AI Agent - Refactored & LLM-Powered# AI Agent

## OverviewPython agent that monitors on-chain Merchant NPCs and executes basic trading heuristics.

Production-ready, modular AI agent for autonomous merchant management with optional LLM integration (GPT-4/Claude).

## Setup

## Architecture

````bash

```python -m venv .venv

ai_agent/source .venv/bin/activate

├── agent.py              # Main agent orchestrator  pip install -r requirements.txt

├── config.json           # Configuration file```

├── requirements.txt      # Python dependencies

├── api_server.py        # FastAPI status serverCopy `config.json` to the desired environment and export a private key:

├── agent_status.json    # Runtime status (auto-generated)

├── utils/```bash

│   ├── __init__.pyexport AI_AGENT_PRIVATE_KEY=0x...

│   ├── web3_helpers.py       # Blockchain interaction layerpython agent.py

│   ├── decision_engine.py    # LLM-powered decision making```

│   ├── logger.py             # Structured logging

│   └── notifier.py           # Backend API notificationsKeep `config.json` in sync with the deployed contract. The Forge deploy script rewrites this file automatically after each successful broadcast.

└── logs/                     # Log files (auto-created)
    ├── agent_YYYY-MM-DD.log
    └── decisions_YYYY-MM-DD.log
````

## Quick Start

```bash
# 1. Setup environment
cd ai_agent
source venv/bin/activate

# 2. Configure .env
echo "AI_AGENT_PRIVATE_KEY=your_key_here" > .env

# 3. Run agent (heuristic mode)
venv/bin/python agent.py

# 4. Run API server (separate terminal)
venv/bin/python api_server.py
```

Visit `http://localhost:3000/console` to see the AI agent brain in action!

## Configuration

Edit `config.json`:

```json
{
  "use_llm": false, // Enable GPT-4/Claude
  "model": "gpt-4-turbo", // or "claude-3-5-sonnet-20241022"
  "min_profit_threshold": 0.2,
  "poll_interval_seconds": 30
}
```

## LLM Integration

To enable AI reasoning:

1. Get API key from OpenAI or Anthropic
2. Add to `.env`:
   ```bash
   OPENAI_API_KEY=sk-...
   # OR
   ANTHROPIC_API_KEY=sk-...
   ```
3. Set in `config.json`:
   ```json
   {
     "use_llm": true,
     "model": "gpt-4-turbo"
   }
   ```

The agent will now use LLM to make intelligent trading decisions with reasoning!

## See Full Documentation

Refer to project root `AI_AGENT_INTEGRATION.md` for complete setup guide.
