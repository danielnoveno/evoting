// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ElectionSpace} from "./ElectionSpace.sol";

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
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => address) public spaceById;

    event AdminUpserted(address indexed admin, bool isActive);
    event ProposalSubmitted(uint256 indexed proposalId, address indexed proposer, uint256 candidateCount);
    event ProposalReviewed(uint256 indexed proposalId, ProposalStatus indexed decision, address indexed reviewer);
    event ElectionSpaceCreated(
        uint256 indexed spaceId,
        address indexed space,
        uint256 indexed proposalId,
        address owner,
        uint256 candidateCount
    );

    error NotSuperAdmin();
    error NotPlatformAdmin();
    error InvalidAdmin();
    error InvalidCandidateCount();
    error ProposalNotFound();
    error InvalidProposalStatus(ProposalStatus current, ProposalStatus expected);
    error NotProposalOwner();
    error SpaceNotFound();

    constructor() {
        superAdmin = msg.sender;
    }

    modifier onlySuperAdmin() {
        if (msg.sender != superAdmin) revert NotSuperAdmin();
        _;
    }

    modifier onlyPlatformAdminOrSuper() {
        if (!isPlatformAdmin[msg.sender] && msg.sender != superAdmin) revert NotPlatformAdmin();
        _;
    }

    function setAdmin(address admin, bool isActive) external onlySuperAdmin {
        if (admin == address(0)) revert InvalidAdmin();

        isPlatformAdmin[admin] = isActive;
        emit AdminUpserted(admin, isActive);
    }

    function isSuperAdmin(address account) external view returns (bool) {
        return account == superAdmin;
    }

    function submitProposal(string calldata title, string calldata metadataURI, uint256 candidateCount)
        external
        onlyPlatformAdminOrSuper
        returns (uint256 proposalId)
    {
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

    function createElectionFromProposal(uint256 proposalId) external returns (uint256 spaceId, address spaceAddress) {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.proposer == address(0)) revert ProposalNotFound();
        if (proposal.status != ProposalStatus.Approved) {
            revert InvalidProposalStatus(proposal.status, ProposalStatus.Approved);
        }
        if (msg.sender != proposal.proposer && msg.sender != superAdmin) revert NotProposalOwner();

        spaceId = nextSpaceId;
        nextSpaceId += 1;

        ElectionSpace space = new ElectionSpace(address(this), proposal.proposer, spaceId, proposal.candidateCount);
        spaceAddress = address(space);
        spaceById[spaceId] = spaceAddress;

        proposal.status = ProposalStatus.Deployed;

        emit ElectionSpaceCreated(spaceId, spaceAddress, proposalId, proposal.proposer, proposal.candidateCount);
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
