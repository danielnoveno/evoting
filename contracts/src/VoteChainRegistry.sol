// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ElectionSpace } from "./ElectionSpace.sol";

contract VoteChainRegistry {
    enum ProposalStatus {
        Submitted,
        Approved,
        Rejected,
        Deployed
    }

    struct Proposal {
        address proposer;
        uint256 candidateCount;
        ProposalStatus status;
        string title;
        string metadataURI;
        address reviewer;
        uint256 reviewedAt;
    }

    struct ChangeProposal {
        uint256 spaceId;
        string title;
        string metadataURI;
        ProposalStatus status;
        address proposer;
    }

    address public immutable superAdmin;

    uint256 public nextProposalId = 1;
    uint256 public nextChangeProposalId = 1;
    uint256 public nextSpaceId = 1;

    mapping(address => bool) public isPlatformAdmin;
    mapping(address => bool) public superAdmins;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => ChangeProposal) public changeProposals;
    mapping(uint256 => address) public spaceById;

    event AdminUpserted(address indexed admin, bool isActive);
    event SuperAdminUpserted(address indexed admin, bool isActive, address indexed rootSuperAdmin);
    event ProposalSubmitted(
        uint256 indexed proposalId, address indexed proposer, uint256 candidateCount
    );
    event ProposalReviewed(
        uint256 indexed proposalId, ProposalStatus indexed decision, address indexed reviewer
    );
    event ChangeProposalSubmitted(
        uint256 indexed changeId, uint256 indexed spaceId, address proposer
    );
    event ChangeProposalReviewed(
        uint256 indexed changeId, ProposalStatus indexed decision, address indexed reviewer
    );
    event ElectionSpaceCreated(
        uint256 indexed spaceId,
        address indexed space,
        uint256 indexed proposalId,
        address owner,
        uint256 candidateCount
    );
    event ElectionSpaceConfigured(
        uint256 indexed spaceId,
        address indexed space,
        uint256 indexed proposalId,
        uint256 voterCount,
        uint256 commitStartsAt,
        uint256 commitEndsAt,
        uint256 revealStartsAt,
        uint256 revealEndsAt
    );

    error NotSuperAdmin();
    error NotRootSuperAdmin();
    error NotPlatformAdmin();
    error InvalidAdmin();
    error InvalidCandidateCount();
    error ProposalNotFound();
    error InvalidProposalStatus(ProposalStatus current, ProposalStatus expected);
    error NotProposalOwner();
    error SpaceNotFound();

    constructor(address _initialSuperAdmin) {
        if (_initialSuperAdmin == address(0)) revert InvalidAdmin();
        superAdmin = _initialSuperAdmin;
        superAdmins[_initialSuperAdmin] = true;
        emit SuperAdminUpserted(_initialSuperAdmin, true, _initialSuperAdmin);
    }

    modifier onlySuperAdmin() {
        if (!superAdmins[msg.sender]) revert NotSuperAdmin();
        _;
    }

    modifier onlyRootSuperAdmin() {
        if (msg.sender != superAdmin) revert NotRootSuperAdmin();
        _;
    }

    modifier onlyPlatformAdminOrSuper() {
        if (!isPlatformAdmin[msg.sender] && !superAdmins[msg.sender]) revert NotPlatformAdmin();
        _;
    }

    function addSuperAdmin(address admin) external onlyRootSuperAdmin {
        if (admin == address(0)) revert InvalidAdmin();

        superAdmins[admin] = true;
        emit SuperAdminUpserted(admin, true, msg.sender);
    }

    function removeSuperAdmin(address admin) external onlyRootSuperAdmin {
        if (admin == address(0) || admin == superAdmin) revert InvalidAdmin();

        superAdmins[admin] = false;
        emit SuperAdminUpserted(admin, false, msg.sender);
    }

    function setAdmin(address admin, bool isActive) external onlySuperAdmin {
        if (admin == address(0)) revert InvalidAdmin();

        isPlatformAdmin[admin] = isActive;
        emit AdminUpserted(admin, isActive);
    }

    function isSuperAdmin(address account) external view returns (bool) {
        return superAdmins[account];
    }

    function submitProposal(
        string calldata title,
        string calldata metadataURI,
        uint256 candidateCount
    ) external onlyPlatformAdminOrSuper returns (uint256 proposalId) {
        if (candidateCount == 0) revert InvalidCandidateCount();

        proposalId = nextProposalId;
        nextProposalId += 1;

        proposals[proposalId] = Proposal({
            proposer: msg.sender,
            candidateCount: candidateCount,
            status: ProposalStatus.Submitted,
            title: title,
            metadataURI: metadataURI,
            reviewer: address(0),
            reviewedAt: 0
        });

        emit ProposalSubmitted(proposalId, msg.sender, candidateCount);
    }

    function reviewProposal(uint256 proposalId, bool approve) external onlySuperAdmin {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.proposer == address(0)) revert ProposalNotFound();
        if (proposal.status != ProposalStatus.Submitted) {
            revert InvalidProposalStatus(proposal.status, ProposalStatus.Submitted);
        }

        proposal.status = approve ? ProposalStatus.Approved : ProposalStatus.Rejected;
        proposal.reviewer = msg.sender;
        proposal.reviewedAt = block.timestamp;

        emit ProposalReviewed(proposalId, proposal.status, msg.sender);
    }

    function createElectionFromProposal(uint256 proposalId)
        external
        returns (uint256 spaceId, address spaceAddress)
    {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.proposer == address(0)) revert ProposalNotFound();
        if (proposal.status != ProposalStatus.Approved) {
            revert InvalidProposalStatus(proposal.status, ProposalStatus.Approved);
        }
        if (msg.sender != proposal.proposer && !superAdmins[msg.sender]) revert NotProposalOwner();

        spaceId = nextSpaceId;
        nextSpaceId += 1;

        ElectionSpace space = new ElectionSpace(
            address(this),
            proposal.proposer,
            spaceId,
            proposal.candidateCount,
            proposal.title,
            proposal.metadataURI,
            msg.sender,
            new address[](0),
            0,
            0,
            0,
            0
        );
        spaceAddress = address(space);
        spaceById[spaceId] = spaceAddress;

        proposal.status = ProposalStatus.Deployed;

        emit ElectionSpaceCreated(
            spaceId, spaceAddress, proposalId, proposal.proposer, proposal.candidateCount
        );
    }

    function createElectionForAdmin(
        address spaceAdmin,
        string calldata title,
        string calldata metadataURI,
        uint256 candidateCount
    ) external onlySuperAdmin returns (uint256 proposalId, uint256 spaceId, address spaceAddress) {
        if (spaceAdmin == address(0)) revert InvalidAdmin();
        if (candidateCount == 0) revert InvalidCandidateCount();

        proposalId = nextProposalId;
        nextProposalId += 1;

        proposals[proposalId] = Proposal({
            proposer: spaceAdmin,
            candidateCount: candidateCount,
            status: ProposalStatus.Deployed,
            title: title,
            metadataURI: metadataURI,
            reviewer: msg.sender,
            reviewedAt: block.timestamp
        });

        emit ProposalSubmitted(proposalId, spaceAdmin, candidateCount);
        emit ProposalReviewed(proposalId, ProposalStatus.Approved, msg.sender);

        spaceId = nextSpaceId;
        nextSpaceId += 1;

        ElectionSpace space = new ElectionSpace(
            address(this),
            spaceAdmin,
            spaceId,
            candidateCount,
            title,
            metadataURI,
            msg.sender,
            new address[](0),
            0,
            0,
            0,
            0
        );
        spaceAddress = address(space);
        spaceById[spaceId] = spaceAddress;

        emit ElectionSpaceCreated(spaceId, spaceAddress, proposalId, spaceAdmin, candidateCount);
    }

    function createElectionForAdminWithConfig(
        address spaceAdmin,
        string calldata title,
        string calldata metadataURI,
        uint256 candidateCount,
        address[] calldata initialVoters,
        uint256 commitStartsAt,
        uint256 commitEndsAt,
        uint256 revealStartsAt,
        uint256 revealEndsAt
    ) external onlySuperAdmin returns (uint256 proposalId, uint256 spaceId, address spaceAddress) {
        if (spaceAdmin == address(0)) revert InvalidAdmin();
        if (candidateCount == 0) revert InvalidCandidateCount();

        proposalId = nextProposalId;
        nextProposalId += 1;

        proposals[proposalId] = Proposal({
            proposer: spaceAdmin,
            candidateCount: candidateCount,
            status: ProposalStatus.Deployed,
            title: title,
            metadataURI: metadataURI,
            reviewer: msg.sender,
            reviewedAt: block.timestamp
        });

        emit ProposalSubmitted(proposalId, spaceAdmin, candidateCount);
        emit ProposalReviewed(proposalId, ProposalStatus.Approved, msg.sender);

        spaceId = nextSpaceId;
        nextSpaceId += 1;

        ElectionSpace space = new ElectionSpace(
            address(this),
            spaceAdmin,
            spaceId,
            candidateCount,
            title,
            metadataURI,
            msg.sender,
            initialVoters,
            commitStartsAt,
            commitEndsAt,
            revealStartsAt,
            revealEndsAt
        );
        spaceAddress = address(space);
        spaceById[spaceId] = spaceAddress;

        emit ElectionSpaceCreated(spaceId, spaceAddress, proposalId, spaceAdmin, candidateCount);
        emit ElectionSpaceConfigured(
            spaceId,
            spaceAddress,
            proposalId,
            initialVoters.length,
            commitStartsAt,
            commitEndsAt,
            revealStartsAt,
            revealEndsAt
        );
    }

    function proposeSpaceUpdate(uint256 spaceId, string calldata title, string calldata metadataURI)
        external
        onlyPlatformAdminOrSuper
        returns (uint256 changeId)
    {
        if (spaceById[spaceId] == address(0)) revert SpaceNotFound();

        changeId = nextChangeProposalId;
        nextChangeProposalId += 1;

        changeProposals[changeId] = ChangeProposal({
            spaceId: spaceId,
            title: title,
            metadataURI: metadataURI,
            status: ProposalStatus.Submitted,
            proposer: msg.sender
        });

        emit ChangeProposalSubmitted(changeId, spaceId, msg.sender);
    }

    function reviewSpaceUpdate(uint256 changeId, bool approve) external onlySuperAdmin {
        ChangeProposal storage cp = changeProposals[changeId];
        if (cp.proposer == address(0)) revert ProposalNotFound();
        if (cp.status != ProposalStatus.Submitted) {
            revert InvalidProposalStatus(cp.status, ProposalStatus.Submitted);
        }

        if (approve) {
            cp.status = ProposalStatus.Approved;
            address target = spaceById[cp.spaceId];
            ElectionSpace(target).updateMetadata(cp.title, cp.metadataURI, msg.sender);
        } else {
            cp.status = ProposalStatus.Rejected;
        }

        emit ChangeProposalReviewed(changeId, cp.status, msg.sender);
    }

    function suspendSpace(uint256 spaceId, string calldata reasonCode) external onlySuperAdmin {
        address target = spaceById[spaceId];
        if (target == address(0)) revert SpaceNotFound();

        ElectionSpace(target).setSuspended(true, msg.sender, reasonCode);
    }

    function unsuspendSpace(uint256 spaceId, string calldata reasonCode) external onlySuperAdmin {
        address target = spaceById[spaceId];
        if (target == address(0)) revert SpaceNotFound();

        ElectionSpace(target).setSuspended(false, msg.sender, reasonCode);
    }

    function terminateSpace(uint256 spaceId, string calldata reasonCode) external onlySuperAdmin {
        address target = spaceById[spaceId];
        if (target == address(0)) revert SpaceNotFound();

        ElectionSpace(target).terminate(msg.sender, reasonCode);
    }
}
