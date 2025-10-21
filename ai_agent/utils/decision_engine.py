"""
Decision Engine Module
Handles AI-powered and heuristic-based decision making for merchant management.
Supports: OpenAI GPT, Anthropic Claude, and Google Gemini.
"""
from __future__ import annotations

import json
import os
import random
from typing import Any, Dict

from loguru import logger

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

try:
    from anthropic import Anthropic
except ImportError:
    Anthropic = None

try:
    import google.generativeai as genai
except ImportError:
    genai = None


class DecisionEngine:
    """LLM-powered decision engine for autonomous trading."""

    def __init__(self, config: Dict[str, Any]) -> None:
        self.config = config
        self.use_llm = config.get("use_llm", False)
        self.model = config.get("model", "gpt-4")
        self.client = None
        
        if self.use_llm:
            # Try Gemini first (free tier)
            if genai and (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")):
                try:
                    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
                    genai.configure(api_key=api_key)
                    self.client = "gemini"
                    self.model = config.get("model", "gemini-2.0-flash")
                    logger.info(f"✅ Using Google Gemini: {self.model}")
                except Exception as e:
                    logger.warning(f"Failed to initialize Gemini: {e}")
            
            # Try OpenAI
            elif OpenAI and os.getenv("OPENAI_API_KEY"):
                try:
                    self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
                    logger.info(f"✅ Using OpenAI: {self.model}")
                except Exception as e:
                    logger.warning(f"Failed to initialize OpenAI: {e}")
                    self.client = None
            
            # Try Anthropic
            elif Anthropic and os.getenv("ANTHROPIC_API_KEY"):
                try:
                    self.client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
                    logger.info(f"✅ Using Anthropic Claude: {self.model}")
                except Exception as e:
                    logger.warning(f"Failed to initialize Anthropic: {e}")
                    self.client = None
            
            if not self.client:
                logger.warning("⚠️  No LLM API keys found. Falling back to heuristic mode.")
                logger.info("💡 To enable AI: Add GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY to .env")
                self.use_llm = False
        else:
            logger.info("LLM mode disabled, using heuristic decision making")

    def get_decision(
        self,
        merchant_data: Dict[str, Any],
        wallet_balance_eth: float,
    ) -> Dict[str, Any]:
        """
        Make trading decision based on merchant state.
        
        Args:
            merchant_data: Dict containing token_id, name, inventory, profit
            wallet_balance_eth: Current agent wallet balance in ETH
        
        Returns:
            Decision dict with keys: action, details, reasoning
        """
        if self.use_llm:
            return self._llm_decision(merchant_data, wallet_balance_eth)
        else:
            return self._heuristic_decision(merchant_data, wallet_balance_eth)

    def _llm_decision(
        self, merchant_data: Dict[str, Any], wallet_balance_eth: float
    ) -> Dict[str, Any]:
        """Use LLM to make intelligent decision."""
        prompt = self._build_prompt(merchant_data, wallet_balance_eth)
        
        try:
            # Google Gemini
            if self.client == "gemini":
                # Use the model name without 'models/' prefix
                model_name = self.model.replace('models/', '')
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                decision_text = response.text
            
            # OpenAI GPT
            elif isinstance(self.client, type(OpenAI)) if OpenAI else False:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an autonomous merchant AI agent. You manage digital item inventory, make trading decisions, and optimize profits. Always respond with valid JSON only.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.7,
                    max_tokens=500,
                )
                decision_text = response.choices[0].message.content
            
            # Anthropic Claude
            elif isinstance(self.client, type(Anthropic)) if Anthropic else False:
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=500,
                    messages=[{"role": "user", "content": prompt}],
                    system="You are an autonomous merchant AI agent. You manage digital item inventory, make trading decisions, and optimize profits. Always respond with valid JSON only.",
                )
                decision_text = response.content[0].text
            
            else:
                raise Exception("No valid LLM client configured")
            
            # Parse LLM response - handle markdown code blocks
            decision_text = decision_text.strip()
            if decision_text.startswith("```json"):
                decision_text = decision_text[7:]
            if decision_text.startswith("```"):
                decision_text = decision_text[3:]
            if decision_text.endswith("```"):
                decision_text = decision_text[:-3]
            decision_text = decision_text.strip()
            
            decision = json.loads(decision_text)
            logger.debug(f"LLM decision: {decision}")
            return decision
        
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            logger.debug(f"Raw response: {decision_text}")
            return {"action": "none", "details": {}, "reasoning": "Failed to parse LLM decision"}
        
        except Exception as e:
            logger.error(f"LLM decision failed: {e}")
            # Fallback to heuristics
            return self._heuristic_decision(merchant_data, wallet_balance_eth)

    def _build_prompt(self, merchant_data: Dict[str, Any], wallet_balance_eth: float) -> str:
        """Build prompt for LLM."""
        inventory = merchant_data.get("inventory", [])
        profit_eth = merchant_data.get("profit_eth", 0.0)
        token_id = merchant_data.get("token_id")
        name = merchant_data.get("name", f"Merchant #{token_id}")
        
        min_profit_threshold = self.config.get("min_profit_threshold", 0.2)
        
        prompt = f"""You are managing {name} (Token ID: {token_id}).

Current State:
- Wallet Balance: {wallet_balance_eth:.4f} ETH
- Accumulated Profit: {profit_eth:.4f} ETH
- Inventory ({len(inventory)} items):
"""
        
        for item in inventory:
            prompt += f"\n  [{item['index']}] {item['name']} - Price: {item['price_eth']:.4f} ETH, Qty: {item['quantity']}, Active: {item['active']}"
        
        prompt += f"""

Trading Rules:
1. If inventory is EMPTY, add a new item (action: "add_item")
2. If an item has quantity = 0, restock it (action: "restock")
3. If wallet balance allows AND price is reasonable, buy items to increase inventory (action: "buy")
4. If profit > {min_profit_threshold} ETH, withdraw it (action: "withdraw")
5. Otherwise, do nothing (action: "none")

NOTE: Price adjustments (reprice) are NOT available in the V2 contract.

Respond ONLY with valid JSON in this exact format:
{{
  "action": "none|add_item|restock|buy|withdraw",
  "details": {{
    "item_index": 0,
    "item_name": "Example Item",
    "price_wei": 250000000000000000,
    "quantity": 5
  }},
  "reasoning": "Clear explanation of why you made this decision"
}}

Notes:
- 1 ETH = 1000000000000000000 wei
- Only include relevant fields in "details" based on action
- Be strategic: balance risk, liquidity, and profit maximization
- Explain your reasoning clearly

What is your decision?"""
        
        return prompt

    def _heuristic_decision(
        self, merchant_data: Dict[str, Any], wallet_balance_eth: float
    ) -> Dict[str, Any]:
        """Fallback heuristic-based decision making."""
        inventory = merchant_data.get("inventory", [])
        profit_eth = merchant_data.get("profit_eth", 0.0)
        token_id = merchant_data.get("token_id")
        
        min_profit_threshold = self.config.get("min_profit_threshold", 0.2)
        
        # Rule 1: Empty inventory - add default item
        if not inventory:
            return {
                "action": "add_item",
                "details": {
                    "item_name": "Quantum Battery",
                    "price_wei": 250000000000000000,  # 0.25 ETH
                    "quantity": 5,
                },
                "reasoning": "Inventory is empty. Seeding with default item.",
            }
        
        # Rule 2: Withdraw profit if threshold exceeded
        if profit_eth > min_profit_threshold:
            return {
                "action": "withdraw",
                "details": {"token_id": token_id},
                "reasoning": f"Profit ({profit_eth:.4f} ETH) exceeds threshold ({min_profit_threshold} ETH). Withdrawing.",
            }
        
        # Rule 3: Restock depleted items
        for item in inventory:
            if item["quantity"] == 0 and item["active"]:
                return {
                    "action": "restock",
                    "details": {"item_index": item["index"], "quantity": 3},
                    "reasoning": f"Item '{item['name']}' is out of stock. Restocking with 3 units.",
                }
        
        # Rule 4: Buy item if affordable and price is good
        for item in inventory:
            if (
                item["active"]
                and item["quantity"] > 0
                and item["price_eth"] < wallet_balance_eth * 0.25
                and item["price_eth"] <= 0.5
            ):
                return {
                    "action": "buy",
                    "details": {
                        "item_index": item["index"],
                        "price_wei": item["price_wei"],
                    },
                    "reasoning": f"Item '{item['name']}' is affordable ({item['price_eth']:.4f} ETH) and within budget. Buying to stimulate economy.",
                }
        
        # Rule 5: Reprice if market signal detected (simplified)
        # DISABLED: repriceItem function not available in V2 contract
        # market_signal = self._get_market_signal()
        # if market_signal > 0.2:
        #     for item in inventory:
        #         if item["active"] and item["quantity"] > 0:
        #             new_price_wei = int(item["price_wei"] * 1.1)  # 10% increase
        #             return {
        #                 "action": "reprice",
        #                 "details": {
        #                     "item_index": item["index"],
        #                     "new_price_wei": new_price_wei,
        #                 },
        #                 "reasoning": f"Market signal ({market_signal}) indicates demand. Increasing price by 10%.",
        #             }
        
        # Default: no action
        return {
            "action": "none",
            "details": {},
            "reasoning": "All conditions nominal. Monitoring market.",
        }

    def _get_market_signal(self) -> float:
        """
        Get market signal for pricing decisions.
        In production, this would connect to external data or ML model.
        """
        # Placeholder - return simple signal
        return 0.25
