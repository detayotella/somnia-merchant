// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {MerchantFactory} from "../src/MerchantFactory.sol";
import {MerchantNPC} from "../src/MerchantNPC.sol";

contract MerchantFactoryTest is Test {
    MerchantFactory public factory;
    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);
    address public aiAgent = address(4);

    event MerchantCreated(
        address indexed merchantAddress,
        address indexed owner,
        string name,
        uint256 timestamp
    );

    function setUp() public {
        factory = new MerchantFactory();
        vm.deal(owner, 100 ether);
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }

    function testCreateMerchant() public {
        vm.startPrank(user1);

        (address merchantAddr, uint256 tokenId) = factory.createMerchant(
            "PotionShop",
            "Health Potion",
            10,
            0.1 ether
        );

        assertNotEq(merchantAddr, address(0));
        assertEq(tokenId, 1);
        assertEq(factory.totalMerchants(), 1);

        address[] memory merchants = factory.getMerchantsByOwner(user1);
        assertEq(merchants.length, 1);
        assertEq(merchants[0], merchantAddr);

        vm.stopPrank();
    }

    function testCreateMultipleMerchants() public {
        vm.startPrank(user1);

        (address merchant1, ) = factory.createMerchant(
            "PotionShop",
            "Health Potion",
            10,
            0.1 ether
        );

        (address merchant2, ) = factory.createMerchant(
            "ArmorShop",
            "Iron Armor",
            5,
            0.5 ether
        );

        assertEq(factory.totalMerchants(), 2);

        address[] memory merchants = factory.getMerchantsByOwner(user1);
        assertEq(merchants.length, 2);
        assertEq(merchants[0], merchant1);
        assertEq(merchants[1], merchant2);

        vm.stopPrank();
    }

    function testMultipleOwnersCreateMerchants() public {
        vm.prank(user1);
        (address merchant1, ) = factory.createMerchant(
            "User1Shop",
            "Item1",
            10,
            0.1 ether
        );

        vm.prank(user2);
        (address merchant2, ) = factory.createMerchant(
            "User2Shop",
            "Item2",
            5,
            0.2 ether
        );

        assertEq(factory.totalMerchants(), 2);

        address[] memory user1Merchants = factory.getMerchantsByOwner(user1);
        assertEq(user1Merchants.length, 1);
        assertEq(user1Merchants[0], merchant1);

        address[] memory user2Merchants = factory.getMerchantsByOwner(user2);
        assertEq(user2Merchants.length, 1);
        assertEq(user2Merchants[0], merchant2);
    }

    function testGetAllMerchants() public {
        vm.prank(user1);
        (address merchant1, ) = factory.createMerchant(
            "Shop1",
            "Item1",
            10,
            0.1 ether
        );

        vm.prank(user2);
        (address merchant2, ) = factory.createMerchant(
            "Shop2",
            "Item2",
            5,
            0.2 ether
        );

        address[] memory allMerchants = factory.getAllMerchants();
        assertEq(allMerchants.length, 2);
        assertEq(allMerchants[0], merchant1);
        assertEq(allMerchants[1], merchant2);
    }

    function testRegisterAIAgent() public {
        vm.startPrank(user1);

        (address merchantAddr, ) = factory.createMerchant(
            "PotionShop",
            "Health Potion",
            10,
            0.1 ether
        );

        factory.registerAIAgent(merchantAddr, aiAgent);

        (address merchantOwner, address registeredAI, bool isActive) = factory
            .getMerchantDetails(merchantAddr);

        assertEq(merchantOwner, user1);
        assertEq(registeredAI, aiAgent);
        assertTrue(isActive);

        vm.stopPrank();
    }

    function testCannotRegisterAIAgentForOthersMerchant() public {
        vm.prank(user1);
        (address merchantAddr, ) = factory.createMerchant(
            "PotionShop",
            "Health Potion",
            10,
            0.1 ether
        );

        vm.expectRevert(
            MerchantFactory.MerchantFactory__NotMerchantOwner.selector
        );
        vm.prank(user2);
        factory.registerAIAgent(merchantAddr, aiAgent);
    }

    function testCannotCreateMerchantWithInvalidName() public {
        vm.expectRevert(MerchantFactory.MerchantFactory__InvalidName.selector);
        vm.prank(user1);
        factory.createMerchant("", "Item", 10, 0.1 ether);
    }

    function testCannotCreateMerchantWithLowStock() public {
        vm.expectRevert(MerchantFactory.MerchantFactory__InvalidStock.selector);
        vm.prank(user1);
        factory.createMerchant("Shop", "Item", 0, 0.1 ether);
    }

    function testCannotCreateMerchantWithLowPrice() public {
        vm.expectRevert(MerchantFactory.MerchantFactory__InvalidPrice.selector);
        vm.prank(user1);
        factory.createMerchant("Shop", "Item", 10, 0.0001 ether);
    }

    function testIsMerchant() public {
        vm.prank(user1);
        (address merchantAddr, ) = factory.createMerchant(
            "PotionShop",
            "Health Potion",
            10,
            0.1 ether
        );

        assertTrue(factory.isMerchant(merchantAddr));
        assertFalse(factory.isMerchant(address(999)));
    }

    function testGetMerchantCount() public {
        vm.startPrank(user1);

        factory.createMerchant("Shop1", "Item1", 10, 0.1 ether);
        factory.createMerchant("Shop2", "Item2", 5, 0.2 ether);
        factory.createMerchant("Shop3", "Item3", 8, 0.15 ether);

        assertEq(factory.getMerchantCount(user1), 3);
        assertEq(factory.getMerchantCount(user2), 0);

        vm.stopPrank();
    }

    function testMerchantHasInitialInventory() public {
        vm.prank(user1);
        (address merchantAddr, ) = factory.createMerchant(
            "PotionShop",
            "Health Potion",
            10,
            0.1 ether
        );

        MerchantNPC merchant = MerchantNPC(payable(merchantAddr));
        MerchantNPC.Item[] memory inventory = merchant.getInventory(1);

        assertEq(inventory.length, 1);
        assertEq(inventory[0].name, "Health Potion");
        assertEq(inventory[0].price, 0.1 ether);
        assertEq(inventory[0].qty, 10);
        assertTrue(inventory[0].active);
    }
}
