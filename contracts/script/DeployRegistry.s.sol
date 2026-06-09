// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/VoteChainRegistry.sol";

contract DeployRegistry is Script {
    function run() external {
        // Retrieve the initial superadmin address from the environment
        address initialSuperAdmin = vm.envAddress("INITIAL_SUPERADMIN");
        require(initialSuperAdmin != address(0), "INITIAL_SUPERADMIN environment variable not set");

        // Start broadcasting transactions using the account provided via CLI (--private-key or --interactive)
        vm.startBroadcast();

        // Deploy the VoteChainRegistry with the specified superadmin
        VoteChainRegistry registry = new VoteChainRegistry(initialSuperAdmin);

        // Log the deployed address
        console.log("VoteChainRegistry deployed to:", address(registry));

        vm.stopBroadcast();
    }
}
