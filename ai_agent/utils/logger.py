"""
Logger Module
Structured logging for AI agent actions and decisions.
"""
from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from loguru import logger as loguru_logger

# Configure loguru
LOG_DIR = Path(__file__).resolve().parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Remove default handler
loguru_logger.remove()

# Add console handler with custom format
loguru_logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level="INFO",
    colorize=True,
)

# Add file handler for all logs
loguru_logger.add(
    LOG_DIR / "agent_{time:YYYY-MM-DD}.log",
    rotation="1 day",
    retention="30 days",
    level="DEBUG",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function} - {message}",
)

# Add file handler for decisions only
loguru_logger.add(
    LOG_DIR / "decisions_{time:YYYY-MM-DD}.log",
    rotation="1 day",
    retention="90 days",
    level="SUCCESS",
    format="{time:YYYY-MM-DD HH:mm:ss} | {message}",
    filter=lambda record: "DECISION" in record["message"],
)


def log_decision(
    action: str,
    merchant_id: int,
    details: Dict[str, Any],
    reasoning: str,
    tx_hash: Optional[str] = None,
) -> None:
    """
    Log a trading decision with structured format.
    
    Args:
        action: Type of action (buy, sell, restock, etc.)
        merchant_id: Merchant token ID
        details: Action-specific details
        reasoning: AI reasoning for the decision
        tx_hash: Transaction hash if action was executed
    """
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    log_entry = {
        "timestamp": timestamp,
        "action": action,
        "merchant_id": merchant_id,
        "details": details,
        "reasoning": reasoning,
        "tx_hash": tx_hash,
    }
    
    # Log to console and file
    if tx_hash:
        loguru_logger.success(
            f"DECISION | {action.upper()} | Merchant #{merchant_id} | {reasoning} | TX: {tx_hash}"
        )
    else:
        loguru_logger.info(
            f"DECISION | {action.upper()} | Merchant #{merchant_id} | {reasoning}"
        )
    
    # Log detailed JSON for analysis
    loguru_logger.debug(f"Decision details: {log_entry}")


def log_error(message: str, error: Exception) -> None:
    """Log error with exception details."""
    loguru_logger.error(f"{message}: {error}")
    loguru_logger.exception(error)


def log_agent_start(config: Dict[str, Any]) -> None:
    """Log agent startup information."""
    loguru_logger.info("=" * 80)
    loguru_logger.info("🤖 Somnia Merchant AI Agent Starting")
    loguru_logger.info("=" * 80)
    loguru_logger.info(f"RPC URL: {config.get('rpc_url')}")
    loguru_logger.info(f"Contract: {config.get('contract_address')}")
    loguru_logger.info(f"Poll Interval: {config.get('poll_interval_seconds', 30)}s")
    loguru_logger.info(f"Model: {config.get('model', 'heuristic')}")
    loguru_logger.info(f"LLM Enabled: {config.get('use_llm', True)}")
    loguru_logger.info("=" * 80)


def log_agent_cycle(cycle_number: int, merchants_processed: int) -> None:
    """Log agent processing cycle."""
    loguru_logger.info(
        f"📊 Cycle #{cycle_number} complete | Processed {merchants_processed} merchant(s)"
    )


# Export configured logger
logger = loguru_logger
