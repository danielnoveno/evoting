// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ElectionSpace} from "../src/ElectionSpace.sol";
import {VoteChainRegistry} from "../src/VoteChainRegistry.sol";

contract AdminClient {
    function submitProposal(VoteChainRegistry registry, uint256 candidateCount) external returns (uint256) {
        return registry.submitProposal("Pemilihan Ketua", "ipfs://proposal", candidateCount);
    }

    function createElection(VoteChainRegistry registry, uint256 proposalId)
        external
        returns (uint256, address)
    {
        return registry.createElectionFromProposal(proposalId);
    }

    function registerVoter(ElectionSpace space, address voter) external {
        space.registerVoter(voter);
    }

    function transitionToNextPhase(ElectionSpace space) external {
        space.transitionToNextPhase();
    }
}

contract VoterClient {
    function commit(ElectionSpace space, bytes32 commitment) external {
        space.commitVote(commitment);
    }

    function reveal(ElectionSpace space, uint256 candidateId, bytes32 salt) external {
        space.revealVote(candidateId, salt);
    }
}

contract VoteChainMVPTest {
    function _commitment(ElectionSpace space, address voter, uint256 candidateId, bytes32 salt)
        internal
        view
        returns (bytes32)
    {
        return keccak256(abi.encode(candidateId, salt, voter, address(space), block.chainid));
    }

    function _createApprovedElection(uint256 candidateCount)
        internal
        returns (VoteChainRegistry registry, AdminClient admin, VoterClient voter1, VoterClient voter2, uint256 spaceId, ElectionSpace space)
    {
        registry = new VoteChainRegistry(address(this));
        admin = new AdminClient();
        voter1 = new VoterClient();
        voter2 = new VoterClient();

        registry.setAdmin(address(admin), true);

        uint256 proposalId = admin.submitProposal(registry, candidateCount);
        registry.reviewProposal(proposalId, true);

        address spaceAddress;
        (spaceId, spaceAddress) = admin.createElection(registry, proposalId);
        space = ElectionSpace(spaceAddress);
    }

    function test_super_admin_can_crud_admin_and_create_space() external {
        VoteChainRegistry registry = new VoteChainRegistry(address(this));
        AdminClient admin = new AdminClient();

        registry.setAdmin(address(admin), true);
        require(registry.isPlatformAdmin(address(admin)), "admin should be active");

        uint256 proposalId = admin.submitProposal(registry, 2);
        registry.reviewProposal(proposalId, true);

        (uint256 spaceId, address spaceAddress) = admin.createElection(registry, proposalId);

        require(spaceId == 1, "spaceId should be 1");
        require(spaceAddress != address(0), "space address required");
        require(registry.spaceById(1) == spaceAddress, "registry mapping mismatch");
    }

    function test_super_admin_can_deploy_for_offchain_proposal_admin() external {
        VoteChainRegistry registry = new VoteChainRegistry(address(this));
        AdminClient admin = new AdminClient();

        (uint256 proposalId, uint256 spaceId, address spaceAddress) = registry.createElectionForAdmin(
            address(admin),
            "Pemilihan Ketua HIMAFORKA",
            "supabase://proposal-drafts/example",
            2
        );

        ElectionSpace space = ElectionSpace(spaceAddress);
        require(proposalId == 1, "proposalId should be 1");
        require(spaceId == 1, "spaceId should be 1");
        require(space.spaceAdmin() == address(admin), "admin should own space");
        (, , VoteChainRegistry.ProposalStatus status, , , address reviewer,) = registry.proposals(proposalId);
        require(uint8(status) == uint8(VoteChainRegistry.ProposalStatus.Deployed), "proposal deployed");
        require(reviewer == address(this), "superadmin reviewer recorded");
        require(registry.spaceById(1) == spaceAddress, "registry mapping mismatch");
    }

    function test_non_admin_cannot_submit_proposal() external {
        VoteChainRegistry registry = new VoteChainRegistry(address(this));
        AdminClient nonAdmin = new AdminClient();

        try nonAdmin.submitProposal(registry, 2) returns (uint256) {
            revert("expected non-admin revert");
        } catch {}
    }

    function test_commit_reveal_happy_path() external {
        (
            VoteChainRegistry registry,
            AdminClient admin,
            VoterClient voter1,
            ,
            uint256 spaceId,
            ElectionSpace space
        ) = _createApprovedElection(2);

        admin.registerVoter(space, address(voter1));
        admin.transitionToNextPhase(space);

        bytes32 salt = bytes32(uint256(111));
        bytes32 commitment = _commitment(space, address(voter1), 1, salt);

        voter1.commit(space, commitment);
        require(space.hasCommitted(address(voter1)), "voter should be committed");

        admin.transitionToNextPhase(space);
        voter1.reveal(space, 1, salt);
        require(space.hasRevealed(address(voter1)), "voter should be revealed");
        require(space.voteCount(1) == 1, "vote count should be 1");

        admin.transitionToNextPhase(space);
        uint256 result = space.getResult(1);
        require(result == 1, "final result mismatch");

        registry.suspendSpace(spaceId, "AUDIT_CHECK");
        require(uint8(space.status()) == uint8(ElectionSpace.ElectionStatus.Suspended), "space should be suspended");
    }

    function test_non_whitelisted_cannot_commit() external {
        (, AdminClient admin, , VoterClient voter2, , ElectionSpace space) = _createApprovedElection(2);

        admin.transitionToNextPhase(space);

        bytes32 salt = bytes32(uint256(5));
        bytes32 commitment = _commitment(space, address(voter2), 1, salt);

        try voter2.commit(space, commitment) {
            revert("expected non-whitelist commit revert");
        } catch {}
    }

    function test_wrong_phase_commit_rejected() external {
        (, AdminClient admin, VoterClient voter1, , , ElectionSpace space) = _createApprovedElection(2);

        admin.registerVoter(space, address(voter1));

        bytes32 salt = bytes32(uint256(7));
        bytes32 commitment = _commitment(space, address(voter1), 1, salt);

        try voter1.commit(space, commitment) {
            revert("expected wrong phase revert");
        } catch {}
    }

    function test_double_commit_rejected() external {
        (, AdminClient admin, VoterClient voter1, , , ElectionSpace space) = _createApprovedElection(2);

        admin.registerVoter(space, address(voter1));
        admin.transitionToNextPhase(space);

        bytes32 salt = bytes32(uint256(9));
        bytes32 commitment = _commitment(space, address(voter1), 1, salt);

        voter1.commit(space, commitment);

        try voter1.commit(space, commitment) {
            revert("expected double commit revert");
        } catch {}
    }

    function test_reveal_with_wrong_salt_rejected() external {
        (, AdminClient admin, VoterClient voter1, , , ElectionSpace space) = _createApprovedElection(2);

        admin.registerVoter(space, address(voter1));
        admin.transitionToNextPhase(space);

        bytes32 correctSalt = bytes32(uint256(123));
        bytes32 wrongSalt = bytes32(uint256(456));
        bytes32 commitment = _commitment(space, address(voter1), 1, correctSalt);

        voter1.commit(space, commitment);

        admin.transitionToNextPhase(space);

        try voter1.reveal(space, 1, wrongSalt) {
            revert("expected commitment mismatch revert");
        } catch {}
    }

    function test_copycat_commit_cannot_reveal_after_original_reveals() external {
        (, AdminClient admin, VoterClient voter1, VoterClient voter2, , ElectionSpace space) = _createApprovedElection(2);

        admin.registerVoter(space, address(voter1));
        admin.registerVoter(space, address(voter2));
        admin.transitionToNextPhase(space);

        bytes32 salt = bytes32(uint256(777));
        bytes32 voter1Commitment = _commitment(space, address(voter1), 1, salt);

        voter1.commit(space, voter1Commitment);
        voter2.commit(space, voter1Commitment);

        admin.transitionToNextPhase(space);
        voter1.reveal(space, 1, salt);

        try voter2.reveal(space, 1, salt) {
            revert("expected copycat reveal mismatch");
        } catch {}
    }

    function test_super_admin_suspend_blocks_actions() external {
        (VoteChainRegistry registry, AdminClient admin, VoterClient voter1, , uint256 spaceId, ElectionSpace space) =
            _createApprovedElection(2);

        admin.registerVoter(space, address(voter1));
        admin.transitionToNextPhase(space);

        registry.suspendSpace(spaceId, "RULE_VIOLATION");
        require(uint8(space.status()) == uint8(ElectionSpace.ElectionStatus.Suspended), "must be suspended");

        bytes32 salt = bytes32(uint256(99));
        bytes32 commitment = _commitment(space, address(voter1), 1, salt);

        try voter1.commit(space, commitment) {
            revert("expected suspended election revert");
        } catch {}

        registry.unsuspendSpace(spaceId, "RESOLVED");
        voter1.commit(space, commitment);
        require(space.hasCommitted(address(voter1)), "commit should pass after unsuspend");
    }

    function test_super_admin_terminate_blocks_actions() external {
        (VoteChainRegistry registry, AdminClient admin, VoterClient voter1, , uint256 spaceId, ElectionSpace space) =
            _createApprovedElection(2);

        admin.registerVoter(space, address(voter1));
        admin.transitionToNextPhase(space);

        registry.terminateSpace(spaceId, "TERMINATED_BY_POLICY");
        require(uint8(space.status()) == uint8(ElectionSpace.ElectionStatus.Terminated), "must be terminated");

        bytes32 salt = bytes32(uint256(44));
        bytes32 commitment = _commitment(space, address(voter1), 1, salt);

        try voter1.commit(space, commitment) {
            revert("expected terminated election revert");
        } catch {}

        try admin.transitionToNextPhase(space) {
            revert("expected admin phase transition revert on terminated");
        } catch {}
    }
}
