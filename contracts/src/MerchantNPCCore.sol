// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC721} from "openzeppelin-contracts/token/ERC721/ERC721.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/security/ReentrancyGuard.sol";
import "./StorageLib.sol";
import "./ValidationLib.sol";
import "./InventoryLib.sol";
import "./PurchaseLib.sol";

/// @title Merchant NPC Core
/// @notice Modular merchant NFT with library-based logic
contract MerchantNPCCore is ERC721, ReentrancyGuard {
    using InventoryLib for StorageLib.InventorySlot;
    using PurchaseLib for StorageLib.InventorySlot;

    uint256 private _tokenIdCounter;

    mapping(uint256 => StorageLib.MerchantData) public merchants;
    mapping(uint256 => StorageLib.InventorySlot) private inventories;

    event MerchantMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string name
    );
    event ProfitWithdrawn(
        uint256 indexed merchantId,
        address indexed to,
        uint256 amount
    );

    error NotMerchantOwner();
    error NoProfit();

    constructor() ERC721("Somnia Merchant", "MERCH") {}

    function mintMerchant(
        address to,
        string memory name
    ) external returns (uint256) {
        ValidationLib.validateName(name);

        uint256 tokenId = ++_tokenIdCounter;
        _safeMint(to, tokenId);

        merchants[tokenId] = StorageLib.MerchantData({
            name: name,
            owner: to,
            totalProfit: 0
        });

        emit MerchantMinted(tokenId, to, name);
        return tokenId;
    }

    function addItem(
        uint256 merchantId,
        string memory name,
        uint256 price,
        uint256 quantity
    ) external returns (uint256) {
        if (ownerOf(merchantId) != msg.sender) revert NotMerchantOwner();
        return
            inventories[merchantId].addItem(merchantId, name, price, quantity);
    }

    function restockItem(
        uint256 merchantId,
        uint256 itemId,
        uint256 quantity
    ) external {
        if (ownerOf(merchantId) != msg.sender) revert NotMerchantOwner();
        inventories[merchantId].restock(merchantId, itemId, quantity);
    }

    function toggleItem(uint256 merchantId, uint256 itemId) external {
        if (ownerOf(merchantId) != msg.sender) revert NotMerchantOwner();
        inventories[merchantId].toggleActive(merchantId, itemId);
    }

    function buyItem(
        uint256 merchantId,
        uint256 itemId,
        uint256 quantity
    ) external payable nonReentrant {
        inventories[merchantId].processPurchase(
            merchants[merchantId],
            merchantId,
            itemId,
            quantity
        );
    }

    function withdrawProfit(uint256 merchantId) external nonReentrant {
        if (ownerOf(merchantId) != msg.sender) revert NotMerchantOwner();

        uint256 profit = merchants[merchantId].totalProfit;
        if (profit == 0) revert NoProfit();

        merchants[merchantId].totalProfit = 0;
        payable(msg.sender).transfer(profit);

        emit ProfitWithdrawn(merchantId, msg.sender, profit);
    }

    function getItem(
        uint256 merchantId,
        uint256 itemId
    ) external view returns (StorageLib.Item memory) {
        return inventories[merchantId].items[itemId];
    }

    function getItemCount(uint256 merchantId) external view returns (uint256) {
        return inventories[merchantId].itemCount;
    }

    function profitOf(uint256 merchantId) external view returns (uint256) {
        return merchants[merchantId].totalProfit;
    }
}
