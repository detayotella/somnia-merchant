"""
Somnia Merchant AI Agent
Autonomous trading agent for managing MerchantNPC smart contracts.
"""
from __future__ import annotations

import json
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

import schedule
from dotenv import load_dotenv

from utils import DecisionEngine, Notifier, Web3Helper, log_decision, logger
from utils.logger import log_agent_cycle, log_agent_start

CONFIG_PATH = Path(__file__).resolve().parent / "config.json"
STATUS_FILE = Path(__file__).resolve().parent / "agent_status.json"


def load_config() -> Dict[str, Any]:
    if not CONFIG_PATH.exists():
        raise FileNotFoundError(f"Config not found at {CONFIG_PATH}")
    with CONFIG_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)




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

    def _load_contract(self) -> Contract:
        if not ARTIFACT_PATH.exists():
            raise FileNotFoundError("MerchantNPC artifact missing. Run `forge build` first.")
        with ARTIFACT_PATH.open("r", encoding="utf-8") as artifact:
            payload = json.load(artifact)
        address = Web3.to_checksum_address(self.config["contract_address"])
        return self.web3.eth.contract(address=address, abi=payload["abi"])

    def run_once(self) -> None:
        try:
            owner = Web3.to_checksum_address(self.config["merchant_owner"])
        except ValueError as exc:
            raise ValueError("Invalid merchant_owner in config.json") from exc

        balance = self.contract.functions.balanceOf(owner).call()
        logger.info("Processing {} merchants for owner {}", balance, owner)
        for idx in range(balance):
            token_id = self.contract.functions.tokenOfOwnerByIndex(owner, idx).call()
            self._process_merchant(token_id)
        
        self._update_status(merchants_count=balance)

    def _process_merchant(self, token_id: int) -> None:
        inventory_raw = self.contract.functions.getInventory(token_id).call()
        snapshots = [
            ItemSnapshot(
                token_id=token_id,
                index=i,
                name=item[0],
                price_wei=item[1],
                qty=item[2],
                active=item[3],
            )
            for i, item in enumerate(inventory_raw)
        ]
        logger.info("Merchant {} inventory: {}", token_id, [asdict(s) for s in snapshots])

        if not snapshots:
            self._seed_inventory(token_id)
        else:
            liquidity = self._estimate_liquidity()
            for item in snapshots:
                if should_buy(item, liquidity):
                    self._execute_buy(token_id, item.index, item.price_wei)
            candidate = select_restock_candidate(snapshots)
            if candidate and candidate.qty == 0:
                self._restock_item(token_id, candidate.index, 3)
            market_signal = self._fetch_market_signal()
            for item in snapshots:
                if should_reprice(item, market_signal):
                    new_price = int(item.price_wei * 11 // 10)
                    self._repricing(token_id, item.index, new_price)

        profit = self.contract.functions.profitOf(token_id).call()
        if profit > self.web3.to_wei(0.25, "ether"):
            self._withdraw_profit(token_id)

    def _seed_inventory(self, token_id: int) -> None:
        logger.info("Seeding default inventory for merchant {}", token_id)
        tx = self.contract.functions.addItem(token_id, "Quantum Battery", self.web3.to_wei(0.25, "ether"), 5)
        self._dispatch_transaction(tx)
        self._log_decision(
            "seed", token_id,
            {"item": "Quantum Battery", "price_eth": 0.25, "qty": 5},
            "Merchant has empty inventory, seeding with default item"
        )

    def _execute_buy(self, token_id: int, index: int, price_wei: int) -> None:
        logger.info("Buying item {} from merchant {}", index, token_id)
        tx = self.contract.functions.buyItem(token_id, index)
        self._dispatch_transaction(tx, value=price_wei)
        self._log_decision(
            "buy", token_id,
            {"item_index": index, "price_eth": self.web3.from_wei(price_wei, "ether")},
            f"Item price ({self.web3.from_wei(price_wei, 'ether')} ETH) is within budget and liquidity allows purchase"
        )

    def _restock_item(self, token_id: int, index: int, qty: int) -> None:
        logger.info("Restocking item {} for merchant {} with {} units", index, token_id, qty)
        tx = self.contract.functions.restockItem(token_id, index, qty)
        self._dispatch_transaction(tx)
        self._log_decision(
            "restock", token_id,
            {"item_index": index, "quantity": qty},
            f"Item inventory depleted (qty=0), restocking with {qty} units to maintain availability"
        )

    def _repricing(self, token_id: int, index: int, new_price: int) -> None:
        logger.info("Repricing item {} for merchant {} to {} wei", index, token_id, new_price)
        old_price_eth = self.web3.from_wei(new_price * 10 // 11, "ether")  # Reverse calculation
        new_price_eth = self.web3.from_wei(new_price, "ether")
        tx = self.contract.functions.sellItem(token_id, index, new_price)
        self._dispatch_transaction(tx)
        self._log_decision(
            "reprice", token_id,
            {"item_index": index, "old_price_eth": float(old_price_eth), "new_price_eth": float(new_price_eth)},
            f"Market signal indicates demand, increasing price by 10% for profit optimization"
        )

    def _withdraw_profit(self, token_id: int) -> None:
        profit = self.contract.functions.profitOf(token_id).call()
        profit_eth = self.web3.from_wei(profit, "ether")
        logger.info("Withdrawing profit for merchant {}", token_id)
        tx = self.contract.functions.withdrawProfit(token_id)
        self._dispatch_transaction(tx)
        self._log_decision(
            "withdraw", token_id,
            {"profit_eth": float(profit_eth)},
            f"Accumulated profit ({profit_eth} ETH) exceeds threshold (0.25 ETH), withdrawing to agent wallet"
        )

    def _dispatch_transaction(self, tx_func, value: int | None = None) -> None:
        try:
            nonce = self.web3.eth.get_transaction_count(self.account.address)
            tx_payload: Dict[str, Any] = {
                "from": self.account.address,
                "nonce": nonce,
                "chainId": self.web3.eth.chain_id,
                "gas": 600000,
            }
            gas_config = self.config.get("gas", {})
            tx_payload["maxPriorityFeePerGas"] = self.web3.to_wei(gas_config.get("max_priority_gwei", 1.5), "gwei")
            tx_payload["maxFeePerGas"] = self.web3.to_wei(gas_config.get("max_fee_gwei", 35), "gwei")
            if value is not None:
                tx_payload["value"] = value
            built = tx_func.build_transaction(tx_payload)
            signed = self.account.sign_transaction(built)
            tx_hash = self.web3.eth.send_raw_transaction(signed.rawTransaction)
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            logger.success("Tx {} confirmed in block {}", tx_hash.hex(), receipt.blockNumber)
        except ContractLogicError as error:
            logger.error("Contract reverted: {}", error)
        except Exception as exc:
            logger.exception("Transaction failed: {}", exc)

    def _estimate_liquidity(self) -> float:
        balance = self.web3.eth.get_balance(self.account.address)
        return self.web3.from_wei(balance, "ether")  # type: ignore[return-value]

    def _fetch_market_signal(self) -> float | None:
        # Placeholder for future ML model or external data feed.
        return 0.25

    def _log_decision(self, action: str, merchant_id: int, details: Dict[str, Any], reasoning: str) -> None:
        """Log AI decision for status API."""
        decision = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "action": action,
            "merchant_id": merchant_id,
            "details": details,
            "reasoning": reasoning,
        }
        self.recent_decisions.insert(0, decision)
        if len(self.recent_decisions) > self.max_decisions_history:
            self.recent_decisions = self.recent_decisions[:self.max_decisions_history]
        self.total_decisions += 1
        logger.debug("Decision logged: {}", action)

    def _update_status(self, merchants_count: int = 0) -> None:
        """Update agent status file for API consumption."""
        try:
            balance = self.web3.eth.get_balance(self.account.address)
            balance_eth = self.web3.from_wei(balance, "ether")
            
            status = {
                "is_running": True,
                "last_poll_time": datetime.utcnow().isoformat() + "Z",
                "agent_address": self.account.address,
                "wallet_balance_eth": float(balance_eth),
                "total_decisions_made": self.total_decisions,
                "recent_decisions": self.recent_decisions,
                "merchants_monitored": merchants_count,
                "auto_trading_enabled": True,
                "connection_healthy": self.web3.is_connected(),
                "uptime_seconds": time.time() - self.start_time,
            }
            
            with STATUS_FILE.open("w") as f:
                json.dump(status, f, indent=2)
        except Exception as exc:
            logger.error("Failed to update status file: {}", exc)


def main() -> None:
    config = load_config()
    agent = MerchantAgent(config)

    schedule.every(config.get("poll_interval_seconds", 30)).seconds.do(agent.run_once)

    logger.info("Starting merchant loop with {}s interval", config.get("poll_interval_seconds", 30))
    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    main()
