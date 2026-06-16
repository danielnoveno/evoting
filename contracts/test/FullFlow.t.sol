// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { ElectionSpace } from "../src/ElectionSpace.sol";
import { VoteChainRegistry } from "../src/VoteChainRegistry.sol";

/**
 * @title FullFlowTest
 * @dev Skenario testing lengkap: migrasi → whitelist → commit → reveal → hasil.
 *      Semua fase bisa dijalankan dalam hitungan detik dengan vm.warp().
 *
 * Cara pakai:
 *   forge test --match-path test/FullFlow.t.sol -vvv
 *
 * Ada 2 varian utama:
 *   test_fullFlow_manual     → admin pindah fase manual
 *   test_fullFlow_schedule   → jadwal otomatis dengan waktu singkat
 *   test_fullFlow_security   → edge cases keamanan
 */
contract FullFlowTest is Test {
    function _commitment(ElectionSpace space, address voter, uint256 candidateId, bytes32 salt)
        internal
        view
        returns (bytes32)
    {
        return keccak256(abi.encode(candidateId, salt, voter, address(space), block.chainid));
    }

    /// @dev Deploy VoteChainRegistry + ElectionSpace, return semua address penting
    function _deployClean()
        internal
        returns (
            VoteChainRegistry registry,
            address spaceAdmin,
            address voter1,
            address voter2,
            ElectionSpace space,
            uint256 spaceId
        )
    {
        address superAdmin = address(this);
        spaceAdmin = makeAddr("space-admin");
        voter1 = makeAddr("voter-1");
        voter2 = makeAddr("voter-2");

        registry = new VoteChainRegistry(superAdmin);

        (uint256 proposalId, uint256 sid, address spaceAddr) = registry.createElectionForAdmin(
            spaceAdmin,
            "Pemilihan Ketua HIMAFORKA 2026/2027",
            "supabase://proposal-drafts/full-flow-test",
            2 // 2 kandidat
        );

        spaceId = sid;
        assertEq(spaceId, 1);
        assertTrue(spaceAddr != address(0));
        assertEq(registry.spaceById(spaceId), spaceAddr);

        space = ElectionSpace(spaceAddr);
        assertEq(space.spaceAdmin(), spaceAdmin);
        assertEq(space.candidateCount(), 2);
        assertEq(uint8(space.currentPhase()), uint8(ElectionSpace.Phase.Registration));
    }

    // ══════════════════════════════════════════════
    // 1. MANUAL PHASE TRANSITION
    // ══════════════════════════════════════════════
    function test_fullFlow_manual() external {
        (
            VoteChainRegistry registry,
            address spaceAdmin,
            address voter1,
            address voter2,
            ElectionSpace space,
            uint256 spaceId
        ) = _deployClean();

        // ── REGISTRATION: whitelist ──
        assertEq(uint8(space.phase()), uint8(ElectionSpace.Phase.Registration));

        vm.prank(spaceAdmin);
        space.registerVoter(voter1);
        vm.prank(spaceAdmin);
        space.registerVoter(voter2);
        assertTrue(space.isWhitelisted(voter1));
        assertTrue(space.isWhitelisted(voter2));

        // Double register → revert
        vm.prank(spaceAdmin);
        vm.expectRevert(ElectionSpace.AlreadyRegistered.selector);
        space.registerVoter(voter1);

        // ── TRANSISI → COMMIT ──
        vm.prank(spaceAdmin);
        space.transitionToNextPhase();
        assertEq(uint8(space.phase()), uint8(ElectionSpace.Phase.Commit));

        // Whitelist setelah Commit → revert
        vm.prank(spaceAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                ElectionSpace.WrongPhase.selector,
                ElectionSpace.Phase.Registration,
                ElectionSpace.Phase.Commit
            )
        );
        space.registerVoter(makeAddr("voter-late"));

        // ── COMMIT ──
        bytes32 salt1 = bytes32(uint256(12345));
        bytes32 salt2 = bytes32(uint256(67890));
        bytes32 commit1 = _commitment(space, voter1, 1, salt1);
        bytes32 commit2 = _commitment(space, voter2, 2, salt2);

        vm.prank(voter1);
        space.commitVote(commit1);
        assertTrue(space.hasCommitted(voter1));

        vm.prank(voter2);
        space.commitVote(commit2);
        assertTrue(space.hasCommitted(voter2));

        // Double commit → revert
        vm.prank(voter1);
        vm.expectRevert(ElectionSpace.AlreadyCommitted.selector);
        space.commitVote(commit1);

        // Non-whitelisted → revert
        vm.prank(makeAddr("non-voter"));
        vm.expectRevert(ElectionSpace.NotRegistered.selector);
        space.commitVote(bytes32(uint256(999)));

        // ── TRANSISI → REVEAL ──
        vm.prank(spaceAdmin);
        space.transitionToNextPhase();
        assertEq(uint8(space.phase()), uint8(ElectionSpace.Phase.Reveal));

        // Commit di fase Reveal → revert
        vm.prank(voter1);
        vm.expectRevert(
            abi.encodeWithSelector(
                ElectionSpace.WrongPhase.selector,
                ElectionSpace.Phase.Commit,
                ElectionSpace.Phase.Reveal
            )
        );
        space.commitVote(bytes32(uint256(1)));

        // ── REVEAL ──
        vm.prank(voter1);
        space.revealVote(1, salt1);
        assertTrue(space.hasRevealed(voter1));
        assertEq(space.voteCount(1), 1);

        vm.prank(voter2);
        space.revealVote(2, salt2);
        assertTrue(space.hasRevealed(voter2));
        assertEq(space.voteCount(2), 1);

        // Double reveal → revert
        vm.prank(voter1);
        vm.expectRevert(ElectionSpace.AlreadyRevealed.selector);
        space.revealVote(1, salt1);

        // Hasil belum bisa dibaca sebelum Ended
        vm.expectRevert(
            abi.encodeWithSelector(
                ElectionSpace.WrongPhase.selector,
                ElectionSpace.Phase.Ended,
                ElectionSpace.Phase.Reveal
            )
        );
        space.getResult(1);

        // ── TRANSISI → ENDED ──
        vm.prank(spaceAdmin);
        space.transitionToNextPhase();
        assertEq(uint8(space.phase()), uint8(ElectionSpace.Phase.Ended));

        // ── HASIL ──
        assertEq(space.getResult(1), 1); // voter1 pilih K1
        assertEq(space.getResult(2), 1); // voter2 pilih K2

        // Transition dari Ended → revert
        vm.prank(spaceAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                ElectionSpace.InvalidPhaseTransition.selector,
                ElectionSpace.Phase.Ended,
                ElectionSpace.Phase.Ended
            )
        );
        space.transitionToNextPhase();

        // Reveal di Ended → revert
        vm.prank(voter2);
        vm.expectRevert(
            abi.encodeWithSelector(
                ElectionSpace.WrongPhase.selector,
                ElectionSpace.Phase.Reveal,
                ElectionSpace.Phase.Ended
            )
        );
        space.revealVote(2, salt2);
    }

    // ══════════════════════════════════════════════
    // 2. TIME-BASED SCHEDULE (5 menit per fase)
    // ══════════════════════════════════════════════
    function test_fullFlow_schedule() external {
        (
            VoteChainRegistry registry,
            address spaceAdmin,
            address voter1,
            address voter2,
            ElectionSpace space,
            uint256 spaceId
        ) = _deployClean();

        uint256 now_ = block.timestamp;

        // ── REGISTRATION + whitelist ──
        assertEq(uint8(space.phase()), uint8(ElectionSpace.Phase.Registration));

        // Daftarkan whitelist SEBELUM atur jadwal
        vm.prank(spaceAdmin);
        space.registerVoter(voter1);
        vm.prank(spaceAdmin);
        space.registerVoter(voter2);

        address voter3 = makeAddr("voter-3");
        address voterNotCommited = makeAddr("voter-no-commit");
        vm.prank(spaceAdmin);
        space.registerVoter(voter3);
        vm.prank(spaceAdmin);
        space.registerVoter(voterNotCommited); // didaftarkan, tapi tidak akan commit

        assertTrue(space.isWhitelisted(voter1));
        assertTrue(space.isWhitelisted(voter2));
        assertTrue(space.isWhitelisted(voter3));
        assertTrue(space.isWhitelisted(voterNotCommited));

        // Atur jadwal pendek:
        //   Commit: 60 detik → 360 detik
        //   Reveal: 360 detik → 660 detik
        uint256 commitStart = now_ + 60;
        uint256 commitEnd = now_ + 360;
        uint256 revealStart = now_ + 360;
        uint256 revealEnd = now_ + 660;

        vm.prank(spaceAdmin);
        space.setPhaseSchedule(commitStart, commitEnd, revealStart, revealEnd);

        emit log_named_uint("Waktu sekarang", now_);
        emit log_named_uint("Commit mulai", commitStart);
        emit log_named_uint("Reveal selesai", revealEnd);

        // Masih Registration
        assertEq(uint8(space.phase()), uint8(ElectionSpace.Phase.Registration));

        // ── COMMIT ──
        vm.warp(commitStart + 10);
        assertEq(uint8(space.phase()), uint8(ElectionSpace.Phase.Commit));

        // Whitelist setelah Commit → revert
        vm.prank(spaceAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                ElectionSpace.WrongPhase.selector,
                ElectionSpace.Phase.Registration,
                ElectionSpace.Phase.Commit
            )
        );
        space.registerVoter(makeAddr("voter-late"));

        bytes32 salt1 = bytes32(uint256(111));
        bytes32 salt2 = bytes32(uint256(222));
        bytes32 c1 = _commitment(space, voter1, 1, salt1);
        bytes32 c2 = _commitment(space, voter2, 2, salt2);
        bytes32 c3 = _commitment(space, voter3, 1, salt2);
        vm.prank(voter1);
        space.commitVote(c1);
        vm.prank(voter2);
        space.commitVote(c2);
        vm.prank(voter3);
        space.commitVote(c3);

        assertTrue(space.hasCommitted(voter1));
        assertTrue(space.hasCommitted(voter2));
        assertTrue(space.hasCommitted(voter3));
        assertFalse(space.hasCommitted(voterNotCommited));

        // ── REVEAL ──
        vm.warp(revealStart + 10);
        assertEq(uint8(space.phase()), uint8(ElectionSpace.Phase.Reveal));

        vm.prank(voter1);
        space.revealVote(1, salt1);
        vm.prank(voter2);
        space.revealVote(2, salt2);
        vm.prank(voter3);
        space.revealVote(1, salt2);

        // voterNotCommited → NotCommittedYet
        vm.prank(voterNotCommited);
        vm.expectRevert(ElectionSpace.NotCommittedYet.selector);
        space.revealVote(1, bytes32(uint256(0)));

        assertEq(space.voteCount(1), 2); // voter1 + voter3
        assertEq(space.voteCount(2), 1); // voter2

        // ── ENDED ──
        vm.warp(revealEnd + 10);
        assertEq(uint8(space.phase()), uint8(ElectionSpace.Phase.Ended));

        assertEq(space.getResult(1), 2);
        assertEq(space.getResult(2), 1);

        // Reveal di Ended → revert
        vm.prank(voter2);
        vm.expectRevert(
            abi.encodeWithSelector(
                ElectionSpace.WrongPhase.selector,
                ElectionSpace.Phase.Reveal,
                ElectionSpace.Phase.Ended
            )
        );
        space.revealVote(2, salt2);
    }

    // ══════════════════════════════════════════════
    // 3. COPYCAT ATTACK (commitment replay)
    // ══════════════════════════════════════════════
    function test_fullFlow_copycat_attack() external {
        (
            VoteChainRegistry registry,
            address spaceAdmin,
            address voter1,
            address voter2,
            ElectionSpace space,
            uint256 spaceId
        ) = _deployClean();

        vm.prank(spaceAdmin);
        space.registerVoter(voter1);
        vm.prank(spaceAdmin);
        space.registerVoter(voter2);

        bytes32 salt1 = bytes32(uint256(777));
        bytes32 commit1 = _commitment(space, voter1, 1, salt1);

        vm.prank(spaceAdmin);
        space.transitionToNextPhase();

        vm.prank(voter1);
        space.commitVote(commit1);
        vm.prank(voter2);
        space.commitVote(commit1); // copycat

        vm.prank(spaceAdmin);
        space.transitionToNextPhase();

        vm.prank(voter1);
        space.revealVote(1, salt1); // original reveal sukses

        // Copycat reveal harus gagal (commitment mismatch karena address voter berbeda)
        vm.prank(voter2);
        vm.expectRevert(ElectionSpace.CommitmentMismatch.selector);
        space.revealVote(1, salt1);
    }

    // ══════════════════════════════════════════════
    // 4. INVALID CANDIDATE ID
    // ══════════════════════════════════════════════
    function test_fullFlow_invalid_candidate() external {
        address superAdmin = address(this);
        address admin2 = makeAddr("admin-candidate-test");
        address voterA = makeAddr("voter-a");

        VoteChainRegistry r2 = new VoteChainRegistry(superAdmin);
        (,, address sAddr) = r2.createElectionForAdmin(admin2, "test", "", 2);
        ElectionSpace s2 = ElectionSpace(sAddr);

        vm.prank(admin2);
        s2.registerVoter(voterA);

        bytes32 salt = bytes32(uint256(42));
        bytes32 com = _commitment(s2, voterA, 1, salt);

        vm.prank(admin2);
        s2.transitionToNextPhase();
        vm.prank(voterA);
        s2.commitVote(com);

        vm.prank(admin2);
        s2.transitionToNextPhase();

        vm.prank(voterA);
        vm.expectRevert(ElectionSpace.InvalidCandidate.selector);
        s2.revealVote(0, salt);

        vm.prank(voterA);
        vm.expectRevert(ElectionSpace.InvalidCandidate.selector);
        s2.revealVote(3, salt);

        vm.prank(voterA);
        s2.revealVote(1, salt);
        assertEq(s2.voteCount(1), 1);
    }

    // ══════════════════════════════════════════════
    // 4. RELAYER REVEAL
    // ══════════════════════════════════════════════
    function test_fullFlow_relayer_reveal() external {
        (
            VoteChainRegistry registry,
            address spaceAdmin,
            address voter1,
            address voter2,
            ElectionSpace space,
            uint256 spaceId
        ) = _deployClean();

        address relayer = makeAddr("relayer");
        vm.prank(spaceAdmin);
        space.registerVoter(voter1);

        vm.prank(spaceAdmin);
        space.transitionToNextPhase(); // → Commit

        bytes32 salt = bytes32(uint256(2026));
        bytes32 commitment = _commitment(space, voter1, 2, salt);
        vm.prank(voter1);
        space.commitVote(commitment);

        vm.prank(spaceAdmin);
        space.transitionToNextPhase(); // → Reveal

        // Relayer reveal untuk voter1
        vm.prank(relayer);
        space.revealFor(voter1, 2, salt);

        assertTrue(space.hasRevealed(voter1));
        assertEq(space.voteCount(2), 1);
    }

    // ══════════════════════════════════════════════
    // 5. BATCH WHITELIST
    // ══════════════════════════════════════════════
    function test_fullFlow_batch_whitelist() external {
        (
            VoteChainRegistry registry,
            address spaceAdmin,
            address voter1,
            address voter2,
            ElectionSpace space,
            uint256 spaceId
        ) = _deployClean();

        address[] memory voters = new address[](5);
        for (uint256 i = 0; i < 5; i++) {
            voters[i] = makeAddr(string(abi.encodePacked("batch-voter-", vm.toString(i))));
        }

        vm.prank(spaceAdmin);
        space.registerVoters(voters);

        for (uint256 i = 0; i < 5; i++) {
            assertTrue(space.isWhitelisted(voters[i]));
        }

        // Batch sesudah Registration → revert
        vm.prank(spaceAdmin);
        space.transitionToNextPhase();

        address[] memory lateVoters = new address[](1);
        lateVoters[0] = makeAddr("too-late");
        vm.prank(spaceAdmin);
        vm.expectRevert(
            abi.encodeWithSelector(
                ElectionSpace.WrongPhase.selector,
                ElectionSpace.Phase.Registration,
                ElectionSpace.Phase.Commit
            )
        );
        space.registerVoters(lateVoters);
    }

    // ══════════════════════════════════════════════
    // 6. INVALID COMMITMENT (bytes32(0))
    // ══════════════════════════════════════════════
    function test_fullFlow_invalid_commitment() external {
        (
            VoteChainRegistry registry,
            address spaceAdmin,
            address voter1,
            address voter2,
            ElectionSpace space,
            uint256 spaceId
        ) = _deployClean();

        vm.prank(spaceAdmin);
        space.registerVoter(voter1);

        vm.prank(spaceAdmin);
        space.transitionToNextPhase(); // → Commit

        vm.prank(voter1);
        vm.expectRevert(ElectionSpace.InvalidCommitment.selector);
        space.commitVote(bytes32(0));
    }
}
