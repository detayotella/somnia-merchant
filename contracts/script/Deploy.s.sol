// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console2} from "forge-std/Script.sol";
import {MerchantNPC} from "../src/MerchantNPC.sol";

contract Deploy is Script {
    function run() external returns (MerchantNPC merchant) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address merchantOwner = vm.envAddress("MERCHANT_OWNER");
        string memory rpcUrl = vm.envString("SOMNIA_RPC_URL");

        console2.log("Using RPC", rpcUrl);
        console2.log("Merchant owner", merchantOwner);

        vm.startBroadcast(deployerKey);
        merchant = new MerchantNPC();
        merchant.mintMerchant(merchantOwner, "Genesis Merchant");
        vm.stopBroadcast();

        console2.log("MerchantNPC deployed at", address(merchant));

        string memory root = vm.projectRoot();
        string memory configPath = string.concat(root, "/ai_agent/config.json");

        string memory data = vm.serializeAddress(
            "config",
            "contract_address",
            address(merchant)
        );
        data = vm.serializeString("config", "rpc_url", rpcUrl);
        data = vm.serializeString("config", "network", "somnia-testnet");
        data = vm.serializeString(
            "config",
            "merchant_owner",
            vm.toString(merchantOwner)
        );
        data = vm.serializeUint("config", "poll_interval_seconds", 30);
        data = vm.serializeString(
            "config",
            "private_key_env",
            "AI_AGENT_PRIVATE_KEY"
        );

        vm.writeJson(data, configPath);

        console2.log("Updated AI agent config at", configPath);
    }
}
