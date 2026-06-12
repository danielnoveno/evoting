import { ponder } from "@/generated";

import {
  candidateResult,
  chainEvent,
  election,
  proposal,
  voteCommit,
  voteReveal,
} from "../ponder.schema";

const INITIAL_PHASE_REGISTRATION = 0;
const INITIAL_STATUS_ACTIVE = 0;

function stringifyMetadata(value: Record<string, unknown>) {
  return JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item);
}

async function insertChainEvent(
  context: Parameters<Parameters<typeof ponder.on>[1]>[0]["context"],
  event: Parameters<Parameters<typeof ponder.on>[1]>[0]["event"],
  values: {
    actionType: string;
    spaceAddress?: `0x${string}`;
    spaceId?: bigint;
    proposalId?: bigint;
    actor?: `0x${string}`;
    candidateId?: bigint;
    metadata?: Record<string, unknown>;
  },
) {
  await context.db.insert(chainEvent).values({
    id: event.log.id,
    actionType: values.actionType,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
    spaceAddress: values.spaceAddress ?? null,
    spaceId: values.spaceId ?? null,
    proposalId: values.proposalId ?? null,
    actor: values.actor ?? null,
    candidateId: values.candidateId ?? null,
    metadata: stringifyMetadata(values.metadata ?? {}),
  }).onConflictDoUpdate({
    actionType: values.actionType,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
    spaceAddress: values.spaceAddress ?? null,
    spaceId: values.spaceId ?? null,
    proposalId: values.proposalId ?? null,
    actor: values.actor ?? null,
    candidateId: values.candidateId ?? null,
    metadata: stringifyMetadata(values.metadata ?? {}),
  });
}

ponder.on("VoteChainRegistry:ProposalSubmitted", async ({ event, context }) => {
  await insertChainEvent(context, event, {
    actionType: "proposal_submitted",
    proposalId: event.args.proposalId,
    actor: event.args.proposer,
    metadata: { candidateCount: event.args.candidateCount },
  });

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
  await insertChainEvent(context, event, {
    actionType: "proposal_reviewed",
    proposalId: event.args.proposalId,
    actor: event.args.reviewer,
    metadata: { decision: event.args.decision },
  });

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
  await insertChainEvent(context, event, {
    actionType: "deploy_space",
    spaceAddress: event.args.space,
    spaceId: event.args.spaceId,
    proposalId: event.args.proposalId,
    actor: event.args.owner,
    metadata: {
      candidateCount: event.args.candidateCount,
    },
  });

  await context.db
    .insert(election)
    .values({
      id: event.args.space,
      spaceId: event.args.spaceId,
      proposalId: event.args.proposalId,
      owner: event.args.owner,
      candidateCount: Number(event.args.candidateCount),
      title: `Pemilihan #${event.args.spaceId.toString()}`,
      metadataURI: "",
      phase: INITIAL_PHASE_REGISTRATION,
      status: INITIAL_STATUS_ACTIVE,
      whitelistedCount: 0,
      totalCommitted: 0,
      totalRevealed: 0,
      createdAt: event.block.timestamp,
      createdBlock: event.block.number,
      createdTx: event.transaction.hash,
      lastUpdatedAt: event.block.timestamp,
      lastUpdatedBlock: event.block.number,
      lastUpdatedTx: event.transaction.hash,
    })
    .onConflictDoUpdate({
      proposalId: event.args.proposalId,
      owner: event.args.owner,
      candidateCount: Number(event.args.candidateCount),
      title: `Pemilihan #${event.args.spaceId.toString()}`,
      metadataURI: "",
      lastUpdatedAt: event.block.timestamp,
      lastUpdatedBlock: event.block.number,
      lastUpdatedTx: event.transaction.hash,
    });
});

ponder.on("ElectionSpace:PhaseChanged", async ({ event, context }) => {
  await insertChainEvent(context, event, {
    actionType: "phase_transition",
    spaceAddress: event.log.address,
    spaceId: event.args.spaceId,
    metadata: { previousPhase: event.args.previousPhase, newPhase: event.args.newPhase },
  });

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
  await insertChainEvent(context, event, {
    actionType: "whitelist_updated",
    spaceAddress: event.log.address,
    spaceId: event.args.spaceId,
    actor: event.args.voter,
    metadata: { isRegistered: event.args.isRegistered },
  });

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
  await insertChainEvent(context, event, {
    actionType: "commit_vote",
    spaceAddress: event.log.address,
    spaceId: event.args.spaceId,
    actor: event.args.voter,
    metadata: { commitment: event.args.commitment },
  });

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
  await insertChainEvent(context, event, {
    actionType: "reveal_vote",
    spaceAddress: event.log.address,
    spaceId: event.args.spaceId,
    actor: event.args.voter,
    candidateId: event.args.candidateId,
    metadata: { newVoteCount: event.args.newVoteCount },
  });

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
  await insertChainEvent(context, event, {
    actionType: "election_status_changed",
    spaceAddress: event.log.address,
    spaceId: event.args.spaceId,
    metadata: { status: event.args.status },
  });

  const existingElection = await context.db.find(election, { id: event.log.address });
  if (!existingElection) return;

  await context.db.update(election, { id: event.log.address }).set({
    status: Number(event.args.status),
    lastUpdatedAt: event.block.timestamp,
    lastUpdatedBlock: event.block.number,
    lastUpdatedTx: event.transaction.hash,
  });
});
