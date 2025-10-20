// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "./StorageLib.sol";
import "./ValidationLib.sol";

/// @title Purchase Library
/// @notice Purchase processing logic
library PurchaseLib {
    event ItemPurchased(
        uint256 indexed merchantId,
        uint256 indexed itemId,
        address indexed buyer,
        uint256 quantity,
        uint256 totalCost
    );

    function processPurchase(
        StorageLib.InventorySlot storage inv,
        StorageLib.MerchantData storage merchant,
        uint256 merchantId,
        uint256 itemId,
        uint256 quantity
    ) internal returns (uint256) {
        StorageLib.Item storage item = inv.items[itemId];

        if (!item.isActive) revert ValidationLib.ItemNotActive();
        ValidationLib.validateStock(item.quantity, quantity);

        uint256 totalCost = item.price * quantity;
        ValidationLib.validatePayment(msg.value, totalCost);

        item.quantity -= quantity;
        merchant.totalProfit += totalCost;

        emit ItemPurchased(merchantId, itemId, msg.sender, quantity, totalCost);

        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        return totalCost;
    }
}
