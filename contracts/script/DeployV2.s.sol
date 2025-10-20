// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import "../src/MerchantNPCCoreV2.sol";
import "../src/MerchantFactoryCoreV2.sol";

contract DeployV2 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy MerchantNPCCoreV2 (implementation)
        console2.log("Deploying MerchantNPCCoreV2...");
        MerchantNPCCoreV2 merchantImpl = new MerchantNPCCoreV2();
        console2.log("MerchantNPCCoreV2 deployed at:", address(merchantImpl));

        // Deploy MerchantFactoryCoreV2
        console2.log("Deploying MerchantFactoryCoreV2...");
        MerchantFactoryCoreV2 factory = new MerchantFactoryCoreV2(
            address(merchantImpl)
        );
        console2.log("MerchantFactoryCoreV2 deployed at:", address(factory));

        vm.stopBroadcast();

        // Log deployment summary
        console2.log("\n=== V2 Deployment Summary ===");
        console2.log("Implementation:", address(merchantImpl));
        console2.log("Factory:", address(factory));
    }
}
