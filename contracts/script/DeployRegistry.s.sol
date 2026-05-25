// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/VoteChainRegistry.sol";

contract DeployRegistry is Script {
    function run() external {
        // Start broadcasting transactions using the account provided via CLI (--private-key or --interactive)
        vm.startBroadcast();

        // Deploy the VoteChainRegistry
        VoteChainRegistry registry = new VoteChainRegistry();

        // Log the deployed address
        console.log("VoteChainRegistry deployed to:", address(registry));

        vm.stopBroadcast();
    }
}
