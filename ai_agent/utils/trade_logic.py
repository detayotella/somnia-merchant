from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Optional


@dataclass
class ItemSnapshot:
    token_id: int
    index: int
    name: str
    price_wei: int
    qty: int
    active: bool

    @property
    def price_eth(self) -> float:
        return self.price_wei / 10**18


def should_buy(item: ItemSnapshot, liquidity_eth: float) -> bool:
    if not item.active or item.qty == 0:
        return False
    if item.price_eth > liquidity_eth * 0.25:
        return False
    return item.price_eth <= 0.5


def should_reprice(item: ItemSnapshot, market_signal: Optional[float]) -> bool:
    if not item.active or item.qty == 0:
        return False
    if market_signal is None:
        return False
    return market_signal > 0.2


def select_restock_candidate(items: Iterable[ItemSnapshot]) -> Optional[ItemSnapshot]:
    candidates = [item for item in items if item.qty < 2]
    if not candidates:
        return None
    return min(candidates, key=lambda item: item.qty)
