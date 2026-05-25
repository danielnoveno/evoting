import { ponder } from "@/generated";

ponder.on("VoteChainRegistry:ProposalSubmitted", async ({ event, context }) => {
  const { Proposal } = context.db;
  await Proposal.create({
    id: event.args.proposalId.toString(),
    data: {
      proposer: event.args.proposer,
      candidateCount: Number(event.args.candidateCount),
      status: 0, // Submitted
      title: "", // Need to fetch or handle if available in event
      metadataURI: "", 
      submittedAt: Number(event.block.timestamp),
    },
  });
});

ponder.on("VoteChainRegistry:ProposalReviewed", async ({ event, context }) => {
  const { Proposal } = context.db;
  await Proposal.update({
    id: event.args.proposalId.toString(),
    data: {
      status: event.args.status,
      reviewer: event.args.reviewer,
      reviewedAt: Number(event.block.timestamp),
    },
  });
});

ponder.on("VoteChainRegistry:ElectionSpaceCreated", async ({ event, context }) => {
  const { Election } = context.db;
  await Election.create({
    id: event.args.spaceAddress,
    data: {
      spaceId: event.args.spaceId,
      proposalId: event.args.proposalId,
      proposer: event.args.proposer,
      candidateCount: Number(event.args.candidateCount),
      status: 0, // Initial status
      createdAt: Number(event.block.timestamp),
    },
  });
});

ponder.on("ElectionSpace:VoteCommitted", async ({ event, context }) => {
  const { Vote } = context.db;
  await Vote.create({
    id: event.transaction.hash,
    data: {
      voter: event.args.voter,
      electionId: event.log.address,
      commitment: event.args.commitment,
      type: "COMMIT",
      timestamp: Number(event.block.timestamp),
    },
  });
});

ponder.on("ElectionSpace:VoteRevealed", async ({ event, context }) => {
  const { Vote } = context.db;
  await Vote.create({
    id: event.transaction.hash,
    data: {
      voter: event.args.voter,
      electionId: event.log.address,
      candidateId: Number(event.args.candidateId),
      salt: event.args.salt,
      type: "REVEAL",
      timestamp: Number(event.block.timestamp),
    },
  });
});
