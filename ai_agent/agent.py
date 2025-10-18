"""
Somnia Merchant AI Agent
Autonomous trading agent for managing MerchantNPC smart contracts.
"""
from __future__ import annotations

import json
import time
from datetime import datetime, UTC
from pathlib import Path
from typing import Any, Dict, List

import schedule
from dotenv import load_dotenv

from utils import DecisionEngine, Notifier, Web3Helper, log_decision, logger
from utils.logger import log_agent_cycle, log_agent_start

CONFIG_PATH = Path(__file__).resolve().parent / "config.json"
STATUS_FILE = Path(__file__).resolve().parent / "agent_status.json"


def load_config() -> Dict[str, Any]:
    """Load agent configuration from JSON file."""
    if not CONFIG_PATH.exists():
        raise FileNotFoundError(f"Config not found at {CONFIG_PATH}")
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


class MerchantAgent:
    """Autonomous AI agent for managing merchant NPCs."""

    def __init__(self, config: Dict[str, Any]) -> None:
        load_dotenv()
        self.config = config
        
        # Initialize core components
        self.web3_helper = Web3Helper(config)
        self.decision_engine = DecisionEngine(config)
        self.notifier = Notifier(config)
        
        # Status tracking
        self.start_time = time.time()
        self.total_decisions = 0
        self.recent_decisions: List[Dict[str, Any]] = []
        self.max_decisions_history = 50
        self.cycle_count = 0
        
        logger.info("✅ Agent initialized successfully")
        self._update_status()

    def run_once(self) -> None:
        """Execute one cycle of merchant monitoring and decision making."""
        self.cycle_count += 1
        
        try:
            # Get merchants to monitor
            owner = self.config.get("merchant_owner")
            if not owner:
                logger.warning("No merchant_owner configured, monitoring all merchants")
                # Monitor all merchants if no owner specified
                total_merchants = self.web3_helper.get_total_merchants()
                merchant_ids = list(range(1, total_merchants + 1))
            else:
                merchant_ids = self.web3_helper.get_merchants_for_owner(owner)
            
            logger.info(f"📊 Cycle #{self.cycle_count}: Processing {len(merchant_ids)} merchant(s)")
            
            # Process each merchant
            for token_id in merchant_ids:
                self._process_merchant(token_id)
            
            # Update status
            self._update_status(merchants_count=len(merchant_ids))
            
            # Send heartbeat
            _, wallet_balance_eth = self.web3_helper.get_wallet_balance()
            self.notifier.send_heartbeat(
                wallet_balance_eth=wallet_balance_eth,
                merchants_monitored=len(merchant_ids),
                total_decisions=self.total_decisions,
                uptime_seconds=time.time() - self.start_time,
            )
            
            log_agent_cycle(self.cycle_count, len(merchant_ids))
        
        except Exception as e:
            logger.error(f"Error in agent cycle: {e}")
            logger.exception(e)
            self.notifier.send_error(str(e), "cycle_error")

    def _process_merchant(self, token_id: int) -> None:
        """Process a single merchant and make AI-driven decisions."""
        try:
            # Gather merchant data
            name = self.web3_helper.get_merchant_name(token_id)
            inventory = self.web3_helper.get_inventory(token_id)
            profit_wei, profit_eth = self.web3_helper.get_profit(token_id)
            _, wallet_balance_eth = self.web3_helper.get_wallet_balance()
            
            merchant_data = {
                "token_id": token_id,
                "name": name,
                "inventory": inventory,
                "profit_wei": profit_wei,
                "profit_eth": profit_eth,
            }
            
            logger.debug(f"Merchant {name} (#{token_id}): {len(inventory)} items, {profit_eth:.4f} ETH profit")
            
            # Get AI decision
            decision = self.decision_engine.get_decision(merchant_data, wallet_balance_eth)
            
            action = decision.get("action", "none")
            details = decision.get("details", {})
            reasoning = decision.get("reasoning", "No reasoning provided")
            
            # Log the AI's decision
            logger.info(f"🤖 AI Decision for {name}: action='{action}', reasoning='{reasoning}'")
            
            # Always log decision to internal history (even "hold")
            self._log_decision_internal(action, token_id, details, reasoning)
            
            # Execute action
            tx_hash = None
            if action != "none":
                tx_hash = self._execute_action(token_id, action, details)
                
                if tx_hash:
                    # Log decision
                    log_decision(action, token_id, details, reasoning, tx_hash)
                    
                    # Send to backend
                    self.notifier.send_decision(action, token_id, details, reasoning, tx_hash)
                    
                    # Track decision
                    self._log_decision_internal(action, token_id, details, reasoning)
                else:
                    logger.warning(f"Action '{action}' failed to execute for merchant #{token_id}")
        
        except Exception as e:
            logger.error(f"Error processing merchant #{token_id}: {e}")
            logger.exception(e)

    def _execute_action(self, token_id: int, action: str, details: Dict[str, Any]) -> str | None:
        """
        Execute a trading action.
        
        Returns:
            Transaction hash on success, None on failure
        """
        try:
            if action == "add_item":
                return self.web3_helper.add_item(
                    token_id,
                    details["item_name"],
                    details["price_wei"],
                    details["quantity"],
                )
            
            elif action == "buy":
                return self.web3_helper.buy_item(
                    token_id,
                    details["item_index"],
                    details["price_wei"],
                )
            
            elif action == "restock":
                return self.web3_helper.restock_item(
                    token_id,
                    details["item_index"],
                    details["quantity"],
                )
            
            elif action == "reprice":
                return self.web3_helper.reprice_item(
                    token_id,
                    details["item_index"],
                    details["new_price_wei"],
                )
            
            elif action == "withdraw":
                return self.web3_helper.withdraw_profit(token_id)
            
            else:
                logger.warning(f"Unknown action: {action}")
                return None
        
        except Exception as e:
            logger.error(f"Failed to execute action '{action}': {e}")
            return None

    def _log_decision_internal(
        self, action: str, merchant_id: int, details: Dict[str, Any], reasoning: str
    ) -> None:
        """Log decision to internal history for status API."""
        decision = {
            "timestamp": datetime.now(UTC).isoformat(),
            "action": action,
            "merchant_id": merchant_id,
            "details": details,
            "reasoning": reasoning,
        }
        
        self.recent_decisions.insert(0, decision)
        if len(self.recent_decisions) > self.max_decisions_history:
            self.recent_decisions = self.recent_decisions[: self.max_decisions_history]
        
        self.total_decisions += 1

    def _update_status(self, merchants_count: int = 0) -> None:
        """Update agent status file for API consumption."""
        try:
            _, balance_eth = self.web3_helper.get_wallet_balance()
            
            status = {
                "is_running": True,
                "last_poll_time": datetime.now(UTC).isoformat(),
                "agent_address": self.web3_helper.account.address,
                "wallet_balance_eth": balance_eth,
                "total_decisions_made": self.total_decisions,
                "recent_decisions": self.recent_decisions,
                "merchants_monitored": merchants_count,
                "auto_trading_enabled": True,
                "connection_healthy": self.web3_helper.is_connected(),
                "uptime_seconds": time.time() - self.start_time,
            }
            
            with STATUS_FILE.open("w") as f:
                json.dump(status, f, indent=2)
        
        except Exception as e:
            logger.error(f"Failed to update status file: {e}")


def main() -> None:
    """Main entry point for the AI agent."""
    # Load configuration
    config = load_config()
    
    # Log startup
    log_agent_start(config)
    
    # Create agent
    agent = MerchantAgent(config)
    
    # Schedule periodic execution
    poll_interval = config.get("poll_interval_seconds", 30)
    schedule.every(poll_interval).seconds.do(agent.run_once)
    
    logger.info(f"🚀 Agent loop starting with {poll_interval}s interval")
    logger.info("Press Ctrl+C to stop")
    
    # Run initial cycle immediately
    agent.run_once()
    
    # Main loop
    try:
        while True:
            schedule.run_pending()
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("🛑 Agent stopped by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        logger.exception(e)
        raise


if __name__ == "__main__":
    main()
