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
        
        # Initialize AgentManager if factory mode is enabled
        self.agent_manager = None
        if config.get("use_factory", False) and config.get("factory_address"):
            try:
                import os
                from utils.agent_manager import AgentManager
                logger.info("🏭 Factory mode enabled, initializing AgentManager...")
                self.agent_manager = AgentManager(
                    self.web3_helper.w3,
                    config["factory_address"],
                    os.getenv(config.get("private_key_env", "AI_AGENT_PRIVATE_KEY"))
                )
                logger.info("✅ AgentManager initialized for multi-merchant support")
            except Exception as e:
                logger.error(f"Failed to initialize AgentManager: {e}")
                logger.warning("Falling back to single-merchant mode")
                self.agent_manager = None
        
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
            # Factory mode: Use AgentManager for multi-merchant support
            if self.agent_manager:
                logger.info(f"🏭 Cycle #{self.cycle_count}: Factory mode - discovering merchants...")
                
                # Discover merchants assigned to this agent
                import asyncio
                merchant_addresses = asyncio.run(self.agent_manager.discover_merchants())
                
                logger.info(f"📊 Managing {len(merchant_addresses)} merchant(s) from factory")
                
                # Process each merchant from the factory
                for merchant_addr in merchant_addresses:
                    try:
                        self._process_factory_merchant(merchant_addr)
                    except Exception as e:
                        logger.error(f"Error processing merchant {merchant_addr}: {e}")
                        logger.exception(e)
                
                # Update status
                self._update_status(merchants_count=len(merchant_addresses))
                
                # Send heartbeat
                _, wallet_balance_eth = self.web3_helper.get_wallet_balance()
                self.notifier.send_heartbeat(
                    wallet_balance_eth=wallet_balance_eth,
                    merchants_monitored=len(merchant_addresses),
                    total_decisions=self.total_decisions,
                    uptime_seconds=time.time() - self.start_time,
                )
                
                log_agent_cycle(self.cycle_count, len(merchant_addresses))
                return
            
            # Single merchant mode: Original logic
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

    def _process_factory_merchant(self, merchant_address: str) -> None:
        """Process a single merchant from the factory and make AI-driven decisions."""
        try:
            # Get merchant contract
            merchant_contract = self.agent_manager.get_merchant_contract(merchant_address)
            merchant_info = self.agent_manager.get_merchant_info(merchant_address)
            
            # Get token ID (for now, assume tokenId 1 - TODO: track from events)
            token_id = merchant_info.get('token_id', 1)
            
            # Get merchant name
            try:
                name = merchant_contract.functions.getMerchantName(token_id).call()
            except:
                name = f"Merchant@{merchant_address[:8]}"
            
            # Get inventory
            try:
                inventory_raw = merchant_contract.functions.getInventory(token_id).call()
                inventory = [
                    {
                        "name": item[0],
                        "price": item[1],
                        "qty": item[2],
                        "active": item[3]
                    }
                    for item in inventory_raw
                ]
            except Exception as e:
                logger.warning(f"Could not fetch inventory for {merchant_address}: {e}")
                inventory = []
            
            # Get profit
            try:
                profit_wei = merchant_contract.functions.getProfit(token_id).call()
                profit_eth = profit_wei / 1e18
            except:
                profit_wei, profit_eth = 0, 0.0
            
            # Get wallet balance
            _, wallet_balance_eth = self.web3_helper.get_wallet_balance()
            
            merchant_data = {
                "merchant_address": merchant_address,
                "token_id": token_id,
                "name": name,
                "inventory": inventory,
                "profit_wei": profit_wei,
                "profit_eth": profit_eth,
                "owner": merchant_info['owner'],
                "memory": merchant_info.get('memory', {})
            }
            
            logger.debug(f"Factory Merchant {name} ({merchant_address[:8]}...): {len(inventory)} items, {profit_eth:.4f} ETH profit")
            
            # Get AI decision
            decision = self.decision_engine.get_decision(merchant_data, wallet_balance_eth)
            
            action = decision.get("action", "none")
            details = decision.get("details", {})
            reasoning = decision.get("reasoning", "No reasoning provided")
            
            # Log the AI's decision
            logger.info(f"🤖 AI Decision for {name} ({merchant_address[:8]}...): action='{action}', reasoning='{reasoning}'")
            
            # Update merchant memory
            self.agent_manager.update_merchant_memory(merchant_address, 'last_decision', {
                'action': action,
                'details': details,
                'reasoning': reasoning,
                'timestamp': time.time()
            })
            
            # Execute action (if not "none")
            tx_hash = None
            if action != "none":
                logger.info(f"🎯 Executing {action} for factory merchant {merchant_address[:10]}...")
                tx_hash = self._execute_factory_action(merchant_contract, token_id, action, details)
                
                if tx_hash:
                    logger.success(f"✅ Action '{action}' executed successfully! TX: {tx_hash[:10]}...")
                    log_decision(action, f"{merchant_address[:8]}", details, reasoning, tx_hash)
                    self.notifier.send_decision(action, merchant_address, details, reasoning, tx_hash)
                    
                    # Record success in memory
                    self.agent_manager.memory_manager.record_decision(
                        merchant_address, action, details, reasoning, success=True
                    )
                else:
                    logger.warning(f"⚠️ Action '{action}' failed to execute for {merchant_address}")
                    self.agent_manager.memory_manager.record_decision(
                        merchant_address, action, details, reasoning, success=False
                    )
                
                self._log_decision_internal(action, merchant_address, details, reasoning)
        
        except Exception as e:
            logger.error(f"Error processing factory merchant {merchant_address}: {e}")
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
    
    def _execute_factory_action(self, merchant_contract, token_id: int, action: str, details: Dict[str, Any]) -> str | None:
        """
        Execute a trading action on a factory-deployed merchant.
        
        Args:
            merchant_contract: Web3 contract instance for the merchant
            token_id: Token ID within the merchant contract
            action: Action to execute (add_item, restock, reprice, etc.)
            details: Action details/parameters
        
        Returns:
            Transaction hash on success, None on failure
        """
        try:
            account = self.web3_helper.account
            nonce = self.web3_helper.w3.eth.get_transaction_count(account.address)
            
            if action == "add_item":
                tx = merchant_contract.functions.addItem(
                    token_id,
                    details["item_name"],
                    details["price_wei"],
                    details["quantity"]
                ).build_transaction({
                    'from': account.address,
                    'nonce': nonce,
                    'gas': 300000,
                    'gasPrice': self.web3_helper.w3.eth.gas_price,
                })
            
            elif action == "buy":
                tx = merchant_contract.functions.buyItem(
                    token_id,
                    details["item_index"]
                ).build_transaction({
                    'from': account.address,
                    'value': details["price_wei"],
                    'nonce': nonce,
                    'gas': 200000,
                    'gasPrice': self.web3_helper.w3.eth.gas_price,
                })
            
            elif action == "restock":
                tx = merchant_contract.functions.restockItem(
                    token_id,
                    details["item_index"],
                    details["quantity"]
                ).build_transaction({
                    'from': account.address,
                    'nonce': nonce,
                    'gas': 200000,
                    'gasPrice': self.web3_helper.w3.eth.gas_price,
                })
            
            elif action == "reprice":
                tx = merchant_contract.functions.repriceItem(
                    token_id,
                    details["item_index"],
                    details["new_price_wei"]
                ).build_transaction({
                    'from': account.address,
                    'nonce': nonce,
                    'gas': 150000,
                    'gasPrice': self.web3_helper.w3.eth.gas_price,
                })
            
            elif action == "withdraw":
                tx = merchant_contract.functions.withdrawProfit(
                    token_id
                ).build_transaction({
                    'from': account.address,
                    'nonce': nonce,
                    'gas': 100000,
                    'gasPrice': self.web3_helper.w3.eth.gas_price,
                })
            
            else:
                logger.warning(f"Unknown action: {action}")
                return None
            
            # Sign and send transaction
            signed_tx = account.sign_transaction(tx)
            tx_hash = self.web3_helper.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            # Wait for receipt
            receipt = self.web3_helper.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt['status'] == 1:
                return tx_hash.hex()
            else:
                logger.error(f"Transaction failed: {tx_hash.hex()}")
                return None
        
        except Exception as e:
            logger.error(f"Failed to execute factory action '{action}': {e}")
            logger.exception(e)
            return None

    def _log_decision_internal(
        self, action: str, merchant_id, details: Dict[str, Any], reasoning: str
    ) -> None:
        """Log decision to internal history for status API."""
        decision = {
            "timestamp": datetime.now(UTC).isoformat(),
            "action": action,
            "merchant_id": merchant_id,
            "details": details,
            "reasoning": reasoning,
        }
        
        # If merchant_id is actually an address (string starting with 0x), store it
        if isinstance(merchant_id, str) and merchant_id.startswith('0x'):
            decision["merchant_address"] = merchant_id
        
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
