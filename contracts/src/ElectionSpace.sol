// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRegistryRoleOracle {
    function isSuperAdmin(address account) external view returns (bool);
}

contract ElectionSpace {
    enum Phase {
        Registration,
        Commit,
        Reveal,
        Ended
    }

    enum ElectionStatus {
        Active,
        Suspended,
        Terminated
    }

    address public immutable registry;
    address public immutable spaceAdmin;
    uint256 public immutable spaceId;
    uint256 public immutable candidateCount;

    string public title;
    string public metadataURI;
    Phase public currentPhase;
    ElectionStatus public status;

    mapping(address => bool) public isWhitelisted;
    mapping(address => bool) public hasCommitted;
    mapping(address => bool) public hasRevealed;
    mapping(address => bytes32) public commitmentOf;
    mapping(uint256 => uint256) public voteCount;

    event PhaseChanged(uint256 indexed spaceId, Phase indexed previousPhase, Phase indexed newPhase, address actor);
    event WhitelistUpdated(uint256 indexed spaceId, address indexed voter, bool isRegistered, address actor);
    event Committed(uint256 indexed spaceId, address indexed voter, bytes32 indexed commitment);
    event Revealed(uint256 indexed spaceId, address indexed voter, uint256 indexed candidateId, uint256 newVoteCount);
    event ElectionStatusChanged(uint256 indexed spaceId, ElectionStatus indexed status, address indexed actor, string reasonCode);
    event ElectionMetadataUpdated(uint256 indexed spaceId, string title, string metadataURI, address actor);

    error NotAuthorized();
    error NotRegistry();
    error NotRegistered();
    error WrongPhase(Phase expected, Phase actual);
    error InvalidPhaseTransition(Phase current, Phase requested);
    error AlreadyRegistered();
    error AlreadyCommitted();
    error AlreadyRevealed();
    error NotCommittedYet();
    error CommitmentMismatch();
    error InvalidCandidate();
    error ElectionSuspended();
    error ElectionTerminated();

    constructor(
        address _registry,
        address _spaceAdmin,
        uint256 _spaceId,
        uint256 _candidateCount,
        string memory _title,
        string memory _metadataURI
    ) {
        if (_registry == address(0) || _spaceAdmin == address(0)) revert NotAuthorized();
        if (_candidateCount == 0) revert InvalidCandidate();

        registry = _registry;
        spaceAdmin = _spaceAdmin;
        spaceId = _spaceId;
        candidateCount = _candidateCount;
        title = _title;
        metadataURI = _metadataURI;

        currentPhase = Phase.Registration;
        status = ElectionStatus.Active;
    }

    modifier onlyRegistry() {
        if (msg.sender != registry) revert NotRegistry();
        _;
    }

    modifier onlySpaceAdminOrSuperAdmin() {
        if (msg.sender != spaceAdmin && !IRegistryRoleOracle(registry).isSuperAdmin(msg.sender)) {
            revert NotAuthorized();
        }
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

    modifier onlyActive() {
        if (status == ElectionStatus.Suspended) revert ElectionSuspended();
        if (status == ElectionStatus.Terminated) revert ElectionTerminated();
        _;
    }

    function transitionToNextPhase() external onlySpaceAdminOrSuperAdmin onlyActive {
        if (currentPhase == Phase.Ended) {
            revert InvalidPhaseTransition(Phase.Ended, Phase.Ended);
        }

        Phase previous = currentPhase;
        currentPhase = Phase(uint8(currentPhase) + 1);

        emit PhaseChanged(spaceId, previous, currentPhase, msg.sender);
    }

    function registerVoter(address voter)
        external
        onlySpaceAdminOrSuperAdmin
        onlyActive
        onlyPhase(Phase.Registration)
    {
        if (isWhitelisted[voter]) revert AlreadyRegistered();

        isWhitelisted[voter] = true;
        emit WhitelistUpdated(spaceId, voter, true, msg.sender);
    }

    function registerVoters(address[] calldata voters)
        external
        onlySpaceAdminOrSuperAdmin
        onlyActive
        onlyPhase(Phase.Registration)
    {
        for (uint256 i = 0; i < voters.length; i++) {
            address voter = voters[i];
            if (!isWhitelisted[voter]) {
                isWhitelisted[voter] = true;
                emit WhitelistUpdated(spaceId, voter, true, msg.sender);
            }
        }
    }

    function unregisterVoter(address voter)
        external
        onlySpaceAdminOrSuperAdmin
        onlyActive
        onlyPhase(Phase.Registration)
    {
        isWhitelisted[voter] = false;
        emit WhitelistUpdated(spaceId, voter, false, msg.sender);
    }

    function commitVote(bytes32 commitment)
        external
        onlyRegistered
        onlyActive
        onlyPhase(Phase.Commit)
    {
        if (hasCommitted[msg.sender]) revert AlreadyCommitted();

        hasCommitted[msg.sender] = true;
        commitmentOf[msg.sender] = commitment;

        emit Committed(spaceId, msg.sender, commitment);
    }

    function revealVote(uint256 candidateId, bytes32 salt)
        external
        onlyRegistered
        onlyActive
        onlyPhase(Phase.Reveal)
    {
        if (!hasCommitted[msg.sender]) revert NotCommittedYet();
        if (hasRevealed[msg.sender]) revert AlreadyRevealed();
        if (candidateId == 0 || candidateId > candidateCount) revert InvalidCandidate();

        bytes32 recomputed = keccak256(abi.encodePacked(candidateId, salt));
        if (recomputed != commitmentOf[msg.sender]) revert CommitmentMismatch();

        hasRevealed[msg.sender] = true;
        voteCount[candidateId] += 1;

        emit Revealed(spaceId, msg.sender, candidateId, voteCount[candidateId]);
    }

    function getResult(uint256 candidateId) external view onlyPhase(Phase.Ended) returns (uint256) {
        if (candidateId == 0 || candidateId > candidateCount) revert InvalidCandidate();
        return voteCount[candidateId];
    }

    function setSuspended(bool suspended, address actor, string calldata reasonCode) external onlyRegistry {
        if (status == ElectionStatus.Terminated) revert ElectionTerminated();

        status = suspended ? ElectionStatus.Suspended : ElectionStatus.Active;
        emit ElectionStatusChanged(spaceId, status, actor, reasonCode);
    }

    function terminate(address actor, string calldata reasonCode) external onlyRegistry {
        status = ElectionStatus.Terminated;
        emit ElectionStatusChanged(spaceId, status, actor, reasonCode);
    }

    function updateMetadata(string calldata _title, string calldata _metadataURI, address actor) external onlyRegistry {
        title = _title;
        metadataURI = _metadataURI;
        emit ElectionMetadataUpdated(spaceId, _title, _metadataURI, actor);
    }
}
