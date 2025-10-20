// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Clones} from "openzeppelin-contracts/proxy/Clones.sol";

/// @title Merchant Factory
/// @notice Factory for creating merchant clones
contract MerchantFactoryCore {
    address public immutable implementation;
    address[] public allMerchants;

    mapping(address => address[]) public merchantsByCreator;
    mapping(address => bool) public isAIAgent;

    event MerchantCreated(
        address indexed merchant,
        address indexed creator,
        string name
    );
    event AIAgentRegistered(address indexed agent);

    error NotAIAgent();
    error InvalidImplementation();

    constructor(address _implementation) {
        if (_implementation.code.length == 0) revert InvalidImplementation();
        implementation = _implementation;
    }

    function registerAIAgent(address agent) external {
        isAIAgent[agent] = true;
        emit AIAgentRegistered(agent);
    }

    function createMerchant(string memory name) external returns (address) {
        if (!isAIAgent[msg.sender]) revert NotAIAgent();

        address clone = Clones.clone(implementation);

        allMerchants.push(clone);
        merchantsByCreator[msg.sender].push(clone);

        emit MerchantCreated(clone, msg.sender, name);
        return clone;
    }

    function getMerchantsByCreator(
        address creator
    ) external view returns (address[] memory) {
        return merchantsByCreator[creator];
    }

    function getAllMerchants() external view returns (address[] memory) {
        return allMerchants;
    }

    function getMerchantCount() external view returns (uint256) {
        return allMerchants.length;
    }
}
