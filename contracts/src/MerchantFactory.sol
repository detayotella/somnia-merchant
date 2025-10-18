// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {MerchantNPC} from "./MerchantNPC.sol";
import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";
import {IERC721Receiver} from "openzeppelin-contracts/token/ERC721/IERC721Receiver.sol";

/// @title Merchant Factory
/// @notice Factory contract for deploying and managing multiple MerchantNPC instances
/// @dev Each user can create and manage multiple autonomous merchant NPCs
contract MerchantFactory is Ownable, IERC721Receiver {
    /// @notice Emitted when a new merchant is created
    event MerchantCreated(
        address indexed merchantAddress,
        address indexed owner,
        string name,
        uint256 timestamp
    );

    /// @notice Emitted when a merchant is registered with an AI agent
    event MerchantAIRegistered(
        address indexed merchantAddress,
        address indexed aiAgent,
        uint256 timestamp
    );

    /// @notice Mapping from owner address to their merchant addresses
    mapping(address => address[]) public ownerToMerchants;

    /// @notice Mapping from merchant address to its owner
    mapping(address => address) public merchantToOwner;

    /// @notice Mapping from merchant address to its AI agent
    mapping(address => address) public merchantToAIAgent;

    /// @notice Array of all deployed merchant addresses
    address[] public allMerchants;

    /// @notice Total number of merchants created
    uint256 public totalMerchants;

    /// @notice Minimum initial stock required
    uint256 public constant MIN_INITIAL_STOCK = 1;

    /// @notice Minimum item price (in wei)
    uint256 public constant MIN_ITEM_PRICE = 0.001 ether;

    error MerchantFactory__InvalidName();
    error MerchantFactory__InvalidStock();
    error MerchantFactory__InvalidPrice();
    error MerchantFactory__DeploymentFailed();
    error MerchantFactory__NotMerchantOwner();
    error MerchantFactory__MerchantNotFound();

    constructor() Ownable() {}

    /// @notice Create a new MerchantNPC with initial inventory
    /// @param merchantName The name of the merchant
    /// @param itemName The name of the initial item
    /// @param initialStock The initial stock quantity
    /// @param itemPrice The price of the item in wei
    /// @return merchantAddress The address of the newly deployed merchant
    /// @return tokenId The token ID of the minted merchant NFT
    function createMerchant(
        string memory merchantName,
        string memory itemName,
        uint256 initialStock,
        uint256 itemPrice
    ) external returns (address merchantAddress, uint256 tokenId) {
        // Validation
        if (bytes(merchantName).length == 0 || bytes(merchantName).length > 32) {
            revert MerchantFactory__InvalidName();
        }
        if (initialStock < MIN_INITIAL_STOCK) {
            revert MerchantFactory__InvalidStock();
        }
        if (itemPrice < MIN_ITEM_PRICE) {
            revert MerchantFactory__InvalidPrice();
        }

        // Deploy new MerchantNPC
        MerchantNPC merchant = new MerchantNPC();
        merchantAddress = address(merchant);

        // Mint merchant NFT to factory first (so we can add items)
        tokenId = merchant.mintMerchant(address(this), merchantName);

        // Add initial item to inventory
        merchant.addItem(tokenId, itemName, itemPrice, initialStock);

        // Transfer ownership of merchant contract to creator
        merchant.transferOwnership(msg.sender);

        // Transfer the NFT to the actual creator
        merchant.safeTransferFrom(address(this), msg.sender, tokenId);

        // Update mappings
        ownerToMerchants[msg.sender].push(merchantAddress);
        merchantToOwner[merchantAddress] = msg.sender;
        allMerchants.push(merchantAddress);
        totalMerchants++;

        emit MerchantCreated(
            merchantAddress,
            msg.sender,
            merchantName,
            block.timestamp
        );
    }

    /// @notice Register an AI agent for a merchant
    /// @param merchantAddress The address of the merchant contract
    /// @param aiAgent The address of the AI agent wallet
    function registerAIAgent(
        address merchantAddress,
        address aiAgent
    ) external {
        if (merchantToOwner[merchantAddress] != msg.sender) {
            revert MerchantFactory__NotMerchantOwner();
        }

        merchantToAIAgent[merchantAddress] = aiAgent;
        emit MerchantAIRegistered(merchantAddress, aiAgent, block.timestamp);
    }

    /// @notice Get all merchants owned by an address
    /// @param owner The owner address
    /// @return merchants Array of merchant addresses
    function getMerchantsByOwner(
        address owner
    ) external view returns (address[] memory) {
        return ownerToMerchants[owner];
    }

    /// @notice Get all deployed merchants
    /// @return merchants Array of all merchant addresses
    function getAllMerchants() external view returns (address[] memory) {
        return allMerchants;
    }

    /// @notice Get merchant details
    /// @param merchantAddress The merchant contract address
    /// @return owner The owner address
    /// @return aiAgent The AI agent address
    /// @return isActive Whether the merchant is active
    function getMerchantDetails(
        address merchantAddress
    ) external view returns (address owner, address aiAgent, bool isActive) {
        owner = merchantToOwner[merchantAddress];
        aiAgent = merchantToAIAgent[merchantAddress];
        isActive = owner != address(0);
    }

    /// @notice Get the number of merchants owned by an address
    /// @param owner The owner address
    /// @return count Number of merchants
    function getMerchantCount(address owner) external view returns (uint256) {
        return ownerToMerchants[owner].length;
    }

    /// @notice Check if an address is a deployed merchant
    /// @param merchantAddress The address to check
    /// @return isDeployed True if the address is a deployed merchant
    function isMerchant(address merchantAddress) external view returns (bool) {
        return merchantToOwner[merchantAddress] != address(0);
    }

    /// @notice Handle the receipt of an NFT
    /// @dev Required to accept ERC721 tokens
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
