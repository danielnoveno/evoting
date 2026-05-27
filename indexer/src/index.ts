import { ponder } from "@/generated";

import {
  candidateResult,
  election,
  proposal,
  voteCommit,
  voteReveal,
} from "../ponder.schema";

const INITIAL_PHASE_REGISTRATION = 0;
const INITIAL_STATUS_ACTIVE = 0;

ponder.on("VoteChainRegistry:ProposalSubmitted", async ({ event, context }) => {
  await context.db
    .insert(proposal)
    .values({
      id: event.args.proposalId,
      proposer: event.args.proposer,
      candidateCount: Number(event.args.candidateCount),
      status: 0,
      submittedAt: event.block.timestamp,
      reviewedAt: 0n,
      reviewer: "0x0000000000000000000000000000000000000000",
      updatedAtBlock: event.block.number,
      updatedAtTx: event.transaction.hash,
    })
    .onConflictDoUpdate({
      proposer: event.args.proposer,
      candidateCount: Number(event.args.candidateCount),
      status: 0,
      submittedAt: event.block.timestamp,
      updatedAtBlock: event.block.number,
      updatedAtTx: event.transaction.hash,
    });
});

ponder.on("VoteChainRegistry:ProposalReviewed", async ({ event, context }) => {
  const existingProposal = await context.db.find(proposal, { id: event.args.proposalId });

  if (!existingProposal) return;

  await context.db.update(proposal, { id: event.args.proposalId }).set({
    status: Number(event.args.decision),
    reviewer: event.args.reviewer,
    reviewedAt: event.block.timestamp,
    updatedAtBlock: event.block.number,
    updatedAtTx: event.transaction.hash,
  });
});

ponder.on("VoteChainRegistry:ElectionSpaceCreated", async ({ event, context }) => {
  await context.db
    .insert(election)
    .values({
      id: event.args.space,
      spaceId: event.args.spaceId,
      proposalId: event.args.proposalId,
      owner: event.args.owner,
      candidateCount: Number(event.args.candidateCount),
      phase: INITIAL_PHASE_REGISTRATION,
      status: INITIAL_STATUS_ACTIVE,
      whitelistedCount: 0,
      totalCommitted: 0,
      totalRevealed: 0,
      createdAt: event.block.timestamp,
      lastUpdatedAt: event.block.timestamp,
      lastUpdatedBlock: event.block.number,
      lastUpdatedTx: event.transaction.hash,
    })
    .onConflictDoUpdate({
      proposalId: event.args.proposalId,
      owner: event.args.owner,
      candidateCount: Number(event.args.candidateCount),
      lastUpdatedAt: event.block.timestamp,
      lastUpdatedBlock: event.block.number,
      lastUpdatedTx: event.transaction.hash,
    });
});

ponder.on("ElectionSpace:PhaseChanged", async ({ event, context }) => {
  const existingElection = await context.db.find(election, { id: event.log.address });
  if (!existingElection) return;

  await context.db.update(election, { id: event.log.address }).set({
    phase: Number(event.args.newPhase),
    lastUpdatedAt: event.block.timestamp,
    lastUpdatedBlock: event.block.number,
    lastUpdatedTx: event.transaction.hash,
  });
});

ponder.on("ElectionSpace:WhitelistUpdated", async ({ event, context }) => {
  const existingElection = await context.db.find(election, { id: event.log.address });
  if (!existingElection) return;

  await context.db.update(election, { id: event.log.address }).set((row) => ({
    whitelistedCount: event.args.isRegistered
      ? row.whitelistedCount + 1
      : Math.max(0, row.whitelistedCount - 1),
    lastUpdatedAt: event.block.timestamp,
    lastUpdatedBlock: event.block.number,
    lastUpdatedTx: event.transaction.hash,
  }));
});

ponder.on("ElectionSpace:Committed", async ({ event, context }) => {
  const existingCommit = await context.db.find(voteCommit, { id: event.log.id });
  if (existingCommit) return;

  await context.db.insert(voteCommit).values({
    id: event.log.id,
    txHash: event.transaction.hash,
    spaceAddress: event.log.address,
    spaceId: event.args.spaceId,
    voter: event.args.voter,
    commitment: event.args.commitment,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
  });

  const existingElection = await context.db.find(election, { id: event.log.address });
  if (!existingElection) return;

  await context.db.update(election, { id: event.log.address }).set((row) => ({
    totalCommitted: row.totalCommitted + 1,
    lastUpdatedAt: event.block.timestamp,
    lastUpdatedBlock: event.block.number,
    lastUpdatedTx: event.transaction.hash,
  }));
});

ponder.on("ElectionSpace:Revealed", async ({ event, context }) => {
  const existingReveal = await context.db.find(voteReveal, { id: event.log.id });
  if (existingReveal) return;

  await context.db.insert(voteReveal).values({
    id: event.log.id,
    txHash: event.transaction.hash,
    spaceAddress: event.log.address,
    spaceId: event.args.spaceId,
    voter: event.args.voter,
    candidateId: event.args.candidateId,
    newVoteCount: event.args.newVoteCount,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
  });

  await context.db
    .insert(candidateResult)
    .values({
      id: `${event.log.address}-${event.args.candidateId.toString()}`,
      spaceAddress: event.log.address,
      spaceId: event.args.spaceId,
      candidateId: event.args.candidateId,
      voteCount: event.args.newVoteCount,
      lastRevealTx: event.transaction.hash,
      lastUpdatedAt: event.block.timestamp,
      lastUpdatedBlock: event.block.number,
    })
    .onConflictDoUpdate({
      voteCount: event.args.newVoteCount,
      lastRevealTx: event.transaction.hash,
      lastUpdatedAt: event.block.timestamp,
      lastUpdatedBlock: event.block.number,
    });

  const existingElection = await context.db.find(election, { id: event.log.address });
  if (!existingElection) return;

  await context.db.update(election, { id: event.log.address }).set((row) => ({
    totalRevealed: row.totalRevealed + 1,
    lastUpdatedAt: event.block.timestamp,
    lastUpdatedBlock: event.block.number,
    lastUpdatedTx: event.transaction.hash,
  }));
});

ponder.on("ElectionSpace:ElectionStatusChanged", async ({ event, context }) => {
  const existingElection = await context.db.find(election, { id: event.log.address });
  if (!existingElection) return;

  await context.db.update(election, { id: event.log.address }).set({
    status: Number(event.args.status),
    lastUpdatedAt: event.block.timestamp,
    lastUpdatedBlock: event.block.number,
    lastUpdatedTx: event.transaction.hash,
  });
});
