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

    address public immutable superAdmin;

    uint256 public nextProposalId = 1;
    uint256 public nextSpaceId = 1;

    mapping(address => bool) public isPlatformAdmin;
    mapping(address => bool) public superAdmins;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => address) public spaceById;

    event AdminUpserted(address indexed admin, bool isActive);
    event SuperAdminUpserted(address indexed admin, bool isActive, address indexed rootSuperAdmin);
    event ProposalSubmitted(
        uint256 indexed proposalId, address indexed proposer, uint256 candidateCount
    );
    event ProposalReviewed(
        uint256 indexed proposalId, ProposalStatus indexed decision, address indexed reviewer
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
    event SpaceAdminTransferred(
        uint256 indexed spaceId,
        address indexed previousAdmin,
        address indexed newAdmin,
        address actor,
        string reasonCode
    );

    error NotSuperAdmin();
    error NotRootSuperAdmin();
    error NotPlatformAdmin();
    error InvalidAdmin();
    error InvalidCandidateCount();
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

    function addSuperAdmin(address admin) external onlySuperAdmin {
        if (admin == address(0)) revert InvalidAdmin();

        superAdmins[admin] = true;
        emit SuperAdminUpserted(admin, true, msg.sender);
    }

    function removeSuperAdmin(address admin) external onlySuperAdmin {
        if (admin == address(0) || admin == superAdmin) revert InvalidAdmin();

        superAdmins[admin] = false;
        emit SuperAdminUpserted(admin, false, msg.sender);
    }

    function setAdmin(address admin, bool isActive) external onlySuperAdmin {
        if (admin == address(0)) revert InvalidAdmin();

        isPlatformAdmin[admin] = isActive;
        emit AdminUpserted(admin, isActive);
    }

    function transferSpaceAdmin(uint256 spaceId, address newAdmin, string calldata reasonCode)
        external
        onlySuperAdmin
    {
        address target = spaceById[spaceId];
        if (target == address(0)) revert SpaceNotFound();
        if (newAdmin == address(0)) revert InvalidAdmin();
        if (!isPlatformAdmin[newAdmin] && !superAdmins[newAdmin]) revert NotPlatformAdmin();

        ElectionSpace space = ElectionSpace(target);
        address previousAdmin = space.spaceAdmin();
        space.transferSpaceAdmin(newAdmin, msg.sender, reasonCode);

        emit SpaceAdminTransferred(spaceId, previousAdmin, newAdmin, msg.sender, reasonCode);
    }

    function isSuperAdmin(address account) external view returns (bool) {
        return superAdmins[account];
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
