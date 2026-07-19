// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { ElectionSpace } from "../src/ElectionSpace.sol";
import { VoteChainRegistry } from "../src/VoteChainRegistry.sol";

contract CommitBySignatureTest is Test {
    event Committed(uint256 indexed spaceId, address indexed voter, bytes32 indexed commitment);
    event CommitRelayed(uint256 indexed spaceId, address indexed voter, address indexed relayer, bytes32 commitment);

    function _deployClean()
        internal
        returns (address spaceAdmin, ElectionSpace space, uint256 spaceId)
    {
        VoteChainRegistry registry = new VoteChainRegistry(address(this));
        spaceAdmin = makeAddr("space-admin");
        registry.setAdmin(spaceAdmin, true);

        address spaceAddr;
        (, spaceId, spaceAddr) = registry.createElectionForAdminWithConfig(
            spaceAdmin,
            "Pemilihan Ketua HIMAFORKA",
            "supabase://proposal-drafts/commit-by-signature",
            2,
            new address[](0),
            0,
            0,
            0,
            0
        );
        space = ElectionSpace(spaceAddr);
    }

    function _commitment(ElectionSpace space, address voter, uint256 candidateId, bytes32 salt)
        internal
        view
        returns (bytes32)
    {
        return keccak256(abi.encode(candidateId, salt, voter, address(space), block.chainid));
    }

    function _signCommit(
        ElectionSpace space,
        uint256 privateKey,
        address voter,
        bytes32 commitment,
        uint256 nonce,
        uint256 deadline
    ) internal view returns (bytes memory) {
        bytes32 digest = space.commitDigest(voter, commitment, nonce, deadline);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_commitBySignature_eoa_emits_event_and_reveals() external {
        (address spaceAdmin, ElectionSpace space, uint256 spaceId) = _deployClean();
        uint256 voterPk = 0xA11CE;
        address voter = vm.addr(voterPk);
        address relayer = makeAddr("relayer");

        vm.prank(spaceAdmin);
        space.registerVoter(voter);

        bytes32 salt = bytes32(uint256(123));
        bytes32 commitment = _commitment(space, voter, 1, salt);
        uint256 nonce = space.commitNonces(voter);
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory signature = _signCommit(space, voterPk, voter, commitment, nonce, deadline);

        vm.expectEmit(true, true, true, true, address(space));
        emit Committed(spaceId, voter, commitment);
        vm.expectEmit(true, true, true, true, address(space));
        emit CommitRelayed(spaceId, voter, relayer, commitment);

        vm.prank(relayer);
        space.commitBySignature(voter, commitment, nonce, deadline, signature);

        assertTrue(space.hasCommitted(voter));
        assertEq(space.commitmentOf(voter), commitment);
        assertEq(space.commitNonces(voter), nonce + 1);

        vm.prank(spaceAdmin);
        space.transitionToNextPhase();
        vm.prank(voter);
        space.revealVote(1, salt);
        assertTrue(space.hasRevealed(voter));
        assertEq(space.voteCount(1), 1);
    }

    function test_commitBySignature_invalidSigner_reverts() external {
        (address spaceAdmin, ElectionSpace space,) = _deployClean();
        uint256 voterPk = 0xA11CE;
        uint256 attackerPk = 0xBAD;
        address voter = vm.addr(voterPk);

        vm.prank(spaceAdmin);
        space.registerVoter(voter);

        bytes32 commitment = bytes32(uint256(456));
        uint256 nonce = space.commitNonces(voter);
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory signature = _signCommit(space, attackerPk, voter, commitment, nonce, deadline);

        vm.expectRevert(ElectionSpace.InvalidSignature.selector);
        space.commitBySignature(voter, commitment, nonce, deadline, signature);
    }

    function test_commitBySignature_expired_reverts() external {
        (address spaceAdmin, ElectionSpace space,) = _deployClean();
        uint256 voterPk = 0xA11CE;
        address voter = vm.addr(voterPk);

        vm.prank(spaceAdmin);
        space.registerVoter(voter);

        bytes32 commitment = bytes32(uint256(789));
        uint256 nonce = space.commitNonces(voter);
        uint256 deadline = block.timestamp + 1;
        bytes memory signature = _signCommit(space, voterPk, voter, commitment, nonce, deadline);

        vm.warp(deadline + 1);
        vm.expectRevert(ElectionSpace.SignatureExpired.selector);
        space.commitBySignature(voter, commitment, nonce, deadline, signature);
    }
}
