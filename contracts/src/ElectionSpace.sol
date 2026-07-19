// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRegistryRoleOracle {
    function isSuperAdmin(address account) external view returns (bool);
    function isPlatformAdmin(address account) external view returns (bool);
}

interface IERC1271 {
    function isValidSignature(bytes32 hash, bytes calldata signature)
        external
        view
        returns (bytes4 magicValue);
}

contract ElectionSpace {
    enum Phase {
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
    address public spaceAdmin;
    uint256 public immutable spaceId;
    uint256 public immutable candidateCount;

    string public title;
    string public metadataURI;
    Phase public currentPhase;
    ElectionStatus public status;
    uint256 public commitStartsAt;
    uint256 public commitEndsAt;
    uint256 public revealStartsAt;
    uint256 public revealEndsAt;

    mapping(address => bool) public isWhitelisted;
    mapping(address => bool) public hasCommitted;
    mapping(address => bool) public hasRevealed;
    mapping(address => uint256) public commitNonces;
    mapping(address => bytes32) public commitmentOf;
    mapping(uint256 => uint256) public voteCount;
    address[] private whitelistedVoters;
    mapping(address => uint256) private whitelistIndexPlusOne;

    event PhaseChanged(
        uint256 indexed spaceId, Phase indexed previousPhase, Phase indexed newPhase, address actor
    );
    event WhitelistUpdated(
        uint256 indexed spaceId, address indexed voter, bool isRegistered, address actor
    );
    event Committed(uint256 indexed spaceId, address indexed voter, bytes32 indexed commitment);
    event Revealed(
        uint256 indexed spaceId,
        address indexed voter,
        uint256 indexed candidateId,
        uint256 newVoteCount
    );
    event RevealRelayed(
        uint256 indexed spaceId, address indexed voter, address indexed relayer, uint256 candidateId
    );
    event CommitRelayed(
        uint256 indexed spaceId, address indexed voter, address indexed relayer, bytes32 commitment
    );
    event ElectionStatusChanged(
        uint256 indexed spaceId,
        ElectionStatus indexed status,
        address indexed actor,
        string reasonCode
    );
    event PhaseScheduleUpdated(
        uint256 indexed spaceId,
        uint256 commitStartsAt,
        uint256 commitEndsAt,
        uint256 revealStartsAt,
        uint256 revealEndsAt,
        address actor
    );
    event InitialConfigurationApplied(
        uint256 indexed spaceId,
        uint256 voterCount,
        uint256 commitStartsAt,
        uint256 commitEndsAt,
        uint256 revealStartsAt,
        uint256 revealEndsAt,
        address actor
    );
    event SpaceAdminTransferred(
        uint256 indexed spaceId,
        address indexed previousAdmin,
        address indexed newAdmin,
        address actor,
        string reasonCode
    );

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
    error InvalidVoter();
    error InvalidCommitment();
    error ElectionSuspended();
    error ElectionTerminated();
    error InvalidPhaseSchedule();
    error InvalidAdmin();
    error InvalidSignature();
    error SignatureExpired();

    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 private constant COMMIT_TYPEHASH =
        keccak256("CommitVote(address voter,bytes32 commitment,uint256 nonce,uint256 deadline)");
    bytes32 private constant EIP712_NAME_HASH = keccak256("VoteChainElectionSpace");
    bytes32 private constant EIP712_VERSION_HASH = keccak256("1");
    bytes4 private constant ERC1271_MAGICVALUE = 0x1626ba7e;
    uint256 private constant SECP256K1N_DIV_2 =
        0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;

    constructor(
        address _registry,
        address _spaceAdmin,
        uint256 _spaceId,
        uint256 _candidateCount,
        string memory _title,
        string memory _metadataURI,
        address _initialActor,
        address[] memory _initialVoters,
        uint256 _commitStartsAt,
        uint256 _commitEndsAt,
        uint256 _revealStartsAt,
        uint256 _revealEndsAt
    ) {
        if (_registry == address(0) || _spaceAdmin == address(0)) {
            revert NotAuthorized();
        }
        if (_candidateCount == 0) revert InvalidCandidate();

        registry = _registry;
        spaceAdmin = _spaceAdmin;
        spaceId = _spaceId;
        candidateCount = _candidateCount;
        title = _title;
        metadataURI = _metadataURI;

        currentPhase = Phase.Commit;
        status = ElectionStatus.Active;

        if (_initialVoters.length > 0) {
            _registerInitialVoters(_initialVoters, _initialActor);
        }

        if (
            _commitStartsAt != 0 || _commitEndsAt != 0 || _revealStartsAt != 0 || _revealEndsAt != 0
        ) {
            _setPhaseSchedule(
                _commitStartsAt, _commitEndsAt, _revealStartsAt, _revealEndsAt, _initialActor
            );
        }

        if (_initialVoters.length > 0 || _commitStartsAt != 0) {
            emit InitialConfigurationApplied(
                spaceId,
                _initialVoters.length,
                commitStartsAt,
                commitEndsAt,
                revealStartsAt,
                revealEndsAt,
                _initialActor
            );
        }
    }

    modifier onlyRegistry() {
        if (msg.sender != registry) revert NotRegistry();
        _;
    }

    modifier onlySpaceAdminOrSuperAdmin() {
        IRegistryRoleOracle roleOracle = IRegistryRoleOracle(registry);
        bool isActiveSpaceAdmin = msg.sender == spaceAdmin && roleOracle.isPlatformAdmin(msg.sender);
        if (!isActiveSpaceAdmin && !roleOracle.isSuperAdmin(msg.sender)) {
            revert NotAuthorized();
        }
        _;
    }

    modifier onlyRegistered() {
        if (!isWhitelisted[msg.sender]) revert NotRegistered();
        _;
    }

    modifier onlyPhase(Phase expected) {
        Phase actual = phase();
        if (actual != expected) revert WrongPhase(expected, actual);
        _;
    }

    modifier onlyCommitWindow() {
        if (
            commitStartsAt != 0
                && (block.timestamp < commitStartsAt || block.timestamp >= commitEndsAt)
        ) {
            revert WrongPhase(Phase.Commit, phase());
        }
        _;
    }

    /// @notice Blocks whitelist/schedule mutations once the commit window has closed.
    /// @dev Prevents an admin from adding/removing voters or rescheduling after
    ///      votes may already have been committed (phase-gap freeze).
    modifier onlyBeforeCommitEnds() {
        if (commitStartsAt != 0 && block.timestamp >= commitEndsAt) {
            revert WrongPhase(Phase.Commit, phase());
        }
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

    function setPhaseSchedule(
        uint256 _commitStartsAt,
        uint256 _commitEndsAt,
        uint256 _revealStartsAt,
        uint256 _revealEndsAt
    ) external onlySpaceAdminOrSuperAdmin onlyActive onlyPhase(Phase.Commit) onlyBeforeCommitEnds {
        _setPhaseSchedule(
            _commitStartsAt, _commitEndsAt, _revealStartsAt, _revealEndsAt, msg.sender
        );
    }

    function _setPhaseSchedule(
        uint256 _commitStartsAt,
        uint256 _commitEndsAt,
        uint256 _revealStartsAt,
        uint256 _revealEndsAt,
        address actor
    ) internal {
        if (
            _commitStartsAt == 0 || _commitEndsAt <= _commitStartsAt
                || _revealStartsAt < _commitEndsAt || _revealEndsAt <= _revealStartsAt
        ) revert InvalidPhaseSchedule();

        commitStartsAt = _commitStartsAt;
        commitEndsAt = _commitEndsAt;
        revealStartsAt = _revealStartsAt;
        revealEndsAt = _revealEndsAt;

        emit PhaseScheduleUpdated(
            spaceId, _commitStartsAt, _commitEndsAt, _revealStartsAt, _revealEndsAt, actor
        );
    }

    function _registerInitialVoters(address[] memory voters, address actor) internal {
        for (uint256 i = 0; i < voters.length; i++) {
            address voter = voters[i];
            if (voter == address(0)) revert InvalidVoter();
            if (_addWhitelistedVoter(voter)) {
                emit WhitelistUpdated(spaceId, voter, true, actor);
            }
        }
    }

    function _addWhitelistedVoter(address voter) internal returns (bool added) {
        if (isWhitelisted[voter]) return false;
        isWhitelisted[voter] = true;
        whitelistedVoters.push(voter);
        whitelistIndexPlusOne[voter] = whitelistedVoters.length;
        return true;
    }

    function _removeWhitelistedVoter(address voter) internal returns (bool removed) {
        if (!isWhitelisted[voter]) return false;

        uint256 index = whitelistIndexPlusOne[voter] - 1;
        uint256 lastIndex = whitelistedVoters.length - 1;

        if (index != lastIndex) {
            address lastVoter = whitelistedVoters[lastIndex];
            whitelistedVoters[index] = lastVoter;
            whitelistIndexPlusOne[lastVoter] = index + 1;
        }

        whitelistedVoters.pop();
        delete whitelistIndexPlusOne[voter];
        isWhitelisted[voter] = false;
        return true;
    }

    function getWhitelistedVoters() external view returns (address[] memory) {
        return whitelistedVoters;
    }

    function getWhitelistedVoterCount() external view returns (uint256) {
        return whitelistedVoters.length;
    }

    function getWhitelistedVoterAt(uint256 index) external view returns (address) {
        return whitelistedVoters[index];
    }

    function phase() public view returns (Phase) {
        if (commitStartsAt == 0) return currentPhase;
        if (block.timestamp < commitStartsAt) return Phase.Commit;
        if (block.timestamp < commitEndsAt) return Phase.Commit;
        if (block.timestamp < revealEndsAt && block.timestamp >= revealStartsAt) {
            return Phase.Reveal;
        }
        if (block.timestamp < revealStartsAt) return Phase.Commit;
        return Phase.Ended;
    }

    function registerVoter(address voter)
        external
        onlySpaceAdminOrSuperAdmin
        onlyActive
        onlyPhase(Phase.Commit)
        onlyBeforeCommitEnds
    {
        if (voter == address(0)) revert InvalidVoter();
        if (isWhitelisted[voter]) revert AlreadyRegistered();

        _addWhitelistedVoter(voter);
        emit WhitelistUpdated(spaceId, voter, true, msg.sender);
    }

    function registerVoters(address[] calldata voters)
        external
        onlySpaceAdminOrSuperAdmin
        onlyActive
        onlyPhase(Phase.Commit)
        onlyBeforeCommitEnds
    {
        for (uint256 i = 0; i < voters.length; i++) {
            address voter = voters[i];
            if (voter == address(0)) revert InvalidVoter();
            if (_addWhitelistedVoter(voter)) {
                emit WhitelistUpdated(spaceId, voter, true, msg.sender);
            }
        }
    }

    function unregisterVoter(address voter)
        external
        onlySpaceAdminOrSuperAdmin
        onlyActive
        onlyPhase(Phase.Commit)
        onlyBeforeCommitEnds
    {
        if (_removeWhitelistedVoter(voter)) {
            emit WhitelistUpdated(spaceId, voter, false, msg.sender);
        }
    }

    function commitVote(bytes32 commitment)
        external
        onlyActive
        onlyPhase(Phase.Commit)
        onlyCommitWindow
    {
        _commit(msg.sender, commitment);
    }

    function commitBySignature(
        address voter,
        bytes32 commitment,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external onlyActive onlyPhase(Phase.Commit) onlyCommitWindow {
        if (block.timestamp > deadline) revert SignatureExpired();
        if (nonce != commitNonces[voter]) revert InvalidSignature();

        _verifyCommitSignature(voter, commitment, nonce, deadline, signature);
        commitNonces[voter] = nonce + 1;
        _commit(voter, commitment);

        emit CommitRelayed(spaceId, voter, msg.sender, commitment);
    }

    /// @notice commitFor was REMOVED for security: it allowed any caller to
    ///         pre-commit a garbage commitment for a whitelisted voter, permanently
    ///         suppressing that voter's real vote (vote-suppression DoS). Voters
    ///         commit via commitVote (msg.sender == voter). Do not re-add without
    ///         an EIP-712 voter signature verified on-chain.

    function _commit(address voter, bytes32 commitment) internal {
        if (voter == address(0)) revert InvalidVoter();
        if (!isWhitelisted[voter]) revert NotRegistered();
        if (hasCommitted[voter]) revert AlreadyCommitted();
        if (commitment == bytes32(0)) revert InvalidCommitment();

        hasCommitted[voter] = true;
        commitmentOf[voter] = commitment;

        emit Committed(spaceId, voter, commitment);
    }

    function domainSeparator() public view returns (bytes32) {
        return keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                EIP712_NAME_HASH,
                EIP712_VERSION_HASH,
                block.chainid,
                address(this)
            )
        );
    }

    function commitDigest(address voter, bytes32 commitment, uint256 nonce, uint256 deadline)
        public
        view
        returns (bytes32)
    {
        bytes32 structHash = keccak256(abi.encode(COMMIT_TYPEHASH, voter, commitment, nonce, deadline));
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator(), structHash));
    }

    function _verifyCommitSignature(
        address voter,
        bytes32 commitment,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) internal view {
        if (voter == address(0)) revert InvalidVoter();

        bytes32 digest = commitDigest(voter, commitment, nonce, deadline);
        if (voter.code.length > 0) {
            (bool ok, bytes memory result) = voter.staticcall(
                abi.encodeCall(IERC1271.isValidSignature, (digest, signature))
            );
            if (!ok || result.length < 32 || abi.decode(result, (bytes4)) != ERC1271_MAGICVALUE) {
                revert InvalidSignature();
            }
            return;
        }

        if (_recoverSigner(digest, signature) != voter) revert InvalidSignature();
    }

    function _recoverSigner(bytes32 digest, bytes calldata signature) internal pure returns (address) {
        if (signature.length != 65) revert InvalidSignature();

        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        if (v < 27) v += 27;
        if (v != 27 && v != 28) revert InvalidSignature();
        if (uint256(s) > SECP256K1N_DIV_2) revert InvalidSignature();

        address signer = ecrecover(digest, v, r, s);
        if (signer == address(0)) revert InvalidSignature();
        return signer;
    }

    function revealVote(uint256 candidateId, bytes32 salt)
        external
        onlyRegistered
        onlyActive
        onlyPhase(Phase.Reveal)
    {
        _reveal(msg.sender, candidateId, salt);
    }

    function revealFor(address voter, uint256 candidateId, bytes32 salt)
        external
        onlyActive
        onlyPhase(Phase.Reveal)
    {
        _reveal(voter, candidateId, salt);
        emit RevealRelayed(spaceId, voter, msg.sender, candidateId);
    }

    function _reveal(address voter, uint256 candidateId, bytes32 salt) internal {
        if (voter == address(0)) revert InvalidVoter();
        if (!isWhitelisted[voter]) revert NotRegistered();
        if (!hasCommitted[voter]) revert NotCommittedYet();
        if (hasRevealed[voter]) revert AlreadyRevealed();
        if (candidateId == 0 || candidateId > candidateCount) revert InvalidCandidate();

        bytes32 recomputed =
            keccak256(abi.encode(candidateId, salt, voter, address(this), block.chainid));
        if (recomputed != commitmentOf[voter]) revert CommitmentMismatch();

        hasRevealed[voter] = true;
        voteCount[candidateId] += 1;

        emit Revealed(spaceId, voter, candidateId, voteCount[candidateId]);
    }

    function getResult(uint256 candidateId) external view onlyPhase(Phase.Ended) returns (uint256) {
        if (candidateId == 0 || candidateId > candidateCount) revert InvalidCandidate();
        return voteCount[candidateId];
    }

    function setSuspended(bool suspended, address actor, string calldata reasonCode)
        external
        onlyRegistry
    {
        if (status == ElectionStatus.Terminated) revert ElectionTerminated();

        status = suspended ? ElectionStatus.Suspended : ElectionStatus.Active;
        emit ElectionStatusChanged(spaceId, status, actor, reasonCode);
    }

    function transferSpaceAdmin(address newAdmin, address actor, string calldata reasonCode)
        external
        onlyRegistry
    {
        if (newAdmin == address(0)) revert InvalidAdmin();

        address previousAdmin = spaceAdmin;
        spaceAdmin = newAdmin;

        emit SpaceAdminTransferred(spaceId, previousAdmin, newAdmin, actor, reasonCode);
    }

    function terminate(address actor, string calldata reasonCode) external onlyRegistry {
        status = ElectionStatus.Terminated;
        emit ElectionStatusChanged(spaceId, status, actor, reasonCode);
    }
}
