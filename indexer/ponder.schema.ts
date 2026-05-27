import { onchainSchema } from "@ponder/core";

export const schema = onchainSchema("indexer");

export const proposal = schema.table("proposals", (t) => ({
  id: t.bigint().primaryKey(),
  proposer: t.hex().notNull(),
  candidateCount: t.integer().notNull(),
  status: t.integer().notNull(),
  submittedAt: t.bigint().notNull(),
  reviewedAt: t.bigint(),
  reviewer: t.hex(),
  updatedAtBlock: t.bigint().notNull(),
  updatedAtTx: t.hex().notNull(),
}));

export const chainEvent = schema.table("chain_events", (t) => ({
  id: t.text().primaryKey(), // log id; stable identifier for every indexed event.
  actionType: t.text().notNull(),
  txHash: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  spaceAddress: t.hex(),
  spaceId: t.bigint(),
  proposalId: t.bigint(),
  actor: t.hex(),
  candidateId: t.bigint(),
  metadata: t.text().notNull(), // JSON string with only non-sensitive public event data.
}));

export const election = schema.table("elections", (t) => ({
  id: t.hex().primaryKey(), // ElectionSpace contract address.
  spaceId: t.bigint().notNull(),
  proposalId: t.bigint().notNull(),
  owner: t.hex().notNull(),
  candidateCount: t.integer().notNull(),
  phase: t.integer().notNull(),
  status: t.integer().notNull(),
  whitelistedCount: t.integer().notNull(),
  totalCommitted: t.integer().notNull(),
  totalRevealed: t.integer().notNull(),
  createdAt: t.bigint().notNull(),
  createdBlock: t.bigint().notNull(),
  createdTx: t.hex().notNull(),
  lastUpdatedAt: t.bigint().notNull(),
  lastUpdatedBlock: t.bigint().notNull(),
  lastUpdatedTx: t.hex().notNull(),
}));

export const voteCommit = schema.table("vote_commits", (t) => ({
  id: t.text().primaryKey(), // log id; avoids duplicate tx hash collisions.
  txHash: t.hex().notNull(),
  spaceAddress: t.hex().notNull(),
  spaceId: t.bigint().notNull(),
  voter: t.hex().notNull(),
  commitment: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const voteReveal = schema.table("vote_reveals", (t) => ({
  id: t.text().primaryKey(), // log id; avoids duplicate tx hash collisions.
  txHash: t.hex().notNull(),
  spaceAddress: t.hex().notNull(),
  spaceId: t.bigint().notNull(),
  voter: t.hex().notNull(),
  candidateId: t.bigint().notNull(),
  newVoteCount: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const candidateResult = schema.table("candidate_results", (t) => ({
  id: t.text().primaryKey(), // `${spaceAddress}-${candidateId}`.
  spaceAddress: t.hex().notNull(),
  spaceId: t.bigint().notNull(),
  candidateId: t.bigint().notNull(),
  voteCount: t.bigint().notNull(),
  lastRevealTx: t.hex().notNull(),
  lastUpdatedAt: t.bigint().notNull(),
  lastUpdatedBlock: t.bigint().notNull(),
}));
