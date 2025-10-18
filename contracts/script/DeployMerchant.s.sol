// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {MerchantNPC} from "../src/MerchantNPC.sol";

contract DeployMerchant is Script {
    function run() external returns (MerchantNPC) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy contract
        MerchantNPC merchant = new MerchantNPC();
        console.log("MerchantNPC deployed at:", address(merchant));

        vm.stopBroadcast();

        return merchant;
    }
}
