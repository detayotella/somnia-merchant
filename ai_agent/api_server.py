"""
FastAPI server for AI Agent status monitoring.
Provides real-time status, decision history, and agent health metrics.
"""
from __future__ import annotations

import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from loguru import logger
import time

# Shared state file for agent status
STATUS_FILE = Path(__file__).resolve().parent / "agent_status.json"


class AgentDecision(BaseModel):
    timestamp: str
    action: str
    merchant_id: str  # Changed to str to support factory format "0xAddress:1"
    details: Dict[str, Any]
    reasoning: str


class AgentStatus(BaseModel):
    is_running: bool
    last_poll_time: Optional[str]
    agent_address: str
    wallet_balance_eth: float
    total_decisions_made: int
    recent_decisions: List[AgentDecision]
    merchants_monitored: int
    auto_trading_enabled: bool
    connection_healthy: bool
    uptime_seconds: float


app = FastAPI(title="Somnia Merchant AI Agent API", version="1.0.0")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_agent_status() -> Dict[str, Any]:
    """Load current agent status from shared JSON file."""
    if not STATUS_FILE.exists():
        return {
            "is_running": False,
            "last_poll_time": None,
            "agent_address": "",
            "wallet_balance_eth": 0.0,
            "total_decisions_made": 0,
            "recent_decisions": [],
            "merchants_monitored": 0,
            "auto_trading_enabled": False,
            "connection_healthy": False,
            "uptime_seconds": 0.0,
        }
    with STATUS_FILE.open("r") as f:
        return json.load(f)


@app.get("/")
async def root():
    return {"message": "Somnia Merchant AI Agent API", "status": "online"}


@app.get("/api/agent/status", response_model=AgentStatus)
async def get_agent_status():
    """Get current AI agent status and health metrics."""
    status = load_agent_status()
    return AgentStatus(**status)


@app.get("/api/agent/decisions")
async def get_recent_decisions(limit: int = 20, merchant_address: Optional[str] = None):
    """Get recent AI decisions with reasoning, optionally filtered by merchant."""
    status = load_agent_status()
    decisions = status.get("recent_decisions", [])
    
    # Filter by merchant address if provided
    if merchant_address:
        decisions = [
            d for d in decisions 
            if d.get("merchant_address", "").lower() == merchant_address.lower()
        ]
    
    return {"decisions": decisions[:limit], "total": len(decisions)}


@app.get("/api/agent/metrics")
async def get_agent_metrics():
    """Get detailed agent performance metrics."""
    status = load_agent_status()
    decisions = status.get("recent_decisions", [])
    
    # Calculate metrics
    buy_actions = sum(1 for d in decisions if d.get("action") == "buy")
    restock_actions = sum(1 for d in decisions if d.get("action") == "restock")
    reprice_actions = sum(1 for d in decisions if d.get("action") == "reprice")
    withdraw_actions = sum(1 for d in decisions if d.get("action") == "withdraw")
    
    return {
        "total_decisions": status.get("total_decisions_made", 0),
        "action_breakdown": {
            "buy": buy_actions,
            "restock": restock_actions,
            "reprice": reprice_actions,
            "withdraw": withdraw_actions,
        },
        "uptime_hours": status.get("uptime_seconds", 0) / 3600,
        "avg_decision_interval": status.get("avg_decision_interval_seconds", 0),
    }


@app.get("/api/agent/health")
async def health_check():
    """Simple health check endpoint."""
    status = load_agent_status()
    last_poll = status.get("last_poll_time")
    healthy = False
    if last_poll:
        try:
            last_time = datetime.fromisoformat(last_poll.replace("Z", "+00:00"))
            now = datetime.now(last_time.tzinfo)
            time_diff = (now - last_time).total_seconds()
            healthy = time_diff < 120  # Healthy if polled in last 2 minutes
        except Exception:
            healthy = False
    
    return {
        "healthy": healthy,
        "last_seen": last_poll,
        "connection_healthy": status.get("connection_healthy", False),
    }


@app.get("/api/agent/decisions/stream")
async def stream_decisions(merchant_address: Optional[str] = None):
    """Server-Sent Events stream of AI decisions, optionally filtered by merchant."""
    
    async def event_generator():
        last_decision_count = 0
        
        while True:
            try:
                status = load_agent_status()
                decisions = status.get("recent_decisions", [])
                
                # Filter by merchant if specified
                if merchant_address:
                    decisions = [
                        d for d in decisions 
                        if d.get("merchant_address", "").lower() == merchant_address.lower()
                    ]
                
                # Send new decisions
                if len(decisions) > last_decision_count:
                    for decision in decisions[last_decision_count:]:
                        yield f"data: {json.dumps(decision)}\n\n"
                    last_decision_count = len(decisions)
                
                # Send heartbeat
                yield f"event: heartbeat\ndata: {json.dumps({'timestamp': datetime.now().isoformat()})}\n\n"
                
                await asyncio.sleep(2)  # Poll every 2 seconds
                
            except Exception as e:
                logger.error(f"Error in decision stream: {e}")
                yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"
                await asyncio.sleep(5)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.get("/api/merchants")
async def get_merchants():
    """Get list of all merchants being monitored by the agent."""
    status = load_agent_status()
    decisions = status.get("recent_decisions", [])
    
    # Extract unique merchant addresses from decisions
    merchants = {}
    for decision in decisions:
        addr = decision.get("merchant_address")
        if addr and addr not in merchants:
            merchants[addr] = {
                "address": addr,
                "merchant_id": decision.get("merchant_id"),
                "last_activity": decision.get("timestamp"),
                "decision_count": 1
            }
        elif addr:
            merchants[addr]["decision_count"] += 1
            merchants[addr]["last_activity"] = decision.get("timestamp")
    
    return {
        "merchants": list(merchants.values()),
        "total": len(merchants)
    }


@app.post("/api/logs")
async def receive_logs(data: dict):
    """Receive logs and events from the agent."""
    event_type = data.get('event_type', 'unknown')
    # Just acknowledge receipt, no need to log verbosely
    return {"status": "received", "event_type": event_type}


if __name__ == "__main__":
    import uvicorn

    logger.info("🚀 Starting Somnia Merchant AI Agent API Server")
    logger.info("📡 Server running on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
