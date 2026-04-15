// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VoteChainMVP {
    enum Phase {
        Registration,
        Commit,
        Reveal,
        Ended
    }

    address public immutable admin;
    Phase public currentPhase;
    uint256 public immutable candidateCount;

    mapping(address => bool) public isWhitelisted;
    mapping(address => bool) public hasCommitted;
    mapping(address => bool) public hasRevealed;
    mapping(address => bytes32) public commitmentOf;
    mapping(uint256 => uint256) public voteCount;

    event PhaseChanged(Phase indexed previousPhase, Phase indexed newPhase, uint256 timestamp);
    event WhitelistUpdated(address indexed voter, bool isRegistered);
    event Committed(address indexed voter, bytes32 indexed commitment);
    event Revealed(address indexed voter, uint256 indexed candidateId, uint256 newVoteCount);

    error NotAdmin();
    error NotRegistered();
    error WrongPhase(Phase expected, Phase actual);
    error InvalidPhaseTransition(Phase current, Phase requested);
    error AlreadyRegistered();
    error AlreadyCommitted();
    error AlreadyRevealed();
    error NotCommittedYet();
    error CommitmentMismatch();
    error InvalidCandidate();

    constructor(uint256 _candidateCount) {
        if (_candidateCount == 0) revert InvalidCandidate();

        admin = msg.sender;
        currentPhase = Phase.Registration;
        candidateCount = _candidateCount;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier onlyRegistered() {
        if (!isWhitelisted[msg.sender]) revert NotRegistered();
        _;
    }

    modifier onlyPhase(Phase expected) {
        if (currentPhase != expected) revert WrongPhase(expected, currentPhase);
        _;
    }

    function transitionToNextPhase() external onlyAdmin {
        if (currentPhase == Phase.Ended) {
            revert InvalidPhaseTransition(Phase.Ended, Phase.Ended);
        }

        Phase previous = currentPhase;
        currentPhase = Phase(uint8(currentPhase) + 1);

        emit PhaseChanged(previous, currentPhase, block.timestamp);
    }

    function registerVoter(address voter) external onlyAdmin onlyPhase(Phase.Registration) {
        if (isWhitelisted[voter]) revert AlreadyRegistered();

        isWhitelisted[voter] = true;
        emit WhitelistUpdated(voter, true);
    }

    function unregisterVoter(address voter) external onlyAdmin onlyPhase(Phase.Registration) {
        isWhitelisted[voter] = false;
        emit WhitelistUpdated(voter, false);
    }

    function commitVote(bytes32 commitment) external onlyRegistered onlyPhase(Phase.Commit) {
        if (hasCommitted[msg.sender]) revert AlreadyCommitted();

        hasCommitted[msg.sender] = true;
        commitmentOf[msg.sender] = commitment;

        emit Committed(msg.sender, commitment);
    }

    function revealVote(uint256 candidateId, bytes32 salt)
        external
        onlyRegistered
        onlyPhase(Phase.Reveal)
    {
        if (!hasCommitted[msg.sender]) revert NotCommittedYet();
        if (hasRevealed[msg.sender]) revert AlreadyRevealed();
        if (candidateId == 0 || candidateId > candidateCount) revert InvalidCandidate();

        bytes32 recomputed = keccak256(abi.encodePacked(candidateId, salt));
        if (recomputed != commitmentOf[msg.sender]) revert CommitmentMismatch();

        hasRevealed[msg.sender] = true;
        voteCount[candidateId] += 1;

        emit Revealed(msg.sender, candidateId, voteCount[candidateId]);
    }

    function getResult(uint256 candidateId) external view onlyPhase(Phase.Ended) returns (uint256) {
        if (candidateId == 0 || candidateId > candidateCount) revert InvalidCandidate();
        return voteCount[candidateId];
    }
}
