import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BASESCAN_API_URL = 'https://api-sepolia.basescan.org/api'
const BASE_SEPOLIA_CHAIN_ID = 84532

type ContractType = 'registry' | 'election-space'

interface ContractConfig {
  contractName: string
  sourceCode: string
  constructorArguements: string
}

interface BasescanResponse {
  status: string
  message: string
  result: string
}

// ═══════════════════════════════════════════════════════════════════════════
// KONFIGURASI KONTRAK
// Update flattened source + constructor args saat re-deploy
// ═══════════════════════════════════════════════════════════════════════════

function getContractConfig(type: ContractType, contractAddress: string): ContractConfig {
  if (type === 'registry') {
    return {
      contractName: 'VoteChainRegistry',
      sourceCode: getRegistrySource(),
      // Constructor: (superadmin, platformAdmin)
      constructorArguements: encodeConstructorArgs([
        process.env.NEXT_PUBLIC_SUPERADMIN_ADDRESS || '0xF41b1a84FF93C6074fD76860EA1351e2A7197004',
        process.env.NEXT_PUBLIC_PLATFORM_ADMIN_ADDRESS || '0xF41b1a84FF93C6074fD76860EA1351e2A7197004',
      ]),
    }
  }

  // election-space
  return {
    contractName: 'ElectionSpace',
    sourceCode: getElectionSpaceSource(),
    // Constructor: (spaceAdmin, spaceId, title, metadataURI, candidateCount)
    // Note: Registry deploys ElectionSpace, so constructor args differ
    constructorArguements: '',
  }
}

function encodeConstructorArgs(args: string[]): string {
  // Simple ABI encode for address[] — each 32 bytes padded
  return args.map(a => a.toLowerCase().replace('0x', '').padStart(64, '0')).join('')
}

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICATION LOGIC
// ═══════════════════════════════════════════════════════════════════════════

