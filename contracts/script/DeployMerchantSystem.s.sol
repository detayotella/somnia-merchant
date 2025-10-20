// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {MerchantNPCCore} from "../src/MerchantNPCCore.sol";
import {MerchantFactoryCore} from "../src/MerchantFactoryCore.sol";

contract DeployMerchantSystem is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy MerchantNPCCore implementation
        console.log("\nStep 1: Deploying MerchantNPCCore implementation...");
        MerchantNPCCore implementation = new MerchantNPCCore();
        console.log(
            "MerchantNPCCore Implementation deployed to:",
            address(implementation)
        );

        // Step 2: Deploy Factory with implementation address
        console.log("\nStep 2: Deploying MerchantFactoryCore...");
        MerchantFactoryCore factory = new MerchantFactoryCore(
            address(implementation)
        );
        console.log("MerchantFactoryCore deployed to:", address(factory));

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("Implementation:", address(implementation));
        console.log("Factory:", address(factory));
        console.log("========================");
    }
}
