// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ElectionSpace.sol";

/// @title Deploy ElectionSpace
/// @notice Deploys a standalone ElectionSpace pointed at the existing VoteChainRegistry.
///         Used for manual ElectionSpace deployment. Election creation in production
///         is handled by the Registry via createElectionForAdminWithConfig.
contract DeployElectionSpace is Script {
    function run() external {
        address registry = vm.envAddress("REGISTRY_ADDRESS");
        address spaceAdmin = vm.envAddress("SPACE_ADMIN");
        uint256 spaceId = vm.envUint("SPACE_ID");
        uint256 candidateCount = vm.envUint("CANDIDATE_COUNT");
        string memory title = vm.envString("SPACE_TITLE");
        string memory metadataURI = vm.envString("SPACE_METADATA_URI");

        vm.startBroadcast();

        ElectionSpace space = new ElectionSpace(
            registry,
            spaceAdmin,
            spaceId,
            candidateCount,
            title,
            metadataURI,
            msg.sender, // initialActor = deployer
            new address[](0), // no initial voters
            0,
            0,
            0,
            0 // no phase schedule yet
        );

        console.log("ElectionSpace deployed to:", address(space));
        console.log("Space ID:", spaceId);
        console.log("Registry:", registry);
        console.log("Admin:", spaceAdmin);

        vm.stopBroadcast();
    }
}
