// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title Storage Library
/// @notice Pure data structures for merchant system
library StorageLib {
    struct Item {
        string name;
        uint256 price;
        uint256 quantity;
        bool isActive;
    }

    struct MerchantData {
        string name;
        address owner;
        uint256 totalProfit;
    }

    struct InventorySlot {
        mapping(uint256 => Item) items;
        uint256 itemCount;
    }
}
