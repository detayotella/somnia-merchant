// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "./StorageLib.sol";
import "./ValidationLib.sol";

/// @title Inventory Library
/// @notice Inventory management operations
library InventoryLib {
    event ItemAdded(
        uint256 indexed merchantId,
        uint256 indexed itemId,
        string name,
        uint256 price
    );
    event ItemRestocked(
        uint256 indexed merchantId,
        uint256 indexed itemId,
        uint256 newQuantity
    );
    event ItemToggled(
        uint256 indexed merchantId,
        uint256 indexed itemId,
        bool isActive
    );

    function addItem(
        StorageLib.InventorySlot storage inv,
        uint256 merchantId,
        string memory name,
        uint256 price,
        uint256 quantity
    ) internal returns (uint256) {
        ValidationLib.validateName(name);
        ValidationLib.validatePrice(price);
        ValidationLib.validateQuantity(quantity);

        uint256 itemId = inv.itemCount++;
        inv.items[itemId] = StorageLib.Item({
            name: name,
            price: price,
            quantity: quantity,
            isActive: true
        });

        emit ItemAdded(merchantId, itemId, name, price);
        return itemId;
    }

    function restock(
        StorageLib.InventorySlot storage inv,
        uint256 merchantId,
        uint256 itemId,
        uint256 additionalQty
    ) internal {
        ValidationLib.validateQuantity(additionalQty);
        inv.items[itemId].quantity += additionalQty;
        emit ItemRestocked(merchantId, itemId, inv.items[itemId].quantity);
    }

    function toggleActive(
        StorageLib.InventorySlot storage inv,
        uint256 merchantId,
        uint256 itemId
    ) internal {
        inv.items[itemId].isActive = !inv.items[itemId].isActive;
        emit ItemToggled(merchantId, itemId, inv.items[itemId].isActive);
    }
}
