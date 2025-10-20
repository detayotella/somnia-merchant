// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title Validation Library
/// @notice Input validation for merchant operations
library ValidationLib {
    error InvalidPrice();
    error InvalidQuantity();
    error InvalidName();
    error ItemNotActive();
    error InsufficientStock();
    error InsufficientPayment();

    function validatePrice(uint256 price) internal pure {
        if (price == 0) revert InvalidPrice();
    }

    function validateQuantity(uint256 qty) internal pure {
        if (qty == 0) revert InvalidQuantity();
    }

    function validateName(string memory name) internal pure {
        if (bytes(name).length == 0) revert InvalidName();
    }

    function validateStock(uint256 available, uint256 requested) internal pure {
        if (available < requested) revert InsufficientStock();
    }

    function validatePayment(uint256 sent, uint256 required) internal pure {
        if (sent < required) revert InsufficientPayment();
    }
}
