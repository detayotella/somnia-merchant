"""
Web3 Helper Module
Handles all blockchain interactions with the MerchantNPC contract.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
from loguru import logger
from web3 import Web3
from web3.contract import Contract
from web3.exceptions import ContractLogicError

# Load environment variables
load_dotenv()

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
MERCHANT_ARTIFACT_PATH = ROOT_DIR / "contracts/out/MerchantNPCCore.sol/MerchantNPCCore.json"
FACTORY_ARTIFACT_PATH = ROOT_DIR / "contracts/out/MerchantFactoryCore.sol/MerchantFactoryCore.json"


class Web3Helper:
    """Manages Web3 connection and contract interactions."""

    def __init__(self, config: Dict[str, Any]) -> None:
        self.config = config
        
        # Create Web3 instance with timeout settings
        provider = Web3.HTTPProvider(
            config["rpc_url"],
            request_kwargs={'timeout': 60}
        )
        self.web3 = Web3(provider)
        
        # Test connection with retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                block_number = self.web3.eth.block_number
                logger.info(f"Connected to blockchain at {config['rpc_url']}")
                logger.info(f"Chain ID: {self.web3.eth.chain_id}")
                logger.info(f"Current block: {block_number}")
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    raise ConnectionError(
                        f"Unable to connect to RPC after {max_retries} attempts: {config['rpc_url']}\n"
                        f"Error: {str(e)}"
                    )
                logger.warning(f"Connection attempt {attempt + 1} failed, retrying...")
                import time
                time.sleep(2)
        
        # Load both factory and merchant contracts
        self.factory_contract = self._load_factory_contract()
        self.merchant_contract = self._load_merchant_contract()
        self.contract = self.merchant_contract  # Backward compatibility
        
        # Get private key from environment variable
        key_env = config.get("private_key_env", "AI_AGENT_PRIVATE_KEY")
        private_key = os.getenv(key_env)
        if not private_key:
            raise EnvironmentError(f"Missing private key in env var {key_env}")
        
        self.account = self.web3.eth.account.from_key(private_key)
        logger.info(f"Agent wallet: {self.account.address}")
        
        # Register as AI agent if not already registered
        self._ensure_ai_agent_registered()

    def _load_contract(self) -> Contract:
        """Load merchant contract ABI (legacy method for backward compatibility)."""
        return self._load_merchant_contract()

    def _load_factory_contract(self) -> Contract:
        """Load factory contract ABI and create contract instance."""
        if not FACTORY_ARTIFACT_PATH.exists():
            raise FileNotFoundError(
                f"Factory contract artifact not found at {FACTORY_ARTIFACT_PATH}. "
                "Run 'forge build' in the contracts directory."
            )

        try:
            with FACTORY_ARTIFACT_PATH.open("r", encoding="utf-8") as f:
                artifact = json.load(f)
        except json.JSONDecodeError:
            raise RuntimeError(
                f"Contract artifact at {FACTORY_ARTIFACT_PATH} is not valid JSON."
            )

        address = Web3.to_checksum_address(self.config["factory_address"])
        
        # Verify bytecode exists
        code = self.web3.eth.get_code(address)
        if not code or self.web3.to_hex(code) == "0x":
            raise RuntimeError(
                f"No contract bytecode found at factory address {address}. "
                "Ensure the factory is deployed."
            )

        contract = self.web3.eth.contract(address=address, abi=artifact.get("abi", []))
        logger.info(f"Factory contract loaded at {address}")
        return contract

    def _load_merchant_contract(self) -> Contract:
        """Load merchant contract ABI and create contract instance."""
        if not MERCHANT_ARTIFACT_PATH.exists():
            raise FileNotFoundError(
                f"Merchant contract artifact not found at {MERCHANT_ARTIFACT_PATH}. "
                "Run 'forge build' in the contracts directory."
            )

        try:
            with MERCHANT_ARTIFACT_PATH.open("r", encoding="utf-8") as f:
                artifact = json.load(f)
        except json.JSONDecodeError:
            raise RuntimeError(
                f"Contract artifact at {MERCHANT_ARTIFACT_PATH} is not valid JSON. Re-run the build (e.g. 'forge build') to regenerate artifacts."
            )

        address = Web3.to_checksum_address(self.config["contract_address"])

        # Before creating the contract instance, verify there is bytecode at the
        # configured address on the target RPC. If eth_getCode returns empty (0x),
        # calls will return empty data and ABI decoding will fail with
        # BadFunctionCallOutput/InsufficientDataBytes. Provide a clear error here.
        try:
            code = self.web3.eth.get_code(address)
            code_hex = self.web3.to_hex(code)
        except Exception as e:
            logger.error(f"Failed to query eth_getCode for {address}: {e}")
            code_hex = None

        if not code or code_hex == "0x":
            raise RuntimeError(
                f"No contract bytecode found at {address} on RPC {self.web3.provider.endpoint_uri} (eth_getCode returned {code_hex}).\n"
                "This usually means the contract isn't deployed at that address on the configured RPC or you're pointed at the wrong network.\n"
                "Fixes:\n"
                "  - Ensure you deployed the contract and that deployment updated ai_agent/config.json with the deployed address.\n"
                "  - Re-run the deployment script (contracts/deploy.sh or use 'forge script' in the contracts folder).\n"
                "  - If you expect the contract to exist, verify the RPC URL and network."
            )

        contract = self.web3.eth.contract(address=address, abi=artifact.get("abi", []))
        logger.info(f"Merchant contract loaded at {address}")
        return contract

    def _ensure_ai_agent_registered(self) -> None:
        """Check if agent is registered, and register if not."""
        try:
            is_registered = self.factory_contract.functions.isAIAgent(self.account.address).call()
            if is_registered:
                logger.info(f"AI agent {self.account.address} is already registered")
            else:
                logger.info(f"Registering AI agent {self.account.address}...")
                tx = self.factory_contract.functions.registerAIAgent(self.account.address)
                tx_hash = self._send_transaction(tx)
                logger.success(f"AI agent registered: {tx_hash}")
        except Exception as e:
            logger.warning(f"Could not verify/register AI agent: {e}")

    def get_inventory(self, token_id: int) -> List[Dict[str, Any]]:
        """
        Fetch merchant inventory from contract.
        
        Returns:
            List of items with structure: [name, price_wei, quantity, active]
        """
        try:
            # Get item count first
            item_count = self.merchant_contract.functions.getItemCount(token_id).call()
            inventory = []
            
            # Fetch each item individually
            for idx in range(item_count):
                try:
                    item = self.merchant_contract.functions.getItem(token_id, idx).call()
                    inventory.append({
                        "index": idx,
                        "name": item[0],
                        "price_wei": item[1],
                        "price_eth": self.web3.from_wei(item[1], "ether"),
                        "quantity": item[2],
                        "active": item[3],
                    })
                except Exception as e:
                    logger.debug(f"Could not fetch item {idx}: {e}")
                    continue
            
            return inventory
        except ContractLogicError as e:
            logger.error(f"Failed to get inventory for merchant {token_id}: {e}")
            return []

    def get_profit(self, token_id: int) -> Tuple[int, float]:
        """
        Get accumulated profit for merchant.
        
        Returns:
            Tuple of (profit_wei, profit_eth)
        """
        try:
            profit_wei = self.contract.functions.profitOf(token_id).call()
            profit_eth = self.web3.from_wei(profit_wei, "ether")
            return profit_wei, float(profit_eth)
        except ContractLogicError as e:
            logger.error(f"Failed to get profit for merchant {token_id}: {e}")
            return 0, 0.0

    def get_merchant_name(self, token_id: int) -> str:
        """Get merchant name."""
        try:
            merchant_data = self.merchant_contract.functions.merchants(token_id).call()
            return merchant_data[0]  # name is first field
        except ContractLogicError:
            return f"Merchant #{token_id}"

    def get_all_merchants_from_factory(self) -> List[str]:
        """Get all merchant addresses from factory."""
        try:
            return self.factory_contract.functions.getAllMerchants().call()
        except ContractLogicError as e:
            logger.error(f"Failed to get all merchants: {e}")
            return []

    def get_merchants_by_creator(self, creator_address: str) -> List[str]:
        """Get merchants created by a specific AI agent."""
        try:
            creator = Web3.to_checksum_address(creator_address)
            return self.factory_contract.functions.getMerchantsByCreator(creator).call()
        except ContractLogicError as e:
            logger.error(f"Failed to get merchants for creator {creator_address}: {e}")
            return []

    def create_merchant(self, name: str) -> Optional[str]:
        """
        Create a new merchant via factory.
        
        Args:
            name: Name for the new merchant
            
        Returns:
            Transaction hash on success, None on failure
        """
        try:
            tx = self.factory_contract.functions.createMerchant(name)
            tx_hash = self._send_transaction(tx)
            logger.success(f"Created merchant '{name}': {tx_hash}")
            return tx_hash
        except Exception as e:
            logger.error(f"Failed to create merchant: {e}")
            return None

    def get_total_merchants(self) -> int:
        """Get total number of merchants from factory."""
        try:
            return self.factory_contract.functions.getMerchantCount().call()
        except ContractLogicError as e:
            logger.error(f"Failed to get total merchants: {e}")
            return 0

    def get_merchants_for_owner(self, owner_address: str) -> List[str]:
        """Get all merchants created by an owner (via factory)."""
        return self.get_merchants_by_creator(owner_address)

    def get_wallet_balance(self) -> Tuple[int, float]:
        """
        Get agent wallet balance.
        
        Returns:
            Tuple of (balance_wei, balance_eth)
        """
        balance_wei = self.web3.eth.get_balance(self.account.address)
        balance_eth = self.web3.from_wei(balance_wei, "ether")
        return balance_wei, float(balance_eth)

    def buy_item(self, token_id: int, item_index: int, quantity: int, price_wei: int) -> Optional[str]:
        """
        Buy an item from a merchant.
        
        Args:
            token_id: Merchant ID
            item_index: Item index in inventory
            quantity: Number of items to buy
            price_wei: Total price in wei
        
        Returns:
            Transaction hash on success, None on failure
        """
        try:
            tx = self.merchant_contract.functions.buyItem(token_id, item_index, quantity)
            tx_hash = self._send_transaction(tx, value=price_wei)
            logger.success(f"Bought {quantity}x item {item_index} from merchant {token_id}: {tx_hash}")
            return tx_hash
        except Exception as e:
            logger.error(f"Failed to buy item: {e}")
            return None

    def add_item(
        self, token_id: int, name: str, price_wei: int, quantity: int
    ) -> Optional[str]:
        """
        Add a new item to merchant inventory.
        
        Returns:
            Transaction hash on success, None on failure
        """
        try:
            tx = self.merchant_contract.functions.addItem(token_id, name, price_wei, quantity)
            tx_hash = self._send_transaction(tx)
            logger.success(f"Added item '{name}' to merchant {token_id}: {tx_hash}")
            return tx_hash
        except Exception as e:
            logger.error(f"Failed to add item: {e}")
            return None

    def restock_item(self, token_id: int, item_index: int, quantity: int) -> Optional[str]:
        """
        Restock an existing item.
        
        Returns:
            Transaction hash on success, None on failure
        """
        try:
            tx = self.merchant_contract.functions.restockItem(token_id, item_index, quantity)
            tx_hash = self._send_transaction(tx)
            logger.success(
                f"Restocked item {item_index} for merchant {token_id} with {quantity} units: {tx_hash}"
            )
            return tx_hash
        except Exception as e:
            logger.error(f"Failed to restock item: {e}")
            return None

    def toggle_item(self, token_id: int, item_index: int) -> Optional[str]:
        """
        Toggle item active status.
        
        Returns:
            Transaction hash on success, None on failure
        """
        try:
            tx = self.merchant_contract.functions.toggleItem(token_id, item_index)
            tx_hash = self._send_transaction(tx)
            logger.success(f"Toggled item {item_index} for merchant {token_id}: {tx_hash}")
            return tx_hash
        except Exception as e:
            logger.error(f"Failed to toggle item: {e}")
            return None

    def withdraw_profit(self, token_id: int) -> Optional[str]:
        """
        Withdraw accumulated profit.
        
        Returns:
            Transaction hash on success, None on failure
        """
        try:
            tx = self.merchant_contract.functions.withdrawProfit(token_id)
            tx_hash = self._send_transaction(tx)
            logger.success(f"Withdrew profit for merchant {token_id}: {tx_hash}")
            return tx_hash
        except Exception as e:
            logger.error(f"Failed to withdraw profit: {e}")
            return None

    def _send_transaction(self, tx_func, value: Optional[int] = None) -> str:
        """
        Build, sign, and send a transaction.
        
        Args:
            tx_func: Contract function to call
            value: ETH value to send (in wei)
        
        Returns:
            Transaction hash as hex string
        """
        nonce = self.web3.eth.get_transaction_count(self.account.address)
        
        tx_params: Dict[str, Any] = {
            "from": self.account.address,
            "nonce": nonce,
            "chainId": self.web3.eth.chain_id,
            "gas": 1000000,  # Increased gas limit
        }
        
        # Use legacy gas pricing (Somnia may not support EIP-1559)
        # Type 0 transactions use gasPrice instead of maxPriorityFeePerGas/maxFeePerGas
        gas_config = self.config.get("gas", {})
        tx_params["gasPrice"] = self.web3.to_wei(
            gas_config.get("max_fee_gwei", 10), "gwei"
        )
        
        if value is not None:
            tx_params["value"] = value
        
        # Build and sign transaction
        built_tx = tx_func.build_transaction(tx_params)
        signed_tx = self.account.sign_transaction(built_tx)
        
        # Send transaction (use raw_transaction attribute for web3.py >= 6.0)
        raw_tx = getattr(signed_tx, 'raw_transaction', None) or getattr(signed_tx, 'rawTransaction')
        tx_hash = self.web3.eth.send_raw_transaction(raw_tx)
        
        # Wait for receipt
        receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        
        if receipt.status != 1:
            raise Exception(f"Transaction failed: {tx_hash.hex()}")
        
        logger.debug(f"Transaction confirmed in block {receipt.blockNumber}")
        return tx_hash.hex()

    def is_connected(self) -> bool:
        """Check if Web3 connection is active."""
        return self.web3.is_connected()
