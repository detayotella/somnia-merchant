// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console2} from "forge-std/Script.sol";
import {MerchantNPC} from "../src/MerchantNPC.sol";

contract DeploySimple is Script {
    function run() external returns (MerchantNPC merchant) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address merchantOwner = vm.envAddress("MERCHANT_OWNER");

        console2.log("Deploying with account:", vm.addr(deployerKey));
        console2.log("Merchant owner:", merchantOwner);

        vm.startBroadcast(deployerKey);

        merchant = new MerchantNPC();
        console2.log("Contract deployed at:", address(merchant));

        merchant.mintMerchant(merchantOwner, "Genesis Merchant");
        console2.log("Genesis Merchant minted to:", merchantOwner);

        vm.stopBroadcast();

        console2.log("");
        console2.log("===========================================");
        console2.log("Deployment Complete!");
        console2.log("===========================================");
        console2.log("Contract Address:", address(merchant));
        console2.log("Owner:", merchantOwner);
        console2.log("===========================================");
    }
}
