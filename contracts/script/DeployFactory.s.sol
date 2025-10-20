// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/MerchantFactory.sol";

contract DeployFactory is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        MerchantFactory factory = new MerchantFactory();

        console.log("MerchantFactory deployed to:", address(factory));

        vm.stopBroadcast();
    }
}
