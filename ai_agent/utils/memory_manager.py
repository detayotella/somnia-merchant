"""
AI Memory Manager - Persistent memory system for merchant strategies and personality.

This module provides SQLite-backed storage for:
- Merchant strategies and personalities
- Decision history and patterns
- Performance metrics
- AI learning/adaptation data
"""

import sqlite3
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
from loguru import logger


class MemoryManager:
    """Manages persistent memory for merchant AI agents."""
    
    def __init__(self, db_path: Optional[Path] = None):
        """Initialize memory manager with SQLite database."""
        if db_path is None:
            db_path = Path(__file__).parent.parent / "merchant_memory.db"
        
        self.db_path = db_path
        self._init_database()
        logger.info(f"💾 Memory Manager initialized: {self.db_path}")
    
    def _init_database(self):
        """Create database schema if it doesn't exist."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Merchant memory table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS merchant_memory (
                merchant_address TEXT PRIMARY KEY,
                strategy TEXT,
                personality TEXT,
                memory_data TEXT,
                last_action TEXT,
                last_action_time REAL,
                total_decisions INTEGER DEFAULT 0,
                successful_decisions INTEGER DEFAULT 0,
                created_at REAL,
                updated_at REAL
            )
        """)
        
        # Decision history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS decision_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                merchant_address TEXT,
                timestamp REAL,
                action TEXT,
                details TEXT,
                reasoning TEXT,
                success INTEGER,
                profit_change REAL,
                FOREIGN KEY (merchant_address) REFERENCES merchant_memory(merchant_address)
            )
        """)
        
        # Performance metrics table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS performance_metrics (
                merchant_address TEXT PRIMARY KEY,
                total_profit REAL DEFAULT 0.0,
                total_sales INTEGER DEFAULT 0,
                avg_profit_per_sale REAL DEFAULT 0.0,
                best_selling_item TEXT,
                optimal_price_point REAL,
                last_calculated REAL,
                FOREIGN KEY (merchant_address) REFERENCES merchant_memory(merchant_address)
            )
        """)
        
        conn.commit()
        conn.close()
        logger.debug("✅ Database schema initialized")
    
    def get_merchant_memory(self, merchant_address: str) -> Dict[str, Any]:
        """
        Retrieve memory for a specific merchant.
        
        Args:
            merchant_address: Ethereum address of the merchant
            
        Returns:
            Dictionary containing merchant memory data
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT strategy, personality, memory_data, last_action, 
                   last_action_time, total_decisions, successful_decisions
            FROM merchant_memory
            WHERE merchant_address = ?
        """, (merchant_address.lower(),))
        
        row = cursor.fetchone()
        conn.close()
        
        if row is None:
            # Create new memory entry
            return self._create_merchant_memory(merchant_address)
        
        strategy, personality, memory_data, last_action, last_action_time, total_decisions, successful_decisions = row
        
        return {
            "merchant_address": merchant_address,
            "strategy": strategy or "balanced",
            "personality": personality or "neutral",
            "memory": json.loads(memory_data) if memory_data else {},
            "last_action": last_action,
            "last_action_time": last_action_time,
            "total_decisions": total_decisions,
            "successful_decisions": successful_decisions
        }
    
    def _create_merchant_memory(self, merchant_address: str) -> Dict[str, Any]:
        """Create initial memory entry for a new merchant."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.now().timestamp()
        default_memory = {
            "preferences": {},
            "learned_patterns": [],
            "notes": []
        }
        
        cursor.execute("""
            INSERT INTO merchant_memory 
            (merchant_address, strategy, personality, memory_data, created_at, updated_at, total_decisions, successful_decisions)
            VALUES (?, ?, ?, ?, ?, ?, 0, 0)
        """, (
            merchant_address.lower(),
            "balanced",
            "neutral",
            json.dumps(default_memory),
            now,
            now
        ))
        
        # Also create performance metrics entry
        cursor.execute("""
            INSERT INTO performance_metrics 
            (merchant_address, last_calculated)
            VALUES (?, ?)
        """, (merchant_address.lower(), now))
        
        conn.commit()
        conn.close()
        
        logger.info(f"📝 Created new memory for merchant {merchant_address[:10]}...")
        
        return {
            "merchant_address": merchant_address,
            "strategy": "balanced",
            "personality": "neutral",
            "memory": default_memory,
            "last_action": None,
            "last_action_time": None,
            "total_decisions": 0,
            "successful_decisions": 0
        }
    
    def update_merchant_memory(
        self,
        merchant_address: str,
        key: str,
        value: Any
    ):
        """
        Update a specific memory field for a merchant.
        
        Args:
            merchant_address: Ethereum address of the merchant
            key: Memory key to update (e.g., 'strategy', 'last_action')
            value: New value for the key
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.now().timestamp()
        merchant_address = merchant_address.lower()
        
        # Get current memory
        memory = self.get_merchant_memory(merchant_address)
        
        if key == 'last_decision':
            # Special handling for decision updates
            cursor.execute("""
                UPDATE merchant_memory
                SET last_action = ?,
                    last_action_time = ?,
                    total_decisions = total_decisions + 1,
                    updated_at = ?
                WHERE merchant_address = ?
            """, (
                value.get('action'),
                value.get('timestamp', now),
                now,
                merchant_address
            ))
            
            # Log decision to history
            cursor.execute("""
                INSERT INTO decision_history
                (merchant_address, timestamp, action, details, reasoning, success)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                merchant_address,
                value.get('timestamp', now),
                value.get('action'),
                json.dumps(value.get('details', {})),
                value.get('reasoning', ''),
                1  # Assume success unless explicitly failed
            ))
        
        elif key in ['strategy', 'personality']:
            cursor.execute(f"""
                UPDATE merchant_memory
                SET {key} = ?,
                    updated_at = ?
                WHERE merchant_address = ?
            """, (value, now, merchant_address))
        
        elif key == 'memory':
            # Update the JSON memory data
            cursor.execute("""
                UPDATE merchant_memory
                SET memory_data = ?,
                    updated_at = ?
                WHERE merchant_address = ?
            """, (json.dumps(value), now, merchant_address))
        
        conn.commit()
        conn.close()
        logger.debug(f"💾 Updated {key} for merchant {merchant_address[:10]}...")
    
    def record_decision(
        self,
        merchant_address: str,
        action: str,
        details: Dict[str, Any],
        reasoning: str,
        success: bool = True,
        profit_change: float = 0.0
    ):
        """Record a decision in the history."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.now().timestamp()
        
        cursor.execute("""
            INSERT INTO decision_history
            (merchant_address, timestamp, action, details, reasoning, success, profit_change)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            merchant_address.lower(),
            now,
            action,
            json.dumps(details),
            reasoning,
            1 if success else 0,
            profit_change
        ))
        
        # Update merchant stats
        cursor.execute("""
            UPDATE merchant_memory
            SET total_decisions = total_decisions + 1,
                successful_decisions = successful_decisions + ?,
                updated_at = ?
            WHERE merchant_address = ?
        """, (1 if success else 0, now, merchant_address.lower()))
        
        conn.commit()
        conn.close()
    
    def get_decision_history(
        self,
        merchant_address: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get recent decision history for a merchant."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT timestamp, action, details, reasoning, success, profit_change
            FROM decision_history
            WHERE merchant_address = ?
            ORDER BY timestamp DESC
            LIMIT ?
        """, (merchant_address.lower(), limit))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [
            {
                "timestamp": row[0],
                "action": row[1],
                "details": json.loads(row[2]),
                "reasoning": row[3],
                "success": bool(row[4]),
                "profit_change": row[5]
            }
            for row in rows
        ]
    
    def update_performance_metrics(
        self,
        merchant_address: str,
        total_profit: float,
        total_sales: int,
        best_selling_item: Optional[str] = None,
        optimal_price_point: Optional[float] = None
    ):
        """Update performance metrics for a merchant."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.now().timestamp()
        avg_profit = total_profit / total_sales if total_sales > 0 else 0.0
        
        cursor.execute("""
            INSERT OR REPLACE INTO performance_metrics
            (merchant_address, total_profit, total_sales, avg_profit_per_sale,
             best_selling_item, optimal_price_point, last_calculated)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            merchant_address.lower(),
            total_profit,
            total_sales,
            avg_profit,
            best_selling_item,
            optimal_price_point,
            now
        ))
        
        conn.commit()
        conn.close()
    
    def get_all_merchants(self) -> List[str]:
        """Get list of all merchants with stored memory."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT merchant_address FROM merchant_memory")
        rows = cursor.fetchall()
        conn.close()
        
        return [row[0] for row in rows]
    
    def cleanup_old_decisions(self, days_old: int = 30):
        """Remove decision history older than specified days."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cutoff_timestamp = datetime.now().timestamp() - (days_old * 86400)
        
        cursor.execute("""
            DELETE FROM decision_history
            WHERE timestamp < ?
        """, (cutoff_timestamp,))
        
        deleted = cursor.rowcount
        conn.commit()
        conn.close()
        
        logger.info(f"🗑️ Cleaned up {deleted} old decision records")
        return deleted
