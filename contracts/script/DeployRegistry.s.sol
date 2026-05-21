// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/VoteChainRegistry.sol";

contract DeployRegistry is Script {
    function run() external {
        // The private key should be loaded from the environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the VoteChainRegistry
        VoteChainRegistry registry = new VoteChainRegistry();

        // Log the deployed address
        console.log("VoteChainRegistry deployed to:", address(registry));

        vm.stopBroadcast();
    }
}
