// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { VoteChainRegistry } from "../src/VoteChainRegistry.sol";
import { ElectionSpace } from "../src/ElectionSpace.sol";

contract VoteChainRegistryTest is Test {
    VoteChainRegistry registry;
    address superAdmin = address(this);
    address spaceAdmin = makeAddr("space-admin");
    address replacementAdmin = makeAddr("replacement-admin");
    address voter1 = makeAddr("voter-1");
    address voter2 = makeAddr("voter-2");

    function setUp() public {
        registry = new VoteChainRegistry(superAdmin);
        registry.setAdmin(spaceAdmin, true);
    }

    function _deployConfiguredSpace() internal returns (uint256 spaceId, ElectionSpace space) {
        address[] memory voters = new address[](2);
        voters[0] = voter1;
        voters[1] = voter2;

        uint256 commitStartsAt = block.timestamp + 10;
        uint256 commitEndsAt = block.timestamp + 20;
        uint256 revealStartsAt = commitEndsAt;
        uint256 revealEndsAt = block.timestamp + 30;

        (uint256 proposalId, uint256 deployedSpaceId, address spaceAddress) = registry.createElectionForAdminWithConfig(
            spaceAdmin,
            "Pemilihan Ketua HIMAFORKA",
            "supabase://proposal-drafts/example",
            2,
            voters,
            commitStartsAt,
            commitEndsAt,
            revealStartsAt,
            revealEndsAt
        );

        spaceId = deployedSpaceId;
        space = ElectionSpace(spaceAddress);

        assertEq(proposalId, 1);
        assertEq(spaceId, 1);
        assertEq(registry.spaceById(spaceId), spaceAddress);
    }

    function test_constructor_rejects_zero_address() external {
        vm.expectRevert(VoteChainRegistry.InvalidAdmin.selector);
        new VoteChainRegistry(address(0));
    }

    function test_super_admin_can_add_and_remove_super_admin() external {
        address extra = makeAddr("extra-superadmin");

        registry.addSuperAdmin(extra);
        assertTrue(registry.isSuperAdmin(extra));

        registry.removeSuperAdmin(extra);
        assertFalse(registry.isSuperAdmin(extra));
    }

    function test_cannot_remove_root_super_admin() external {
        vm.expectRevert(VoteChainRegistry.InvalidAdmin.selector);
        registry.removeSuperAdmin(superAdmin);
    }

    function test_set_admin_rejects_zero_address() external {
        vm.expectRevert(VoteChainRegistry.InvalidAdmin.selector);
        registry.setAdmin(address(0), true);
    }

    function test_create_election_for_admin_with_config_sets_whitelist_and_schedule() external {
        (, ElectionSpace space) = _deployConfiguredSpace();

        assertEq(space.spaceAdmin(), spaceAdmin);
        assertTrue(space.isWhitelisted(voter1));
        assertTrue(space.isWhitelisted(voter2));
        assertGt(space.commitStartsAt(), 0);
        assertGt(space.commitEndsAt(), space.commitStartsAt());
        assertEq(space.revealStartsAt(), space.commitEndsAt());
        assertGt(space.revealEndsAt(), space.revealStartsAt());
    }

    function test_non_super_admin_cannot_deploy_space() external {
        vm.prank(spaceAdmin);
        vm.expectRevert(VoteChainRegistry.NotSuperAdmin.selector);
        registry.createElectionForAdminWithConfig(spaceAdmin, "Pemilihan", "ipfs://x", 2, new address[](0), 0, 0, 0, 0);
    }

    function test_create_election_rejects_invalid_admin_and_candidate_count() external {
        vm.expectRevert(VoteChainRegistry.InvalidAdmin.selector);
        registry.createElectionForAdminWithConfig(address(0), "Pemilihan", "ipfs://x", 2, new address[](0), 0, 0, 0, 0);

        vm.expectRevert(VoteChainRegistry.InvalidCandidateCount.selector);
        registry.createElectionForAdminWithConfig(spaceAdmin, "Pemilihan", "ipfs://x", 0, new address[](0), 0, 0, 0, 0);
    }

    function test_suspend_unsuspend_and_terminate_space() external {
        (uint256 spaceId, ElectionSpace space) = _deployConfiguredSpace();

        registry.suspendSpace(spaceId, "AUDIT_CHECK");
        assertEq(uint8(space.status()), uint8(ElectionSpace.ElectionStatus.Suspended));

        registry.unsuspendSpace(spaceId, "RESOLVED");
        assertEq(uint8(space.status()), uint8(ElectionSpace.ElectionStatus.Active));

        registry.terminateSpace(spaceId, "TERMINATED_BY_POLICY");
        assertEq(uint8(space.status()), uint8(ElectionSpace.ElectionStatus.Terminated));
    }

    function test_non_super_admin_cannot_suspend_or_terminate() external {
        (uint256 spaceId,) = _deployConfiguredSpace();

        vm.startPrank(spaceAdmin);
        vm.expectRevert(VoteChainRegistry.NotSuperAdmin.selector);
        registry.suspendSpace(spaceId, "NOPE");
        vm.expectRevert(VoteChainRegistry.NotSuperAdmin.selector);
        registry.terminateSpace(spaceId, "NOPE");
        vm.stopPrank();
    }

    function test_transfer_space_admin_requires_platform_admin() external {
        (uint256 spaceId,) = _deployConfiguredSpace();

        vm.expectRevert(VoteChainRegistry.NotPlatformAdmin.selector);
        registry.transferSpaceAdmin(spaceId, replacementAdmin, "TRANSFER");
    }

    function test_super_admin_can_transfer_space_admin_to_platform_admin() external {
        (uint256 spaceId, ElectionSpace space) = _deployConfiguredSpace();
        registry.setAdmin(replacementAdmin, true);

        registry.transferSpaceAdmin(spaceId, replacementAdmin, "ADMIN_CHANGED");

        assertEq(space.spaceAdmin(), replacementAdmin);
    }
}