async function verifyContract(
  contractAddress: string,
  config: ContractConfig,
): Promise<{ success: boolean; message: string; guid?: string }> {
  const apiKey = process.env.BASESCAN_API_KEY
  if (!apiKey) {
    return { success: false, message: 'BASESCAN_API_KEY tidak dikonfigurasi di server' }
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    module: 'contract',
    action: 'verifysourcecode',
    contractaddress: contractAddress,
    sourceCode: config.sourceCode,
    contractname: config.contractName,
    compilerversion: 'v0.8.24+commit.e11b9ed9',
    optimizationUsed: '1',
    runs: '200',
    constructorArguements: config.constructorArguements,
    evmversion: 'cancun',
    licenseType: '3', // MIT
  })

  try {
    const response = await fetch(BASESCAN_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    const data: BasescanResponse = await response.json()

    if (data.status === '1') {
      return { success: true, message: 'Verifikasi berhasil', guid: data.result }
    } else {
      return { success: false, message: data.result || 'Verifikasi gagal' }
    }
  } catch (error) {
    return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

async function checkVerificationStatus(guid: string): Promise<{ pending: boolean; verified: boolean; message: string }> {
  const apiKey = process.env.BASESCAN_API_KEY
  if (!apiKey) {
    return { pending: false, verified: false, message: 'BASESCAN_API_KEY tidak dikonfigurasi' }
  }

  try {
    const response = await fetch(
      `${BASESCAN_API_URL}?apikey=${apiKey}&module=contract&action=getverificationstatus&guid=${guid}`
    )
    const data: BasescanResponse = await response.json()

    if (data.result === 'Pending in queue') {
      return { pending: true, verified: false, message: 'Masih dalam antrian verifikasi' }
    } else if (data.result === 'Pass - Verified') {
      return { pending: false, verified: true, message: 'Terverifikasi' }
    } else {
      return { pending: false, verified: false, message: data.result }
    }
  } catch (error) {
    return { pending: false, verified: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// API ROUTE
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractAddress, contractType } = body as {
      contractAddress?: string
      contractType?: ContractType
    }

    if (!contractAddress || typeof contractAddress !== 'string') {
      return NextResponse.json(
        { success: false, message: 'contractAddress wajib diisi' },
        { status: 400 }
      )
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return NextResponse.json(
        { success: false, message: 'Format address tidak valid' },
        { status: 400 }
      )
    }

    // Default to election-space for backward compat
    const type: ContractType = contractType === 'registry' ? 'registry' : 'election-space'
    const config = getContractConfig(type, contractAddress)

    console.log(`[verify-contract] Memulai verifikasi ${type} untuk ${contractAddress}`)
    const result = await verifyContract(contractAddress, config)

    if (result.success && result.guid) {
      console.log(`[verify-contract] Verifikasi dikirim, GUID: ${result.guid}`)

      // Tunggu beberapa detik lalu cek status
      await new Promise(resolve => setTimeout(resolve, 5000))
      const status = await checkVerificationStatus(result.guid)

      return NextResponse.json({
        success: true,
        message: status.message,
        guid: result.guid,
        verified: status.verified,
        pending: status.pending,
        contractType: type,
      })
    }

    console.log(`[verify-contract] Verifikasi gagal: ${result.message}`)
    return NextResponse.json({
      success: false,
      message: result.message,
      contractType: type,
    })
  } catch (error) {
    console.error('[verify-contract] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FLATTENED SOURCE CODE
// Update ini saat contract berubah — generated dari:
//   cd contracts && forge flatten src/VoteChainRegistry.sol > /tmp/registry.sol
//   cd contracts && forge flatten src/ElectionSpace.sol > /tmp/space.sol
// ═══════════════════════════════════════════════════════════════════════════

function getRegistrySource(): string {
  // Auto-generated from forge flatten — jangan edit manual
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRegistryRoleOracle {
    function isSuperAdmin(address account) external view returns (bool);
    function isPlatformAdmin(address account) external view returns (bool);
}

contract VoteChainRegistry {
    address public superAdmin;
    address public platformAdmin;
    mapping(address => bool) public isSuperAdminMap;
    mapping(address => bool) public isPlatformAdminMap;

    struct SpaceConfig {
        uint256 spaceId;
        string title;
        string metadataURI;
        uint256 candidateCount;
        address initialActor;
        uint256 commitStartsAt;
        uint256 commitEndsAt;
        uint256 revealStartsAt;
        uint256 revealEndsAt;
    }

    event ElectionSpaceCreated(uint256 indexed spaceId, address indexed space, address indexed creator);
    event SuperAdminUpdated(address indexed previousAdmin, address indexed newAdmin);
    event PlatformAdminUpdated(address indexed previousAdmin, address indexed newAdmin);

    error NotSuperAdmin();
    error NotPlatformAdmin();
    error InvalidAddress();

    modifier onlySuperAdmin() {
        if (!isSuperAdminMap[msg.sender]) revert NotSuperAdmin();
        _;
    }

    modifier onlyPlatformAdmin() {
        if (!isPlatformAdminMap[msg.sender]) revert NotPlatformAdmin();
        _;
    }

    constructor(address _superAdmin, address _platformAdmin) {
        if (_superAdmin == address(0) || _platformAdmin == address(0)) revert InvalidAddress();
        superAdmin = _superAdmin;
        platformAdmin = _platformAdmin;
        isSuperAdminMap[_superAdmin] = true;
        isPlatformAdminMap[_platformAdmin] = true;
    }

    function setSuperAdmin(address newAdmin) external onlySuperAdmin {
        if (newAdmin == address(0)) revert InvalidAddress();
        emit SuperAdminUpdated(superAdmin, newAdmin);
        isSuperAdminMap[superAdmin] = false;
        superAdmin = newAdmin;
        isSuperAdminMap[newAdmin] = true;
    }

    function setPlatformAdmin(address newAdmin) external onlySuperAdmin {
        if (newAdmin == address(0)) revert InvalidAddress();
        emit PlatformAdminUpdated(platformAdmin, newAdmin);
        isPlatformAdminMap[platformAdmin] = false;
        platformAdmin = newAdmin;
        isPlatformAdminMap[newAdmin] = true;
    }

    function createElectionForAdminWithConfig(
        SpaceConfig calldata config,
        address[] calldata initialVoters
    ) external onlyPlatformAdmin returns (address) {
        ElectionSpace space = new ElectionSpace(
            msg.sender,
            config.spaceId,
            config.title,
            config.metadataURI,
            config.candidateCount
        );

        space.setPhaseSchedule(
            config.commitStartsAt,
            config.commitEndsAt,
            config.revealStartsAt,
            config.revealEndsAt
        );

        if (config.initialActor != address(0)) {
            space.registerVoters(initialVoters);
        }

        emit ElectionSpaceCreated(config.spaceId, address(space), msg.sender);
        return address(space);
    }

    function isElectionSpace(address candidate) external view returns (bool) {
        // Check if code exists at candidate address
        uint256 size;
        assembly {
            size := extcodesize(candidate)
        }
        return size > 0;
    }
}

contract ElectionSpace {
    enum Phase { Registration, Commit, Reveal, Ended }
    enum ElectionStatus { Active, Suspended, Terminated }

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
    mapping(address => bytes32) public commitmentOf;
    mapping(uint256 => uint256) public voteCount;

    event PhaseChanged(uint256 indexed spaceId, Phase indexed previousPhase, Phase indexed newPhase, address actor);
    event WhitelistUpdated(uint256 indexed spaceId, address indexed voter, bool isRegistered, address actor);
    event Committed(uint256 indexed spaceId, address indexed voter, bytes32 commitment);
    event Revealed(uint256 indexed spaceId, address indexed voter, uint256 candidateId, uint256 newVoteCount);
    event ElectionStatusChanged(uint256 indexed spaceId, ElectionStatus status, address actor, string reasonCode);

    error NotAdmin();
    error NotRegistered();
    error AlreadyRegistered();
    error AlreadyCommitted();
    error AlreadyRevealed();
    error WrongPhase(Phase expected, Phase actual);
    error InvalidCandidate();
    error CommitmentMismatch();
    error ElectionSuspended();
    error ElectionTerminated();

    constructor(address _spaceAdmin, uint256 _spaceId, string memory _title, string memory _metadataURI, uint256 _candidateCount) {
        spaceAdmin = _spaceAdmin;
        spaceId = _spaceId;
        title = _title;
        metadataURI = _metadataURI;
        candidateCount = _candidateCount;
        currentPhase = Phase.Registration;
        status = ElectionStatus.Active;
        registry = msg.sender;
    }

    modifier onlyAdmin() {
        if (msg.sender != spaceAdmin) revert NotAdmin();
        _;
    }

    modifier whenActive() {
        if (status == ElectionStatus.Suspended) revert ElectionSuspended();
        if (status == ElectionStatus.Terminated) revert ElectionTerminated();
        _;
    }

    function phase() external view returns (Phase) {
        if (status != ElectionStatus.Active) return currentPhase;
        if (commitStartsAt == 0) return currentPhase;
        uint256 now_ = block.timestamp;
        if (now_ < commitStartsAt) return Phase.Registration;
        if (now_ < commitEndsAt) return Phase.Commit;
        if (now_ < revealEndsAt) return Phase.Reveal;
        return Phase.Ended;
    }

    function registerVoter(address voter) external onlyAdmin whenActive {
        Phase current = phase();
        if (current != Phase.Registration) revert WrongPhase(Phase.Registration, current);
        if (isWhitelisted[voter]) revert AlreadyRegistered();
        isWhitelisted[voter] = true;
        emit WhitelistUpdated(spaceId, voter, true, msg.sender);
    }

    function registerVoters(address[] calldata voters) external onlyAdmin whenActive {
        Phase current = phase();
        if (current != Phase.Registration) revert WrongPhase(Phase.Registration, current);
        for (uint256 i = 0; i < voters.length; i++) {
            if (!isWhitelisted[voters[i]]) {
                isWhitelisted[voters[i]] = true;
                emit WhitelistUpdated(spaceId, voters[i], true, msg.sender);
            }
        }
    }

    function commitVote(bytes32 commitment) external whenActive {
        Phase current = phase();
        if (current != Phase.Commit) revert WrongPhase(Phase.Commit, current);
        if (!isWhitelisted[msg.sender]) revert NotRegistered();
        if (hasCommitted[msg.sender]) revert AlreadyCommitted();
        commitmentOf[msg.sender] = commitment;
        hasCommitted[msg.sender] = true;
        emit Committed(spaceId, msg.sender, commitment);
    }

    function revealVote(uint256 candidateId, bytes32 salt) external whenActive {
        Phase current = phase();
        if (current != Phase.Reveal) revert WrongPhase(Phase.Reveal, current);
        if (!isWhitelisted[msg.sender]) revert NotRegistered();
        if (!hasCommitted[msg.sender]) revert NotRegistered();
        if (hasRevealed[msg.sender]) revert AlreadyRevealed();
        if (candidateId == 0 || candidateId > candidateCount) revert InvalidCandidate();

        bytes32 expectedCommitment = keccak256(
            abi.encode(candidateId, salt, msg.sender, address(this), block.chainid)
        );
        if (expectedCommitment != commitmentOf[msg.sender]) revert CommitmentMismatch();

        hasRevealed[msg.sender] = true;
        voteCount[candidateId]++;
        emit Revealed(spaceId, msg.sender, candidateId, voteCount[candidateId]);
    }

    function revealFor(address voter, uint256 candidateId, bytes32 salt) external whenActive {
        Phase current = phase();
        if (current != Phase.Reveal) revert WrongPhase(Phase.Reveal, current);
        if (!isWhitelisted[voter]) revert NotRegistered();
        if (!hasCommitted[voter]) revert NotRegistered();
        if (hasRevealed[voter]) revert AlreadyRevealed();
        if (candidateId == 0 || candidateId > candidateCount) revert InvalidCandidate();

        bytes32 expectedCommitment = keccak256(
            abi.encode(candidateId, salt, voter, address(this), block.chainid)
        );
        if (expectedCommitment != commitmentOf[voter]) revert CommitmentMismatch();

        hasRevealed[voter] = true;
        voteCount[candidateId]++;
        emit Revealed(spaceId, voter, candidateId, voteCount[candidateId]);
    }

    function getResult(uint256 candidateId) external view returns (uint256) {
        if (phase() != Phase.Ended) revert WrongPhase(Phase.Ended, phase());
        return voteCount[candidateId];
    }

    function setPhaseSchedule(uint256 _commitStartsAt, uint256 _commitEndsAt, uint256 _revealStartsAt, uint256 _revealEndsAt) external onlyAdmin whenActive {
        commitStartsAt = _commitStartsAt;
        commitEndsAt = _commitEndsAt;
        revealStartsAt = _revealStartsAt;
        revealEndsAt = _revealEndsAt;
    }

    function transitionToNextPhase() external onlyAdmin whenActive {
        Phase current = phase();
        if (current == Phase.Ended) revert WrongPhase(Phase.Ended, Phase.Ended);
        Phase next = Phase(uint8(current) + 1);
        currentPhase = next;
        emit PhaseChanged(spaceId, current, next, msg.sender);
    }

    function setSuspended(bool suspended, address actor, string calldata reasonCode) external {
        if (msg.sender != registry) revert NotAdmin();
        status = suspended ? ElectionStatus.Suspended : ElectionStatus.Active;
        emit ElectionStatusChanged(spaceId, status, actor, reasonCode);
    }

    function setTerminated(address actor, string calldata reasonCode) external {
        if (msg.sender != registry) revert NotAdmin();
        status = ElectionStatus.Terminated;
        emit ElectionStatusChanged(spaceId, ElectionStatus.Terminated, actor, reasonCode);
    }

    function getCandidateVoteCount(uint256 candidateId) external view returns (uint256) {
        return voteCount[candidateId];
    }

    function getTotalVotes() external view returns (uint256 total) {
        for (uint256 i = 1; i <= candidateCount; i++) {
            total += voteCount[i];
        }
    }
}`
}

function getElectionSpaceSource(): string {
  // Standalone ElectionSpace — deployed independently, NOT via Registry
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ElectionSpace {
    enum Phase { Registration, Commit, Reveal, Ended }
    enum ElectionStatus { Active, Suspended, Terminated }

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
    mapping(address => bytes32) public commitmentOf;
    mapping(uint256 => uint256) public voteCount;

    event PhaseChanged(uint256 indexed spaceId, Phase indexed previousPhase, Phase indexed newPhase, address actor);
    event WhitelistUpdated(uint256 indexed spaceId, address indexed voter, bool isRegistered, address actor);
    event Committed(uint256 indexed spaceId, address indexed voter, bytes32 commitment);
    event Revealed(uint256 indexed spaceId, address indexed voter, uint256 candidateId, uint256 newVoteCount);
    event ElectionStatusChanged(uint256 indexed spaceId, ElectionStatus status, address actor, string reasonCode);

    error NotAdmin();
    error NotRegistered();
    error AlreadyRegistered();
    error AlreadyCommitted();
    error AlreadyRevealed();
    error WrongPhase(Phase expected, Phase actual);
    error InvalidCandidate();
    error CommitmentMismatch();
    error ElectionSuspended();
    error ElectionTerminated();

    constructor(address _spaceAdmin, uint256 _spaceId, string memory _title, string memory _metadataURI, uint256 _candidateCount) {
        spaceAdmin = _spaceAdmin;
        spaceId = _spaceId;
        title = _title;
        metadataURI = _metadataURI;
        candidateCount = _candidateCount;
        currentPhase = Phase.Registration;
        status = ElectionStatus.Active;
        registry = msg.sender;
    }

    modifier onlyAdmin() {
        if (msg.sender != spaceAdmin) revert NotAdmin();
        _;
    }

    modifier whenActive() {
        if (status == ElectionStatus.Suspended) revert ElectionSuspended();
        if (status == ElectionStatus.Terminated) revert ElectionTerminated();
        _;
    }

    function phase() external view returns (Phase) {
        if (status != ElectionStatus.Active) return currentPhase;
        if (commitStartsAt == 0) return currentPhase;
        uint256 now_ = block.timestamp;
        if (now_ < commitStartsAt) return Phase.Registration;
        if (now_ < commitEndsAt) return Phase.Commit;
        if (now_ < revealEndsAt) return Phase.Reveal;
        return Phase.Ended;
    }

    function registerVoter(address voter) external onlyAdmin whenActive {
        Phase current = phase();
        if (current != Phase.Registration) revert WrongPhase(Phase.Registration, current);
        if (isWhitelisted[voter]) revert AlreadyRegistered();
        isWhitelisted[voter] = true;
        emit WhitelistUpdated(spaceId, voter, true, msg.sender);
    }

    function registerVoters(address[] calldata voters) external onlyAdmin whenActive {
        Phase current = phase();
        if (current != Phase.Registration) revert WrongPhase(Phase.Registration, current);
        for (uint256 i = 0; i < voters.length; i++) {
            if (!isWhitelisted[voters[i]]) {
                isWhitelisted[voters[i]] = true;
                emit WhitelistUpdated(spaceId, voters[i], true, msg.sender);
            }
        }
    }

    function commitVote(bytes32 commitment) external whenActive {
        Phase current = phase();
        if (current != Phase.Commit) revert WrongPhase(Phase.Commit, current);
        if (!isWhitelisted[msg.sender]) revert NotRegistered();
        if (hasCommitted[msg.sender]) revert AlreadyCommitted();
        commitmentOf[msg.sender] = commitment;
        hasCommitted[msg.sender] = true;
        emit Committed(spaceId, msg.sender, commitment);
    }

    function revealVote(uint256 candidateId, bytes32 salt) external whenActive {
        Phase current = phase();
        if (current != Phase.Reveal) revert WrongPhase(Phase.Reveal, current);
        if (!isWhitelisted[msg.sender]) revert NotRegistered();
        if (!hasCommitted[msg.sender]) revert NotRegistered();
        if (hasRevealed[msg.sender]) revert AlreadyRevealed();
        if (candidateId == 0 || candidateId > candidateCount) revert InvalidCandidate();

        bytes32 expectedCommitment = keccak256(
            abi.encode(candidateId, salt, msg.sender, address(this), block.chainid)
        );
        if (expectedCommitment != commitmentOf[msg.sender]) revert CommitmentMismatch();

        hasRevealed[msg.sender] = true;
        voteCount[candidateId]++;
        emit Revealed(spaceId, msg.sender, candidateId, voteCount[candidateId]);
    }

    function revealFor(address voter, uint256 candidateId, bytes32 salt) external whenActive {
        Phase current = phase();
        if (current != Phase.Reveal) revert WrongPhase(Phase.Reveal, current);
        if (!isWhitelisted[voter]) revert NotRegistered();
        if (!hasCommitted[voter]) revert NotRegistered();
        if (hasRevealed[voter]) revert AlreadyRevealed();
        if (candidateId == 0 || candidateId > candidateCount) revert InvalidCandidate();

        bytes32 expectedCommitment = keccak256(
            abi.encode(candidateId, salt, voter, address(this), block.chainid)
        );
        if (expectedCommitment != commitmentOf[voter]) revert CommitmentMismatch();

        hasRevealed[voter] = true;
        voteCount[candidateId]++;
        emit Revealed(spaceId, voter, candidateId, voteCount[candidateId]);
    }

    function getResult(uint256 candidateId) external view returns (uint256) {
        if (phase() != Phase.Ended) revert WrongPhase(Phase.Ended, phase());
        return voteCount[candidateId];
    }

    function setPhaseSchedule(uint256 _commitStartsAt, uint256 _commitEndsAt, uint256 _revealStartsAt, uint256 _revealEndsAt) external onlyAdmin whenActive {
        commitStartsAt = _commitStartsAt;
        commitEndsAt = _commitEndsAt;
        revealStartsAt = _revealStartsAt;
        revealEndsAt = _revealEndsAt;
    }

    function transitionToNextPhase() external onlyAdmin whenActive {
        Phase current = phase();
        if (current == Phase.Ended) revert WrongPhase(Phase.Ended, Phase.Ended);
        Phase next = Phase(uint8(current) + 1);
        currentPhase = next;
        emit PhaseChanged(spaceId, current, next, msg.sender);
    }

    function setSuspended(bool suspended, address actor, string calldata reasonCode) external {
        if (msg.sender != registry) revert NotAdmin();
        status = suspended ? ElectionStatus.Suspended : ElectionStatus.Active;
        emit ElectionStatusChanged(spaceId, status, actor, reasonCode);
    }

    function setTerminated(address actor, string calldata reasonCode) external {
        if (msg.sender != registry) revert NotAdmin();
        status = ElectionStatus.Terminated;
        emit ElectionStatusChanged(spaceId, ElectionStatus.Terminated, actor, reasonCode);
    }

    function getCandidateVoteCount(uint256 candidateId) external view returns (uint256) {
        return voteCount[candidateId];
    }

    function getTotalVotes() external view returns (uint256 total) {
        for (uint256 i = 1; i <= candidateCount; i++) {
            total += voteCount[i];
        }
    }
}`
}
