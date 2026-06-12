// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title VoteChainUnified
 * @dev Kontrak tunggal untuk mengelola banyak pemilihan sekaligus.
 */
contract VoteChainUnified {
    enum Phase {
        Registration,
        Commit,
        Reveal,
        Ended
    }

    struct Election {
        string title;
        uint256 candidateCount;
        Phase currentPhase;
        address admin;
        bool exists;
        mapping(address => bool) isWhitelisted;
        mapping(address => bool) hasCommitted;
        mapping(address => bool) hasRevealed;
        mapping(address => bytes32) commitmentOf;
        mapping(uint256 => uint256) voteCount;
    }

    address public superAdmin;
    uint256 public nextElectionId = 1;
    mapping(uint256 => Election) public elections;

    event ElectionCreated(uint256 indexed electionId, string title, address indexed admin);
    event PhaseChanged(uint256 indexed electionId, Phase previousPhase, Phase newPhase);
    event WhitelistUpdated(uint256 indexed electionId, address indexed voter, bool isRegistered);
    event Committed(uint256 indexed electionId, address indexed voter, bytes32 commitment);
    event Revealed(uint256 indexed electionId, address indexed voter, uint256 candidateId);

    error NotSuperAdmin();
    error NotElectionAdmin();
    error ElectionNotFound();
    error NotRegistered();
    error WrongPhase(Phase expected, Phase actual);
    error InvalidCandidate();
    error AlreadyVoted();
    error CommitmentMismatch();

    constructor() {
        superAdmin = msg.sender;
    }

    modifier onlySuperAdmin() {
        if (msg.sender != superAdmin) revert NotSuperAdmin();
        _;
    }

    modifier onlyElectionAdmin(uint256 electionId) {
        if (elections[electionId].admin != msg.sender && msg.sender != superAdmin) {
            revert NotElectionAdmin();
        }
        _;
    }

    // --- Manajemen Pemilihan ---

    function createElection(string calldata title, uint256 candidateCount, address admin)
        external
        onlySuperAdmin
        returns (uint256 electionId)
    {
        electionId = nextElectionId++;
        Election storage e = elections[electionId];
        e.title = title;
        e.candidateCount = candidateCount;
        e.admin = admin;
        e.currentPhase = Phase.Registration;
        e.exists = true;

        emit ElectionCreated(electionId, title, admin);
    }

    function transitionPhase(uint256 electionId) external onlyElectionAdmin(electionId) {
        Election storage e = elections[electionId];
        if (!e.exists) revert ElectionNotFound();
        if (e.currentPhase == Phase.Ended) revert WrongPhase(Phase.Reveal, Phase.Ended);

        Phase previous = e.currentPhase;
        e.currentPhase = Phase(uint8(e.currentPhase) + 1);

        emit PhaseChanged(electionId, previous, e.currentPhase);
    }

    // --- Manajemen Pemilih ---

    function registerVoter(uint256 electionId, address voter)
        external
        onlyElectionAdmin(electionId)
    {
        Election storage e = elections[electionId];
        if (e.currentPhase != Phase.Registration) {
            revert WrongPhase(Phase.Registration, e.currentPhase);
        }

        e.isWhitelisted[voter] = true;
        emit WhitelistUpdated(electionId, voter, true);
    }

    function registerVoters(uint256 electionId, address[] calldata voters)
        external
        onlyElectionAdmin(electionId)
    {
        Election storage e = elections[electionId];
        if (e.currentPhase != Phase.Registration) {
            revert WrongPhase(Phase.Registration, e.currentPhase);
        }

        for (uint256 i = 0; i < voters.length; i++) {
            e.isWhitelisted[voters[i]] = true;
            emit WhitelistUpdated(electionId, voters[i], true);
        }
    }

    // --- Proses Voting (Commit-Reveal) ---

    function commitVote(uint256 electionId, bytes32 commitment) external {
        Election storage e = elections[electionId];
        if (!e.isWhitelisted[msg.sender]) revert NotRegistered();
        if (e.currentPhase != Phase.Commit) revert WrongPhase(Phase.Commit, e.currentPhase);
        if (e.hasCommitted[msg.sender]) revert AlreadyVoted();

        e.hasCommitted[msg.sender] = true;
        e.commitmentOf[msg.sender] = commitment;

        emit Committed(electionId, msg.sender, commitment);
    }

    function revealVote(uint256 electionId, uint256 candidateId, bytes32 salt) external {
        Election storage e = elections[electionId];
        if (e.currentPhase != Phase.Reveal) revert WrongPhase(Phase.Reveal, e.currentPhase);
        if (!e.hasCommitted[msg.sender]) revert NotRegistered();
        if (e.hasRevealed[msg.sender]) revert AlreadyVoted();
        if (candidateId == 0 || candidateId > e.candidateCount) revert InvalidCandidate();

        bytes32 recomputed = keccak256(abi.encodePacked(candidateId, salt));
        if (recomputed != e.commitmentOf[msg.sender]) revert CommitmentMismatch();

        e.hasRevealed[msg.sender] = true;
        e.voteCount[candidateId]++;

        emit Revealed(electionId, msg.sender, candidateId);
    }

    // --- Getter ---

    function getResult(uint256 electionId, uint256 candidateId) external view returns (uint256) {
        Election storage e = elections[electionId];
        if (e.currentPhase != Phase.Ended) revert WrongPhase(Phase.Ended, e.currentPhase);
        return e.voteCount[candidateId];
    }

    function getElectionInfo(uint256 electionId)
        external
        view
        returns (string memory title, uint256 candidateCount, Phase currentPhase, address admin)
    {
        Election storage e = elections[electionId];
        return (e.title, e.candidateCount, e.currentPhase, e.admin);
    }

    function checkVoterStatus(uint256 electionId, address voter)
        external
        view
        returns (bool whitelisted, bool committed, bool revealed)
    {
        Election storage e = elections[electionId];
        return (e.isWhitelisted[voter], e.hasCommitted[voter], e.hasRevealed[voter]);
    }
}
