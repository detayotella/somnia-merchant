// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {MerchantNPC} from "../src/MerchantNPC.sol";

contract MerchantNPCTest is Test {
    MerchantNPC internal merchant;
    address internal deployer = address(0xBEEF);
    address internal merchantOwner = address(0xA11CE);
    address internal buyer = address(0xCAFE);

    function setUp() public {
        vm.prank(deployer);
        merchant = new MerchantNPC();

        vm.prank(deployer);
        merchant.mintMerchant(merchantOwner, "Arcadian Trader");
    }

    function testMintMerchant() public {
        assertEq(merchant.ownerOf(1), merchantOwner);
        assertEq(merchant.merchantNameOf(1), "Arcadian Trader");
        assertEq(merchant.totalMerchants(), 1);
    }

    function testAddItemAndBuyFlow() public {
        vm.startPrank(merchantOwner);
        merchant.addItem(1, "Photon Blade", 1 ether, 3);
        vm.stopPrank();

        MerchantNPC.Item memory stored = merchant.getItem(1, 0);
        assertEq(stored.price, 1 ether);
        assertEq(stored.qty, 3);
        assertTrue(stored.active);

        vm.deal(buyer, 2 ether);
        vm.prank(buyer);
        merchant.buyItem{value: 1 ether}(1, 0);

        stored = merchant.getItem(1, 0);
        assertEq(stored.qty, 2);
        assertEq(merchant.profitOf(1), 1 ether);
    }

    function testWithdrawProfit() public {
        vm.prank(merchantOwner);
        merchant.addItem(1, "Neural Module", 0.5 ether, 1);

        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        merchant.buyItem{value: 0.5 ether}(1, 0);

        uint256 ownerBalanceBefore = merchantOwner.balance;

        vm.prank(merchantOwner);
        merchant.withdrawProfit(1);

        assertEq(merchantOwner.balance - ownerBalanceBefore, 0.5 ether);
        assertEq(merchant.profitOf(1), 0);
    }

    function testOnlyControllerCanAdd() public {
        vm.expectRevert(MerchantNPC.MerchantNPC__Unauthorized.selector);
        merchant.addItem(1, "Forbidden", 1, 1);
    }

    function testRevertOnIncorrectPayment() public {
        vm.prank(merchantOwner);
        merchant.addItem(1, "Plasma Pistol", 1 ether, 1);

        vm.deal(buyer, 1 ether);
        vm.expectRevert(MerchantNPC.MerchantNPC__IncorrectPayment.selector);
        vm.prank(buyer);
        merchant.buyItem{value: 0.5 ether}(1, 0);
    }
}
