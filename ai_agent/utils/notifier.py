"""
Notifier Module
Sends agent decisions and events to backend API for frontend visualization.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

import requests
from loguru import logger


class Notifier:
    """Handles communication with backend API."""

    def __init__(self, config: Dict[str, Any]) -> None:
        self.config = config
        self.backend_url = config.get("backend_api", "http://localhost:8000/api/logs")
        self.enabled = config.get("enable_notifications", True)
        
        if self.enabled:
            logger.info(f"Notifier enabled, sending to: {self.backend_url}")
        else:
            logger.info("Notifier disabled")

    def send_decision(
        self,
        action: str,
        merchant_id: int,
        details: Dict[str, Any],
        reasoning: str,
        tx_hash: Optional[str] = None,
    ) -> bool:
        """
        Send decision event to backend API.
        
        Args:
            action: Action type
            merchant_id: Merchant token ID
            details: Action details
            reasoning: AI reasoning
            tx_hash: Transaction hash if executed
        
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.enabled:
            return False
        
        payload = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "action": action,
            "merchant_id": merchant_id,
            "details": details,
            "reasoning": reasoning,
            "tx_hash": tx_hash,
            "event_type": "decision",
        }
        
        try:
            response = requests.post(
                self.backend_url,
                json=payload,
                timeout=5,
            )
            
            if response.status_code == 200:
                logger.debug(f"Decision sent to backend: {action}")
                return True
            else:
                logger.warning(
                    f"Backend returned status {response.status_code}: {response.text}"
                )
                return False
        
        except requests.exceptions.RequestException as e:
            logger.warning(f"Failed to send decision to backend: {e}")
            return False

    def send_heartbeat(
        self,
        wallet_balance_eth: float,
        merchants_monitored: int,
        total_decisions: int,
        uptime_seconds: float,
    ) -> bool:
        """
        Send heartbeat status to backend.
        
        Args:
            wallet_balance_eth: Current wallet balance
            merchants_monitored: Number of merchants being monitored
            total_decisions: Total decisions made
            uptime_seconds: Agent uptime
        
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.enabled:
            return False
        
        payload = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": "heartbeat",
            "status": {
                "wallet_balance_eth": wallet_balance_eth,
                "merchants_monitored": merchants_monitored,
                "total_decisions": total_decisions,
                "uptime_seconds": uptime_seconds,
            },
        }
        
        try:
            response = requests.post(
                self.backend_url,
                json=payload,
                timeout=5,
            )
            
            if response.status_code == 200:
                logger.debug("Heartbeat sent to backend")
                return True
            else:
                logger.warning(f"Heartbeat failed with status {response.status_code}")
                return False
        
        except requests.exceptions.RequestException as e:
            logger.debug(f"Heartbeat send failed: {e}")
            return False

    def send_error(self, error_message: str, error_type: str) -> bool:
        """
        Send error event to backend.
        
        Args:
            error_message: Error description
            error_type: Type of error
        
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.enabled:
            return False
        
        payload = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": "error",
            "error": {
                "message": error_message,
                "type": error_type,
            },
        }
        
        try:
            response = requests.post(
                self.backend_url,
                json=payload,
                timeout=5,
            )
            
            return response.status_code == 200
        
        except requests.exceptions.RequestException:
            return False
