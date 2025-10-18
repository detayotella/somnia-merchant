"""
AI Agent Manager for Multi-Merchant Support
Monitors MerchantFactory events and manages multiple merchant instances
"""
import asyncio
import json
from typing import Dict, List, Optional
from web3 import Web3
from loguru import logger
from pathlib import Path

class AgentManager:
    """Manages multiple AI agents for different merchant instances"""
    
    def __init__(self, web3_provider: Web3, factory_address: str, agent_private_key: str):
        self.w3 = web3_provider
        self.factory_address = Web3.to_checksum_address(factory_address)
        self.agent_private_key = agent_private_key
        self.agent_address = self.w3.eth.account.from_key(agent_private_key).address
        
        # Load factory ABI
        self.factory_abi = self._load_factory_abi()
        self.factory_contract = self.w3.eth.contract(
            address=self.factory_address,
            abi=self.factory_abi
        )
        
        # Track merchants assigned to this agent
        self.managed_merchants: Dict[str, dict] = {}
        
        logger.info(f"AgentManager initialized for agent: {self.agent_address}")
        logger.info(f"Factory contract: {self.factory_address}")
    
    def _load_factory_abi(self) -> list:
        """Load MerchantFactory ABI from compiled artifacts"""
        try:
            abi_path = Path(__file__).parent.parent.parent / "contracts" / "out" / "MerchantFactory.sol" / "MerchantFactory.json"
            with open(abi_path, 'r') as f:
                artifact = json.load(f)
                return artifact['abi']
        except Exception as e:
            logger.warning(f"Could not load factory ABI: {e}")
            # Fallback to minimal ABI
            return [
                {
                    "anonymous": False,
                    "inputs": [
                        {"indexed": True, "name": "merchantAddress", "type": "address"},
                        {"indexed": True, "name": "owner", "type": "address"},
                        {"indexed": False, "name": "name", "type": "string"},
                        {"indexed": False, "name": "timestamp", "type": "uint256"}
                    ],
                    "name": "MerchantCreated",
                    "type": "event"
                },
                {
                    "inputs": [],
                    "name": "getAllMerchants",
                    "outputs": [{"name": "", "type": "address[]"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [{"name": "merchantAddress", "type": "address"}],
                    "name": "getMerchantDetails",
                    "outputs": [
                        {"name": "owner", "type": "address"},
                        {"name": "aiAgent", "type": "address"},
                        {"name": "isActive", "type": "bool"}
                    ],
                    "stateMutability": "view",
                    "type": "function"
                }
            ]
    
    def _load_merchant_abi(self) -> list:
        """Load MerchantNPC ABI"""
        try:
            abi_path = Path(__file__).parent.parent.parent / "contracts" / "out" / "MerchantNPC.sol" / "MerchantNPC.json"
            with open(abi_path, 'r') as f:
                artifact = json.load(f)
                return artifact['abi']
        except Exception as e:
            logger.error(f"Could not load merchant ABI: {e}")
            return []
    
    async def discover_merchants(self):
        """Discover all merchants from the factory and identify which ones this agent manages"""
        try:
            all_merchants = self.factory_contract.functions.getAllMerchants().call()
            logger.info(f"Found {len(all_merchants)} total merchants in factory")
            
            for merchant_addr in all_merchants:
                merchant_addr = Web3.to_checksum_address(merchant_addr)
                owner, ai_agent, is_active = self.factory_contract.functions.getMerchantDetails(merchant_addr).call()
                
                # Check if this agent is assigned to this merchant
                if ai_agent.lower() == self.agent_address.lower() and is_active:
                    if merchant_addr not in self.managed_merchants:
                        self.managed_merchants[merchant_addr] = {
                            'owner': owner,
                            'ai_agent': ai_agent,
                            'is_active': is_active,
                            'last_action': None,
                            'memory': {}
                        }
                        logger.info(f"✅ Now managing merchant: {merchant_addr} (owner: {owner})")
            
            logger.info(f"Currently managing {len(self.managed_merchants)} merchants")
            return list(self.managed_merchants.keys())
            
        except Exception as e:
            logger.error(f"Error discovering merchants: {e}")
            return []
    
    async def listen_for_new_merchants(self, poll_interval: int = 30):
        """Listen for MerchantCreated events and auto-register if needed"""
        logger.info(f"Listening for new merchant creation events (polling every {poll_interval}s)")
        
        # Get the latest block number
        last_block = self.w3.eth.block_number
        
        while True:
            try:
                current_block = self.w3.eth.block_number
                
                if current_block > last_block:
                    # Check for MerchantCreated events
                    event_filter = self.factory_contract.events.MerchantCreated.create_filter(
                        fromBlock=last_block + 1,
                        toBlock=current_block
                    )
                    
                    events = event_filter.get_all_entries()
                    
                    for event in events:
                        merchant_addr = event['args']['merchantAddress']
                        owner = event['args']['owner']
                        name = event['args']['name']
                        
                        logger.info(f"🆕 New merchant created: {name} at {merchant_addr}")
                        logger.info(f"   Owner: {owner}")
                        
                        # Check if this merchant needs an AI agent
                        _, ai_agent, _ = self.factory_contract.functions.getMerchantDetails(merchant_addr).call()
                        
                        if ai_agent == "0x0000000000000000000000000000000000000000":
                            logger.info(f"   Merchant {name} needs an AI agent (not assigned yet)")
                            # Owner needs to call registerAIAgent(merchantAddr, agentAddr)
                    
                    last_block = current_block
                
                # Re-discover merchants to pick up any newly assigned to this agent
                await self.discover_merchants()
                
                await asyncio.sleep(poll_interval)
                
            except Exception as e:
                logger.error(f"Error in event listener: {e}")
                await asyncio.sleep(poll_interval)
    
    def get_merchant_contract(self, merchant_address: str):
        """Get a Web3 contract instance for a specific merchant"""
        merchant_abi = self._load_merchant_abi()
        return self.w3.eth.contract(
            address=Web3.to_checksum_address(merchant_address),
            abi=merchant_abi
        )
    
    def get_managed_merchants(self) -> List[str]:
        """Get list of merchant addresses managed by this agent"""
        return list(self.managed_merchants.keys())
    
    def get_merchant_info(self, merchant_address: str) -> Optional[dict]:
        """Get info about a specific managed merchant"""
        return self.managed_merchants.get(merchant_address)
    
    def update_merchant_memory(self, merchant_address: str, key: str, value):
        """Update memory/state for a specific merchant"""
        if merchant_address in self.managed_merchants:
            if 'memory' not in self.managed_merchants[merchant_address]:
                self.managed_merchants[merchant_address]['memory'] = {}
            self.managed_merchants[merchant_address]['memory'][key] = value
            self.managed_merchants[merchant_address]['last_action'] = self.w3.eth.get_block('latest')['timestamp']
    
    async def run_decision_cycle(self, decision_engine):
        """Run AI decision cycle for all managed merchants"""
        from utils.merchant_interaction import (
            get_merchant_inventory,
            add_item,
            restock_item,
            retire_item
        )
        
        logger.info(f"Running decision cycle for {len(self.managed_merchants)} merchants")
        
        for merchant_addr in self.managed_merchants:
            try:
                logger.info(f"\n{'='*60}")
                logger.info(f"Processing merchant: {merchant_addr}")
                
                # Get merchant contract
                merchant_contract = self.get_merchant_contract(merchant_addr)
                
                # Get token ID (assuming first NFT is ID 1)
                # In production, you'd track the tokenId when the merchant is created
                token_id = 1  # TODO: Track actual tokenId from MerchantCreated event
                
                # Get current inventory
                inventory = get_merchant_inventory(merchant_contract, token_id)
                
                if not inventory:
                    logger.warning(f"No inventory found for merchant {merchant_addr}")
                    continue
                
                logger.info(f"Current inventory: {len(inventory)} items")
                for idx, item in enumerate(inventory):
                    logger.info(f"  [{idx}] {item['name']}: {item['qty']} @ {item['price']} STT (Active: {item['active']})")
                
                # Get merchant info
                merchant_info = self.managed_merchants[merchant_addr]
                
                # Prepare context for LLM
                context = {
                    'merchant_address': merchant_addr,
                    'token_id': token_id,
                    'inventory': inventory,
                    'owner': merchant_info['owner'],
                    'memory': merchant_info.get('memory', {}),
                    'last_action': merchant_info.get('last_action')
                }
                
                # Get AI decision
                decision = decision_engine.make_decision(context)
                logger.info(f"AI Decision: {decision}")
                
                # Execute decision
                if decision['action'] == 'add_item':
                    logger.info(f"Adding new item: {decision.get('item_name', 'New Item')}")
                    # add_item(merchant_contract, token_id, decision, self.agent_private_key, self.w3)
                    
                elif decision['action'] == 'restock':
                    logger.info(f"Restocking item #{decision.get('item_index', 0)}")
                    # restock_item(merchant_contract, token_id, decision, self.agent_private_key, self.w3)
                    
                elif decision['action'] == 'retire':
                    logger.info(f"Retiring item #{decision.get('item_index', 0)}")
                    # retire_item(merchant_contract, token_id, decision, self.agent_private_key, self.w3)
                    
                elif decision['action'] == 'wait':
                    logger.info("Waiting for better conditions")
                
                # Update memory
                self.update_merchant_memory(merchant_addr, 'last_decision', decision)
                
            except Exception as e:
                logger.error(f"Error processing merchant {merchant_addr}: {e}")
                import traceback
                traceback.print_exc()
        
        logger.info(f"{'='*60}\n")


async def main():
    """Test the agent manager"""
    from web3 import Web3
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    # Initialize Web3
    rpc_url = "https://dream-rpc.somnia.network/"
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    
    # Get factory address from config
    config_path = Path(__file__).parent.parent / "config.json"
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    factory_address = "0x0000000000000000000000000000000000000000"  # TODO: Update after deployment
    agent_private_key = os.getenv('AI_AGENT_PRIVATE_KEY')
    
    if factory_address == "0x0000000000000000000000000000000000000000":
        logger.error("Factory address not set. Deploy MerchantFactory first.")
        return
    
    # Initialize agent manager
    manager = AgentManager(w3, factory_address, agent_private_key)
    
    # Discover existing merchants
    await manager.discover_merchants()
    
    # Start listening for new merchants
    await manager.listen_for_new_merchants()


if __name__ == "__main__":
    asyncio.run(main())
