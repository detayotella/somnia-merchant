// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC721} from "openzeppelin-contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "openzeppelin-contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/security/ReentrancyGuard.sol";
import {Address} from "openzeppelin-contracts/utils/Address.sol";

/// @title Somnia Merchant NPC
/// @notice ERC-721 merchants that self-manage inventory and profits.
contract MerchantNPC is ERC721Enumerable, Ownable, ReentrancyGuard {
    using Address for address payable;

    struct Item {
        string name;
        uint256 price;
        uint256 qty;
        bool active;
    }

    error MerchantNPC__InvalidRecipient();
    error MerchantNPC__InvalidItemIndex();
    error MerchantNPC__InvalidItemData();
    error MerchantNPC__ItemInactive();
    error MerchantNPC__ItemOutOfStock();
    error MerchantNPC__IncorrectPayment();
    error MerchantNPC__Unauthorized();
    error MerchantNPC__NoProfitAvailable();
    error MerchantNPC__UnknownMerchant();

    event MerchantMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string name
    );
    event ItemAdded(
        uint256 indexed tokenId,
        uint256 indexed index,
        string name,
        uint256 price,
        uint256 qty
    );
    event ItemUpdated(
        uint256 indexed tokenId,
        uint256 indexed index,
        string name,
        uint256 price,
        uint256 qty,
        bool active
    );
    event ItemBought(
        uint256 indexed tokenId,
        address indexed buyer,
        string item,
        uint256 price
    );
    event ItemSold(uint256 indexed tokenId, string item, uint256 price);
    event ProfitWithdrawn(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 amount
    );

    uint256 private _nextTokenId;
    mapping(uint256 => Item[]) private _inventories;
    mapping(uint256 => uint256) private _profits;
    mapping(uint256 => string) private _merchantNames;

    constructor() ERC721("Somnia Merchant NPC", "SMNPC") Ownable() {}

    modifier onlyMerchantController(uint256 tokenId) {
        address owner = ownerOf(tokenId);
        if (
            owner != _msgSender() &&
            getApproved(tokenId) != _msgSender() &&
            !isApprovedForAll(owner, _msgSender())
        ) {
            revert MerchantNPC__Unauthorized();
        }
        _;
    }

    function mintMerchant(
        address to,
        string memory merchantName
    ) external onlyOwner returns (uint256 tokenId) {
        if (to == address(0)) {
            revert MerchantNPC__InvalidRecipient();
        }
        tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);
        _merchantNames[tokenId] = merchantName;
        emit MerchantMinted(tokenId, to, merchantName);
    }

    function addItem(
        uint256 tokenId,
        string memory name,
        uint256 price,
        uint256 qty
    ) external onlyMerchantController(tokenId) returns (uint256 index) {
        _requireMerchantExists(tokenId);
        if (bytes(name).length == 0 || price == 0 || qty == 0) {
            revert MerchantNPC__InvalidItemData();
        }

        Item memory item = Item({
            name: name,
            price: price,
            qty: qty,
            active: true
        });
        _inventories[tokenId].push(item);
        index = _inventories[tokenId].length - 1;
        emit ItemAdded(tokenId, index, name, price, qty);
    }

    function buyItem(
        uint256 tokenId,
        uint256 index
    ) external payable nonReentrant {
        _requireMerchantExists(tokenId);
        Item storage item = _getItem(tokenId, index);

        if (!item.active) {
            revert MerchantNPC__ItemInactive();
        }
        if (item.qty == 0) {
            revert MerchantNPC__ItemOutOfStock();
        }
        if (msg.value != item.price) {
            revert MerchantNPC__IncorrectPayment();
        }

        unchecked {
            item.qty -= 1;
        }
        if (item.qty == 0) {
            item.active = false;
        }

        _profits[tokenId] += msg.value;

        emit ItemBought(tokenId, msg.sender, item.name, item.price);
    }

    function sellItem(
        uint256 tokenId,
        uint256 index,
        uint256 newPrice
    ) external onlyMerchantController(tokenId) {
        _requireMerchantExists(tokenId);
        Item storage item = _getItem(tokenId, index);

        if (item.qty == 0) {
            revert MerchantNPC__ItemOutOfStock();
        }
        if (newPrice == 0) {
            revert MerchantNPC__InvalidItemData();
        }

        item.price = newPrice;
        item.active = true;

        emit ItemSold(tokenId, item.name, newPrice);
        emit ItemUpdated(
            tokenId,
            index,
            item.name,
            item.price,
            item.qty,
            item.active
        );
    }

    function restockItem(
        uint256 tokenId,
        uint256 index,
        uint256 additionalQty
    ) external onlyMerchantController(tokenId) {
        _requireMerchantExists(tokenId);
        if (additionalQty == 0) {
            revert MerchantNPC__InvalidItemData();
        }
        Item storage item = _getItem(tokenId, index);
        item.qty += additionalQty;
        item.active = true;

        emit ItemUpdated(
            tokenId,
            index,
            item.name,
            item.price,
            item.qty,
            item.active
        );
    }

    function retireItem(
        uint256 tokenId,
        uint256 index
    ) external onlyMerchantController(tokenId) {
        _requireMerchantExists(tokenId);
        Item storage item = _getItem(tokenId, index);
        item.active = false;

        emit ItemUpdated(
            tokenId,
            index,
            item.name,
            item.price,
            item.qty,
            item.active
        );
    }

    function withdrawProfit(uint256 tokenId) external nonReentrant {
        _requireMerchantExists(tokenId);
        if (ownerOf(tokenId) != msg.sender) {
            revert MerchantNPC__Unauthorized();
        }
        uint256 balance = _profits[tokenId];
        if (balance == 0) {
            revert MerchantNPC__NoProfitAvailable();
        }

        _profits[tokenId] = 0;
        payable(msg.sender).sendValue(balance);

        emit ProfitWithdrawn(tokenId, msg.sender, balance);
    }

    function getInventory(
        uint256 tokenId
    ) external view returns (Item[] memory) {
        _requireMerchantExists(tokenId);
        return _inventories[tokenId];
    }

    function getItem(
        uint256 tokenId,
        uint256 index
    ) external view returns (Item memory) {
        _requireMerchantExists(tokenId);
        return _getItem(tokenId, index);
    }

    function profitOf(uint256 tokenId) external view returns (uint256) {
        _requireMerchantExists(tokenId);
        return _profits[tokenId];
    }

    function merchantNameOf(
        uint256 tokenId
    ) external view returns (string memory) {
        _requireMerchantExists(tokenId);
        return _merchantNames[tokenId];
    }

    function totalMerchants() external view returns (uint256) {
        return _nextTokenId;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _getItem(
        uint256 tokenId,
        uint256 index
    ) internal view returns (Item storage) {
        Item[] storage items = _inventories[tokenId];
        if (index >= items.length) {
            revert MerchantNPC__InvalidItemIndex();
        }
        return items[index];
    }

    function _requireMerchantExists(uint256 tokenId) internal view {
        if (_ownerOf(tokenId) == address(0)) {
            revert MerchantNPC__UnknownMerchant();
        }
    }
}
